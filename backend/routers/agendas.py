"""
Agenda CRUD routes for creating, reading, updating, and deleting agendas.
"""
import uuid
from typing import List, Optional
import time
import random
import os
try:
    from urllib.parse import urlparse
except ImportError:
    from urlparse import urlparse

from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from database import get_db_connection
from models import User, Agenda, CreateAgenda, Article, AnalysisResult
from security import get_current_user
import requests
from bs4 import BeautifulSoup
import json
from groq import Groq, GroqError

router = APIRouter()

def fetch_article_excerpt(url: str, max_words: int = 200) -> str:
    """
    Fetches the URL and extracts text from the first few paragraphs.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # Short timeout to not stall the request too long
        response = requests.get(url, headers=headers, timeout=4)
        if response.status_code != 200:
            return "Could not fetch content."
            
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
            script.decompose()
            
        # Get text
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        # Truncate
        words = text.split()
        if len(words) > max_words:
            return ' '.join(words[:max_words]) + "..."
        return text
    except Exception as e:
        return f"Error extracting content: {str(e)}"

ANALYSIS_SYSTEM_PROMPT = """You are a strict fact-checking analyst.
        Your ONLY job is to verify if the *actual content* of the provided articles supports the user's claim.

        CRITICAL INSTRUCTIONS:
        1. **Summarize First**: For EACH evidence item, you MUST first write a 1-sentence summary of what it *actually* says.
        2. **Translate if needed**: If the text is not English, translate the main topic in your summary to verify relevance.
        3. **Strict Relevance Check**:
           - Compare the article's *actual topic* to the user's *claim*.
           - If the topics are unrelated (e.g. claim is about "Technology" but article is about "Politics"), mark it as **IRRELEVANT**.
           - Do NOT force a connection where none exists.
        4. **Score each article individually**: assign a "support_score" (integer 0-100) measuring how specifically the article's ACTUAL content supports THIS exact claim:
           - 80-100: directly and substantively supports the claim (on-topic, provides data/expert findings)
           - 50-79: supports the claim partially or indirectly
           - 20-49: topically related but weak, tangential, or opinion-only support
           - 0-19: irrelevant to the claim, or contradicts it

        Output Format (JSON):
        {
            "article_audits": [
                { "id": "a0", "detected_topic": "...", "verdict": "Relevant" | "Irrelevant", "support_score": 85 }
            ],
            "score": "High" | "Medium" | "Low",
            "reasoning": "Combine audits into a final judgment. Explicitly mention any rejected articles."
        }
        """

def _domain_of(url: str) -> str:
    try:
        return urlparse(url).netloc.replace('www.', '') or 'unknown'
    except Exception:
        return 'unknown'

def compute_numeric_score(article_scores: list, evidence: list) -> int:
    """
    Aggregate per-article LLM support scores into a single 0-100 credibility score.

    Formula:
      base          = mean of ALL per-article support scores (junk sources drag the average down)
      corroboration = min(1.0, 0.55 + 0.15 * n_relevant)  -> a single-source claim is capped at 70%
                      of its face value; 3+ independent relevant sources earn full weight
      diversity     = 0.85 + 0.15 * (unique_domains / n_relevant) -> repeating the same outlet
                      is discounted vs. independent corroboration
      final         = round(base * corroboration * diversity), clamped to [0, 100]
    """
    if not article_scores:
        return 0

    base = sum(a["score"] for a in article_scores) / len(article_scores)
    relevant = [a for a in article_scores if a["score"] >= 40]
    n_relevant = len(relevant)
    corroboration = min(1.0, 0.55 + 0.15 * n_relevant)

    if n_relevant:
        url_by_id = {e["id"]: e.get("url", "") for e in evidence}
        domains = {_domain_of(url_by_id.get(a.get("id"), "")) for a in relevant}
        diversity = 0.85 + 0.15 * (len(domains) / n_relevant)
    else:
        diversity = 1.0

    return max(0, min(100, round(base * corroboration * min(diversity, 1.0))))

def score_band(numeric_score: int) -> str:
    """Map a 0-100 credibility score onto the High/Medium/Low bands."""
    if numeric_score >= 70:
        return "High"
    if numeric_score >= 40:
        return "Medium"
    return "Low"

def postprocess_llm_result(claim: str, evidence: list, parsed: dict) -> dict:
    """
    Turn the raw LLM JSON into the API result: extract per-article scores,
    aggregate them deterministically (never trust LLM arithmetic), and derive
    the word score from the numeric one so badge and number always agree.
    """
    reasoning = parsed.get("reasoning", "Analysis failed.")
    audits = parsed.get("article_audits", []) or []
    title_by_id = {e["id"]: e.get("title", "") for e in evidence}

    article_scores = []
    for a in audits:
        if not isinstance(a, dict):
            continue
        try:
            raw_score = float(a.get("support_score", 0))
        except (TypeError, ValueError):
            raw_score = 0.0
        article_scores.append({
            "id": a.get("id"),
            "title": title_by_id.get(a.get("id"), ""),
            "topic": a.get("detected_topic", ""),
            "verdict": a.get("verdict", "Unknown"),
            "score": max(0, min(100, round(raw_score))),
        })

    if article_scores:
        numeric_score = compute_numeric_score(article_scores, evidence)
        word_score = score_band(numeric_score)
    else:
        # Legacy path: model returned no audits; keep its word score and append
        # the old text breakdown so nothing is lost.
        numeric_score = None
        word_score = parsed.get("score", "Low")
        if audits and isinstance(audits, list):
            reasoning += "\n\nSource Breakdown:\n" + "\n".join(
                [f"- {a.get('id', '?')}: {a.get('detected_topic', 'Unknown')} ({a.get('verdict', 'Unknown')})" for a in audits if isinstance(a, dict)]
            )

    return {
        "score": word_score,
        "numeric_score": numeric_score,
        "article_scores": article_scores or None,
        "reasoning": reasoning,
        "claim": claim
    }

def call_openrouter_analysis(claim: str, evidence: list) -> Optional[dict]:
    """
    Calls OpenRouter LLM to analyze the claim based on evidence.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-20b:free")
    print(f"DEBUG: Checking for API Key... Found? {bool(api_key)}")
    if not api_key:
        print("DEBUG: No API Key found, skipping LLM.")
        return None

    print(f"DEBUG: Calling OpenRouter model '{model}' with {len(evidence)} evidence items...")
    # DEBUG: Print the evidence being sent to checking for empty/malformed content
    for item in evidence:
        print(f"DEBUG EVIDENCE ITEM {item['id']}: URL={item['url']} CONTENT_PREVIEW={item['excerpt'][:100]}...")

    messages = [
      {
        "role": "system",
        "content": ANALYSIS_SYSTEM_PROMPT
      },
      {
        "role": "user",
        "content": json.dumps({
          "task": "Evaluate whether the provided evidence supports the agenda claim.",
          "agenda_claim": claim,
          "evidence_items": evidence,
          "instructions": {
            "evaluate_source_credibility": True,
            "evaluate_relevance_to_claim": True,
            "identify_missing_information": True,
            "score_each_article_individually": True,
            "return_confidence_level": ["Low", "Medium", "High"]
          }
        }, ensure_ascii=False)
      }
    ]

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000", 
                "X-Title": "Agenda App"
            },
            json={
                "model": model,
                "messages": messages
            },
            timeout=45
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content'].strip()
            print(f"DEBUG OPENROUTER RAW CONTENT: {content}")
            # Clean content if it has markdown code blocks
            if "```json" in content:
                content = content.replace("```json", "").replace("```", "")
            elif "```" in content:
                content = content.replace("```", "")
            
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            if start_idx != -1 and end_idx != -1:
                content = content[start_idx:end_idx+1]
            
            parsed = json.loads(content)
            return postprocess_llm_result(claim, evidence, parsed)
        else:
            print(f"LLM API Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"LLM Exception: {str(e)}")
        return None

def call_groq_analysis(claim: str, evidence: list) -> Optional[dict]:
    """
    Calls Groq LLM to analyze the claim based on evidence.
    """
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_LLAMA_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    print(f"DEBUG: Checking for Groq API Key... Found? {bool(api_key)}")
    if not api_key:
        print("DEBUG: No Groq API Key found, skipping Groq.")
        return None

    try:
        client = Groq(api_key=api_key)
    except Exception as e:
        print(f"DEBUG: Error initializing Groq client: {e}")
        return None

    print(f"DEBUG: Calling Groq model '{model}' with {len(evidence)} evidence items...")
    for item in evidence:
        print(f"DEBUG GROQ EVIDENCE ITEM {item['id']}: URL={item['url']} CONTENT_PREVIEW={item['excerpt'][:100]}...")

    messages = [
      {
        "role": "system",
        "content": ANALYSIS_SYSTEM_PROMPT
      },
      {
        "role": "user",
        "content": json.dumps({
          "task": "Evaluate whether the provided evidence supports the agenda claim.",
          "agenda_claim": claim,
          "evidence_items": evidence,
          "instructions": {
            "evaluate_source_credibility": True,
            "evaluate_relevance_to_claim": True,
            "identify_missing_information": True,
            "score_each_article_individually": True,
            "return_confidence_level": ["Low", "Medium", "High"]
          }
        }, ensure_ascii=False)
      }
    ]

    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
        
        content = chat_completion.choices[0].message.content.strip()
        print(f"DEBUG GROQ RAW CONTENT: {content}")
        # Clean content if it has markdown code blocks
        if "```json" in content:
            content = content.replace("```json", "").replace("```", "")
        elif "```" in content:
            content = content.replace("```", "")
        
        start_idx = content.find('{')
        end_idx = content.rfind('}')
        if start_idx != -1 and end_idx != -1:
            content = content[start_idx:end_idx+1]
        
        parsed = json.loads(content)
        return postprocess_llm_result(claim, evidence, parsed)
    except GroqError as e:
        print(f"DEBUG: Groq API Error - {e}")
        return None
    except Exception as e:
        print(f"DEBUG: Groq Exception: {str(e)}")
        return None

def call_llm_analysis(claim: str, evidence: list) -> Optional[dict]:
    """
    Main entry point for LLM analysis.
    First attempts to use Groq as the primary framework.
    If the call to Groq fails for any reason, falls back to OpenRouter.
    """
    print("DEBUG: Attempting primary LLM call using Groq...")
    result = call_groq_analysis(claim, evidence)
    if result is not None:
        return result
    
    print("DEBUG: Primary LLM call with Groq failed or unavailable. Falling back to secondary OpenRouter...")
    return call_openrouter_analysis(claim, evidence)

@router.post("", response_model=Agenda, status_code=status.HTTP_201_CREATED)
async def create_agenda(
    agenda: CreateAgenda,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new agenda for the authenticated user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO agendas (user_id, title) VALUES (%s, %s) RETURNING id, user_id, title, created_at, share_token",
            (current_user.id, agenda.title)
        )
        row = cursor.fetchone()
        conn.commit()
        # Handle potential older DB schema without share_token column (though migration should help)
        share_token = row[4] if len(row) > 4 else None
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=share_token)
    finally:
        conn.close()


@router.get("", response_model=List[Agenda])
async def get_agendas(current_user: User = Depends(get_current_user)):
    """
    Get all agendas for the authenticated user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Try to select with share_token
        try:
            cursor.execute(
                "SELECT id, user_id, title, created_at, share_token, analysis_score, analysis_reasoning, analysis_article_count, analysis_numeric_score FROM agendas WHERE user_id = %s ORDER BY created_at DESC",
                (current_user.id,)
            )
        except Exception:
            conn.rollback()
            # Fallback for old schema if migration failed
            cursor.execute(
                "SELECT id, user_id, title, created_at FROM agendas WHERE user_id = %s ORDER BY created_at DESC",
                (current_user.id,)
            )
            rows = cursor.fetchall()
            return [Agenda(id=r[0], user_id=r[1], title=r[2], createdAt=r[3]) for r in rows]

        rows = cursor.fetchall()
        return [
            Agenda(
                id=r[0],
                user_id=r[1],
                title=r[2],
                createdAt=r[3],
                share_token=r[4],
                analysisResult=(
                    AnalysisResult(
                        score=r[5],
                        reasoning=r[6] or "",
                        claim=r[2],
                        numeric_score=r[8],
                        is_cached=True,
                        is_stale=False,
                        articleCount=r[7]
                    )
                    if r[5]
                    else None
                )
            )
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/shared/{token}", response_model=Agenda)
async def get_shared_agenda(token: str):
    """
    Get a shared agenda by token (Public access).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            SELECT a.id, a.user_id, a.title, a.created_at, a.share_token, u.name, a.analysis_score, a.analysis_reasoning, a.analysis_article_count, a.analysis_numeric_score
            FROM agendas a
            JOIN users u ON a.user_id = u.id
            WHERE a.share_token = %s
            """,
            (token,)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        return Agenda(
            id=row[0], 
            user_id=row[1], # Returning user_id is fine, it's public info anyway that someone owns it
            title=row[2], 
            createdAt=row[3], 
            share_token=row[4],
            owner_name=row[5],
            analysisResult=(
                AnalysisResult(
                    score=row[6],
                    reasoning=row[7] or "",
                    claim=row[2],
                    numeric_score=row[9],
                    is_cached=True,
                    is_stale=False,
                    articleCount=row[8]
                )
                if row[6]
                else None
            )
        )
    finally:
        conn.close()


@router.get("/shared/{token}/articles", response_model=List[Article])
async def get_shared_agenda_articles(token: str):
    """
    Get articles for a shared agenda (Public access).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # First resolve the token to an ID
        cursor.execute("SELECT id FROM agendas WHERE share_token = %s", (token,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        agenda_id = row[0]

        cursor.execute(
            "SELECT id, title, url, description, image, agenda_id, created_at FROM articles WHERE agenda_id = %s ORDER BY created_at DESC",
            (agenda_id,)
        )
        articles = cursor.fetchall()
        return [
            Article(
                id=a[0],
                title=a[1],
                url=a[2],
                description=a[3],
                image=a[4],
                agenda_id=a[5],
                createdAt=a[6]
            ) 
            for a in articles
        ]
    finally:
        conn.close()


@router.get("/{agenda_id}", response_model=Agenda)
async def get_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific agenda by ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Try select with share_token
        try:
            cursor.execute(
                "SELECT id, user_id, title, created_at, share_token, analysis_score, analysis_reasoning, analysis_article_count, analysis_numeric_score FROM agendas WHERE id = %s AND user_id = %s",
                (agenda_id, current_user.id)
            )
        except Exception:
            conn.rollback()
            cursor.execute(
                "SELECT id, user_id, title, created_at FROM agendas WHERE id = %s AND user_id = %s",
                (agenda_id, current_user.id)
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Agenda not found")
            return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3])

        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        return Agenda(
            id=row[0],
            user_id=row[1],
            title=row[2],
            createdAt=row[3],
            share_token=row[4],
            analysisResult=(
                AnalysisResult(
                    score=row[5],
                    reasoning=row[6] or "",
                    claim=row[2],
                    numeric_score=row[8],
                    is_cached=True,
                    is_stale=False,
                    articleCount=row[7]
                )
                if row[5]
                else None
            )
        )
    finally:
        conn.close()


@router.post("/{agenda_id}/share", response_model=Agenda)
async def share_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Generate or retrieve a share token for an agenda.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership
        cursor.execute(
            "SELECT id, user_id, title, created_at, share_token FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        existing_token = row[4]
        if existing_token:
             return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=existing_token)

        # Generate new token
        new_token = str(uuid.uuid4())
        cursor.execute(
            "UPDATE agendas SET share_token = %s WHERE id = %s",
            (new_token, agenda_id)
        )
        conn.commit()
        
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=new_token)
    finally:
        conn.close()


@router.post("/{agenda_id}/unshare", response_model=Agenda)
async def unshare_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Revoke the share token for an agenda.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership
        cursor.execute(
            "SELECT id, user_id, title, created_at FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        cursor.execute(
            "UPDATE agendas SET share_token = NULL WHERE id = %s",
            (agenda_id,)
        )
        conn.commit()
        
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=None)
    finally:
        conn.close()


@router.patch("/{agenda_id}", response_model=Agenda)
async def update_agenda(
    agenda_id: int,
    agenda_update: CreateAgenda, 
    current_user: User = Depends(get_current_user)
):
    """
    Update an agenda title.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership
        cursor.execute(
            "SELECT id FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        cursor.execute(
            "UPDATE agendas SET title = %s WHERE id = %s RETURNING id, user_id, title, created_at, share_token",
            (agenda_update.title, agenda_id)
        )
        row = cursor.fetchone()
        conn.commit()
        return Agenda(id=row[0], user_id=row[1], title=row[2], createdAt=row[3], share_token=row[4])
    finally:
        conn.close()


@router.delete("/{agenda_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agenda(
    agenda_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an agenda and all its articles.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Verify ownership
        cursor.execute(
            "SELECT id FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Agenda not found")
        
        # Delete agenda (articles will cascade delete)
        cursor.execute("DELETE FROM agendas WHERE id = %s", (agenda_id,))
        conn.commit()
    finally:
        conn.close()

# Define a model for raw analysis requests
class RawArticleData(BaseModel):
    title: str = "Unknown Title"
    url: str
    description: str = ""

class RawAnalysisRequest(BaseModel):
    claim: str
    articles: List[RawArticleData]

@router.post("/analyze-raw")
async def analyze_raw_claim(request: RawAnalysisRequest):
    """
    Analyze a claim using raw data provided in the request body.
    Useful for Demo Mode where data isn't in the DB.
    """
    claim = request.claim
    raw_articles = request.articles
    
    # Prepare evidence
    evidence_items = []
    for i, a in enumerate(raw_articles):
        # Helper to fetch excerpt (reuse the existing mechanism by calling function if available or simulating)
        # We need to make sure 'fetch_article_excerpt' is available in scope or moved up.
        # Assuming it is available (it was used in previous function).
        url = a.url
        excerpt = fetch_article_excerpt(url) if url else a.description
        
        evidence_items.append({
            "id": f"a{i}",
            "title": a.title,
            "url": url,
            "publisher": urlparse(url).netloc if url else "Unknown",
            "excerpt": excerpt
        })

    # Try real LLM
    llm_result = call_llm_analysis(claim, evidence_items)
    
    if llm_result:
        return llm_result
        
    # Fallback Simulation
    time.sleep(1.0)
    return {
        "score": "Low",
        "reasoning": "Real AI service unavailable. (Demo mode fallback)",
        "claim": claim
    }


@router.post("/shared/{share_token}/analyze")
async def analyze_shared_agenda_claim(share_token: str):
    """
    Analyze the agenda claim for a shared agenda (public access).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Fetch Agenda by Token
        cursor.execute(
            "SELECT id, title FROM agendas WHERE share_token = %s",
            (share_token,)
        )
        agenda_row = cursor.fetchone()
        if not agenda_row:
            raise HTTPException(status_code=404, detail="Shared agenda not found")
        
        agenda_id = agenda_row[0]
        claim = agenda_row[1]
        
        # 2. Fetch Articles
        cursor.execute(
            "SELECT title, url, description FROM articles WHERE agenda_id = %s",
            (agenda_id,)
        )
        articles = cursor.fetchall()
        
        # 3. LLM Analysis Logic
        
        # Prepare evidence
        evidence_items = []
        for i, a in enumerate(articles):
            # a = (title, url, description)
            url = a[1]
            excerpt = fetch_article_excerpt(url)
            evidence_items.append({
                "id": f"a{i}",
                "title": a[0],
                "url": url,
                "publisher": urlparse(url).netloc,
                "excerpt": excerpt
            })
            
        # Try real LLM first
        llm_result = call_llm_analysis(claim, evidence_items)
        if llm_result:
            return llm_result

        # Fallback to Simulation
        time.sleep(1.5) # Fake "thinking" time
        
        count = len(articles)
        
        if count == 0:
            return {
                "score": "Low",
                "reasoning": "No evidence provided. Please add articles to verify this claim.",
                "claim": claim
            }

        # CRITERIA 1: Keywords looking for "Hard Evidence" 
        authoritative_keywords = ["report", "study", "evidence", "confirmed", "analysis", "data", "statistics", "review", "official", "survey", "court", "verdict", "proof", "science", "research"]
        
        quality_matches = 0
        for a in articles:
            text_blob = (str(a[0]) + " " + str(a[2])).lower()
            if any(kw in text_blob for kw in authoritative_keywords):
                quality_matches += 1

        # CRITERIA 2: Diversity of Sources
        unique_domains = set()
        for a in articles:
            url = a[1]
            try:
                domain = urlparse(url).netloc.replace('www.', '')
                if domain:
                    unique_domains.add(domain)
            except:
                pass
        
        num_unique = len(unique_domains)
        
        # SCORING ALGORITHM
        points = (count * 10) + (num_unique * 15) + (quality_matches * 10)

        score = "Low"
        reasoning_detail = ""

        if points >= 65: 
            score = "High"
            reasoning_detail = f"Strong consensus detected across about {num_unique} unique domains. The semantic analysis identified authoritative terminology (e.g., study, data) that strongly supports the claim."
        elif points >= 35: 
            score = "Medium"
            reasoning_detail = f"Evidence is present ({count} sources) and appears relevant. Usage of { 'a single source' if num_unique == 1 else 'diverse sources' } provides a partial correlation. Adding one more distinct source would likely elevate this to a high confidence level."
        else:
            score = "Low"
            reasoning_detail = f"Insufficient data density. With only {count} source(s) and limited cross-referencing, the claim lacks the verifiable weight required for a definitive rating."
            
        return {
            "score": score,
            "reasoning": reasoning_detail, 
            "claim": claim
        }

    finally:
        conn.close()


@router.post("/{agenda_id}/analyze")
async def analyze_agenda_claim(
    agenda_id: int, 
    force_refresh: bool = False,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze the agenda claim against its articles using (Simulated) AI.
    Eventually, this will connect to a real LLM API (OpenAI/Anthropic).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Fetch Agenda
        cursor.execute(
            "SELECT title, analysis_score, analysis_reasoning, last_analyzed_at, analysis_article_count, analysis_numeric_score FROM agendas WHERE id = %s AND user_id = %s",
            (agenda_id, current_user.id)
        )
        agenda_row = cursor.fetchone()
        if not agenda_row:
            raise HTTPException(status_code=404, detail="Agenda not found")

        claim = agenda_row[0]
        cached_score = agenda_row[1]
        cached_reasoning = agenda_row[2]
        cached_count = agenda_row[4]
        cached_numeric = agenda_row[5]
        
        # 2. Fetch Articles
        cursor.execute(
            "SELECT title, url, description FROM articles WHERE agenda_id = %s",
            (agenda_id,)
        )
        articles = cursor.fetchall()
        current_count = len(articles)

        # Check for cache validity
        if cached_score and cached_reasoning and not force_refresh:
             if cached_count == current_count:
                 return {
                     "score": cached_score,
                     "reasoning": cached_reasoning,
                     "claim": claim,
                     "numeric_score": cached_numeric,
                     "is_cached": True,
                     "is_stale": False
                 }
             else:
                 # Return STALE cache so user can decide to re-run
                 return {
                     "score": cached_score,
                     "reasoning": cached_reasoning,
                     "claim": claim,
                     "numeric_score": cached_numeric,
                     "is_cached": True,
                     "is_stale": True
                 }
        
        evidence_items = []
        for i, a in enumerate(articles):
            # a = (title, url, description)
            url = a[1]
            excerpt = fetch_article_excerpt(url)
            evidence_items.append({
                "id": f"a{i}",
                "title": a[0],
                "url": url,
                "publisher": urlparse(url).netloc,
                "excerpt": excerpt
            })
            
        # Try real LLM first
        llm_result = call_llm_analysis(claim, evidence_items)
        
        result = None
        if llm_result:
            result = llm_result
        else:
            # Fallback to Simulation if LLM fails or no key
            time.sleep(1.5) # Fake "thinking" time
            
            count = len(articles)
            
            if count == 0:
                result = {
                    "score": "Low",
                    "reasoning": "No evidence provided. Please add articles to verify this claim.",
                    "claim": claim
                }
            else:
                 # Sim Logic
                result = {
                    "score": "Low",
                    "reasoning": f"Analysis simulation (Real AI failed). Based on {count} articles.",
                    "claim": claim
                }

        # Save Cache
        if result and result.get("score"):
             try:
                cursor.execute("""
                    UPDATE agendas
                    SET analysis_score = %s,
                        analysis_reasoning = %s,
                        last_analyzed_at = CURRENT_TIMESTAMP,
                        analysis_article_count = %s,
                        analysis_numeric_score = %s
                    WHERE id = %s
                """, (result["score"], result["reasoning"], current_count, result.get("numeric_score"), agenda_id))
                conn.commit()
             except Exception as e:
                print(f"Cache update failed: {e}")
                conn.rollback()

        # Add stale flag to result (it's fresh now)
        result["is_cached"] = False
        result["is_stale"] = False
        return result

    finally:
        conn.close()
