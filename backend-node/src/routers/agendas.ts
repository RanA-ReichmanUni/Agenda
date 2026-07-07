import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { getDbPool } from '../database';
import { getCurrentUser, AuthRequest } from '../security';

const router = Router();

const ANALYSIS_SYSTEM_PROMPT = `You are a strict fact-checking analyst.
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
}`;

async function fetchArticleExcerpt(url: string, maxWords: number = 200): Promise<string> {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 4000
        });
        
        const $ = cheerio.load(response.data);
        $('script, style, nav, footer, header, aside').remove();
        
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        const words = text.split(' ');
        
        if (words.length > maxWords) {
            return words.slice(0, maxWords).join(' ') + '...';
        }
        return text;
    } catch (e) {
        return "";
    }
}

function getDomainOf(urlStr: string): string {
    try {
        const parsed = new URL(urlStr);
        return parsed.hostname.replace('www.', '') || 'unknown';
    } catch {
        return 'unknown';
    }
}

function computeNumericScore(articleScores: any[], evidence: any[]): number {
    if (!articleScores || articleScores.length === 0) return 0;

    let totalScore = 0;
    for (const a of articleScores) {
        totalScore += (a.score || 0);
    }
    const base = totalScore / articleScores.length;

    const relevant = articleScores.filter(a => (a.score || 0) >= 40);
    const nRelevant = relevant.length;
    const corroboration = Math.min(1.0, 0.55 + 0.15 * nRelevant);

    let diversity = 1.0;
    if (nRelevant > 0) {
        const urlById: Record<string, string> = {};
        for (const e of evidence) {
            urlById[e.id] = e.url || "";
        }
        
        const domains = new Set();
        for (const a of relevant) {
            const url = urlById[a.id] || "";
            domains.add(getDomainOf(url));
        }
        diversity = 0.85 + 0.15 * (domains.size / nRelevant);
    }

    const finalScore = Math.round(base * corroboration * Math.min(diversity, 1.0));
    return Math.max(0, Math.min(100, finalScore));
}

function getScoreBand(numericScore: number): string {
    if (numericScore >= 70) return "High";
    if (numericScore >= 40) return "Medium";
    return "Low";
}

function postprocessLlmResult(claim: string, evidence: any[], parsed: any): any {
    let reasoning = parsed.reasoning || "Analysis failed.";
    const audits = parsed.article_audits || [];
    
    const titleById: Record<string, string> = {};
    for (const e of evidence) {
        titleById[e.id] = e.title || "";
    }

    const articleScores = [];
    for (const a of audits) {
        if (!a || typeof a !== 'object') continue;
        
        let rawScore = parseFloat(a.support_score) || 0;
        
        articleScores.push({
            id: a.id,
            title: titleById[a.id] || "",
            topic: a.detected_topic || "",
            verdict: a.verdict || "Unknown",
            score: Math.max(0, Math.min(100, Math.round(rawScore)))
        });
    }

    let numericScore: number | null = null;
    let wordScore = parsed.score || "Low";

    if (articleScores.length > 0) {
        numericScore = computeNumericScore(articleScores, evidence);
        wordScore = getScoreBand(numericScore);
    } else {
        if (audits && Array.isArray(audits)) {
            const breakdown = audits
                .filter(a => typeof a === 'object')
                .map(a => `- ${a.id || '?'}: ${a.detected_topic || 'Unknown'} (${a.verdict || 'Unknown'})`)
                .join("\n");
            if (breakdown) {
                reasoning += "\n\nSource Breakdown:\n" + breakdown;
            }
        }
    }

    return {
        score: wordScore,
        numeric_score: numericScore,
        article_scores: articleScores.length > 0 ? articleScores : null,
        reasoning: reasoning,
        claim: claim
    };
}

async function callOpenRouterAnalysis(claim: string, evidence: any[]): Promise<any> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
    console.log("OpenRouter API Key present:", !!apiKey, "Model:", model);
    
    if (!apiKey) return null;

    const messages = [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { 
            role: "user", 
            content: JSON.stringify({
                task: "Evaluate whether the provided evidence supports the agenda claim.",
                agenda_claim: claim,
                evidence_items: evidence,
                instructions: {
                    evaluate_source_credibility: true,
                    evaluate_relevance_to_claim: true,
                    identify_missing_information: true,
                    score_each_article_individually: true,
                    return_confidence_level: ["Low", "Medium", "High"]
                }
            }) 
        }
    ];

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            { model, messages },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Agenda App"
                },
                timeout: 45000
            }
        );
        
        let content = response.data.choices[0].message.content.trim();
        
        content = content.replace(/```json/g, "").replace(/```/g, "");
        const startIdx = content.indexOf('{');
        const endIdx = content.lastIndexOf('}');
        
        if (startIdx !== -1 && endIdx !== -1) {
            content = content.substring(startIdx, endIdx + 1);
        }
        
        const parsed = JSON.parse(content);
        return postprocessLlmResult(claim, evidence, parsed);
    } catch (e: any) {
        console.error(`OpenRouter Error:`, e?.response?.data || e.message);
        return null;
    }
}

async function callGroqAnalysis(claim: string, evidence: any[]): Promise<any> {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_LLAMA_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
    console.log("Groq API Key present:", !!apiKey, "Model:", model);
    
    if (!apiKey) return null;

    try {
        const client = new Groq({ apiKey });
        
        const messages: any[] = [
            { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
            { 
                role: "user", 
                content: JSON.stringify({
                    task: "Evaluate whether the provided evidence supports the agenda claim.",
                    agenda_claim: claim,
                    evidence_items: evidence,
                    instructions: {
                        evaluate_source_credibility: true,
                        evaluate_relevance_to_claim: true,
                        identify_missing_information: true,
                        score_each_article_individually: true,
                        return_confidence_level: ["Low", "Medium", "High"]
                    }
                }) 
            }
        ];

        const completion = await client.chat.completions.create({
            messages,
            model,
            temperature: 0.3,
            max_tokens: 2048,
            response_format: { type: "json_object" }
        });
        
        let content = completion.choices[0]?.message?.content?.trim() || "{}";
        
        content = content.replace(/```json/g, "").replace(/```/g, "");
        const startIdx = content.indexOf('{');
        const endIdx = content.lastIndexOf('}');
        
        if (startIdx !== -1 && endIdx !== -1) {
            content = content.substring(startIdx, endIdx + 1);
        }
        
        const parsed = JSON.parse(content);
        return postprocessLlmResult(claim, evidence, parsed);
    } catch (e: any) {
        console.error(`Groq Error:`, e?.response?.data || e.message || e);
        return null;
    }
}

async function callLlmAnalysis(claim: string, evidence: any[]): Promise<any> {
    let result = await callGroqAnalysis(claim, evidence);
    if (result) return result;
    return await callOpenRouterAnalysis(claim, evidence);
}

router.post('/', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const { title } = req.body;
    const userId = req.user!.id;

    const pool = getDbPool();
    try {
        const result = await pool.query(
            "INSERT INTO agendas (user_id, title) VALUES ($1, $2) RETURNING id, user_id, title, created_at, share_token",
            [userId, title]
        );
        const row = result.rows[0];
        
        return res.status(201).json({
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            createdAt: row.created_at,
            share_token: row.share_token
        });
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.get('/', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const pool = getDbPool();
    try {
        const result = await pool.query(
            `SELECT id, user_id, title, created_at, share_token, analysis_score, 
             analysis_reasoning, analysis_article_count, analysis_numeric_score 
             FROM agendas WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        
        const agendas = result.rows.map(r => ({
            id: r.id,
            user_id: r.user_id,
            title: r.title,
            createdAt: r.created_at,
            share_token: r.share_token,
            analysisResult: r.analysis_score ? {
                score: r.analysis_score,
                reasoning: r.analysis_reasoning || "",
                claim: r.title,
                numeric_score: r.analysis_numeric_score,
                is_cached: true,
                is_stale: false,
                articleCount: r.analysis_article_count
            } : null
        }));
        
        return res.json(agendas);
    } catch (e: any) {
        // Fallback for old schema if needed
        try {
            const fallbackResult = await pool.query(
                "SELECT id, user_id, title, created_at FROM agendas WHERE user_id = $1 ORDER BY created_at DESC",
                [userId]
            );
            return res.json(fallbackResult.rows.map(r => ({
                id: r.id,
                user_id: r.user_id,
                title: r.title,
                createdAt: r.created_at
            })));
        } catch {
            return res.status(500).json({ detail: e.message });
        }
    }
});

router.get('/shared/:token', async (req: Request, res: Response) => {
    const token = req.params.token;

    const pool = getDbPool();
    try {
        const result = await pool.query(
            `SELECT a.id, a.user_id, a.title, a.created_at, a.share_token, u.name as owner_name, 
             a.analysis_score, a.analysis_reasoning, a.analysis_article_count, a.analysis_numeric_score
             FROM agendas a
             JOIN users u ON a.user_id = u.id
             WHERE a.share_token = $1`,
            [token]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ detail: "Agenda not found" });
        }
        
        const r = result.rows[0];
        return res.json({
            id: r.id,
            user_id: r.user_id,
            title: r.title,
            createdAt: r.created_at,
            share_token: r.share_token,
            owner_name: r.owner_name,
            analysisResult: r.analysis_score ? {
                score: r.analysis_score,
                reasoning: r.analysis_reasoning || "",
                claim: r.title,
                numeric_score: r.analysis_numeric_score,
                is_cached: true,
                is_stale: false,
                articleCount: r.analysis_article_count
            } : null
        });
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.get('/shared/:token/articles', async (req: Request, res: Response) => {
    const token = req.params.token;

    const pool = getDbPool();
    try {
        const agendaResult = await pool.query("SELECT id FROM agendas WHERE share_token = $1", [token]);
        if (agendaResult.rows.length === 0) {
            return res.status(404).json({ detail: "Agenda not found" });
        }
        const agendaId = agendaResult.rows[0].id;

        const result = await pool.query(
            `SELECT id, title, url, description, image, agenda_id, created_at 
             FROM articles WHERE agenda_id = $1 ORDER BY created_at DESC`,
            [agendaId]
        );
        
        return res.json(result.rows.map(a => ({
            id: a.id,
            title: a.title,
            url: a.url,
            description: a.description,
            image: a.image,
            agenda_id: a.agenda_id,
            createdAt: a.created_at
        })));
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.get('/:agenda_id', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const agendaId = parseInt(req.params.agenda_id as string, 10);
    const userId = req.user!.id;

    const pool = getDbPool();
    try {
        const result = await pool.query(
            `SELECT id, user_id, title, created_at, share_token, analysis_score, 
             analysis_reasoning, analysis_article_count, analysis_numeric_score 
             FROM agendas WHERE id = $1 AND user_id = $2`,
            [agendaId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ detail: "Agenda not found" });
        }
        
        const r = result.rows[0];
        return res.json({
            id: r.id,
            user_id: r.user_id,
            title: r.title,
            createdAt: r.created_at,
            share_token: r.share_token,
            analysisResult: r.analysis_score ? {
                score: r.analysis_score,
                reasoning: r.analysis_reasoning || "",
                claim: r.title,
                numeric_score: r.analysis_numeric_score,
                is_cached: true,
                is_stale: false,
                articleCount: r.analysis_article_count
            } : null
        });
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.post('/:agenda_id/share', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const agendaId = parseInt(req.params.agenda_id as string, 10);
    const userId = req.user!.id;

    const pool = getDbPool();
    try {
        const result = await pool.query(
            "SELECT id, user_id, title, created_at, share_token FROM agendas WHERE id = $1 AND user_id = $2",
            [agendaId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ detail: "Agenda not found" });
        }
        
        const row = result.rows[0];
        if (row.share_token) {
            return res.json({
                id: row.id, user_id: row.user_id, title: row.title, 
                createdAt: row.created_at, share_token: row.share_token
            });
        }

        const newToken = crypto.randomUUID();
        await pool.query("UPDATE agendas SET share_token = $1 WHERE id = $2", [newToken, agendaId]);
        
        return res.json({
            id: row.id, user_id: row.user_id, title: row.title, 
            createdAt: row.created_at, share_token: newToken
        });
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.post('/:agenda_id/unshare', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const agendaId = parseInt(req.params.agenda_id as string, 10);
    const userId = req.user!.id;

    const pool = getDbPool();
    try {
        const result = await pool.query(
            "SELECT id, user_id, title, created_at FROM agendas WHERE id = $1 AND user_id = $2",
            [agendaId, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ detail: "Agenda not found" });
        }
        
        await pool.query("UPDATE agendas SET share_token = NULL WHERE id = $1", [agendaId]);
        const row = result.rows[0];
        
        return res.json({
            id: row.id, user_id: row.user_id, title: row.title, 
            createdAt: row.created_at, share_token: null
        });
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.patch('/:agenda_id', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const agendaId = parseInt(req.params.agenda_id as string, 10);
    const { title } = req.body;
    const userId = req.user!.id;

    const pool = getDbPool();
    try {
        const check = await pool.query("SELECT id FROM agendas WHERE id = $1 AND user_id = $2", [agendaId, userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ detail: "Agenda not found" });
        }
        
        const result = await pool.query(
            "UPDATE agendas SET title = $1 WHERE id = $2 RETURNING id, user_id, title, created_at, share_token",
            [title, agendaId]
        );
        const row = result.rows[0];
        
        return res.json({
            id: row.id, user_id: row.user_id, title: row.title, 
            createdAt: row.created_at, share_token: row.share_token
        });
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.delete('/:agenda_id', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const agendaId = parseInt(req.params.agenda_id as string, 10);
    const userId = req.user!.id;

    const pool = getDbPool();
    try {
        const check = await pool.query("SELECT id FROM agendas WHERE id = $1 AND user_id = $2", [agendaId, userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ detail: "Agenda not found" });
        }
        
        await pool.query("DELETE FROM agendas WHERE id = $1", [agendaId]);
        return res.status(204).send();
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.post('/analyze-raw', async (req: Request, res: Response) => {
    const { claim, articles } = req.body;
    
    if (!claim || !Array.isArray(articles)) {
        return res.status(400).json({ detail: "Invalid request payload" });
    }

    const evidenceItems = [];
    for (let i = 0; i < articles.length; i++) {
        const a = articles[i];
        let excerpt = a.url ? await fetchArticleExcerpt(a.url) : null;
        if (!excerpt) excerpt = a.description;
        
        evidenceItems.push({
            id: `a${i}`,
            title: a.title || "Unknown Title",
            url: a.url,
            publisher: a.url ? getDomainOf(a.url) : "Unknown",
            excerpt: excerpt
        });
    }

    const llmResult = await callLlmAnalysis(claim, evidenceItems);
    if (llmResult) {
        return res.json(llmResult);
    }
    
    // Fallback Simulation
    await new Promise(r => setTimeout(r, 1000));
    return res.json({
        score: "Low",
        reasoning: "Real AI service unavailable. (Demo mode fallback)",
        claim: claim
    });
});

router.post('/shared/:share_token/analyze', async (req: Request, res: Response) => {
    const token = req.params.share_token;

    const pool = getDbPool();
    try {
        const agendaResult = await pool.query("SELECT id, title FROM agendas WHERE share_token = $1", [token]);
        if (agendaResult.rows.length === 0) {
            return res.status(404).json({ detail: "Shared agenda not found" });
        }
        
        const agendaId = agendaResult.rows[0].id;
        const claim = agendaResult.rows[0].title;
        
        const articlesResult = await pool.query("SELECT title, url, description FROM articles WHERE agenda_id = $1", [agendaId]);
        const articles = articlesResult.rows;
        
        const evidenceItems = [];
        for (let i = 0; i < articles.length; i++) {
            const a = articles[i];
            const excerpt = await fetchArticleExcerpt(a.url);
            evidenceItems.push({
                id: `a${i}`,
                title: a.title,
                url: a.url,
                publisher: getDomainOf(a.url),
                excerpt: excerpt
            });
        }
        
        const llmResult = await callLlmAnalysis(claim, evidenceItems);
        if (llmResult) {
            return res.json(llmResult);
        }

        // Fallback Simulation
        await new Promise(r => setTimeout(r, 1500));
        
        if (articles.length === 0) {
            return res.json({
                score: "Low",
                reasoning: "No evidence provided. Please add articles to verify this claim.",
                claim: claim
            });
        }
        
        const authoritativeKeywords = ["report", "study", "evidence", "confirmed", "analysis", "data", "statistics", "review", "official", "survey", "court", "verdict", "proof", "science", "research"];
        let qualityMatches = 0;
        
        for (const a of articles) {
            const textBlob = `${a.title} ${a.description}`.toLowerCase();
            if (authoritativeKeywords.some(kw => textBlob.includes(kw))) {
                qualityMatches++;
            }
        }
        
        const scoreVal = (qualityMatches / articles.length) * 100;
        let scoreStr = "Low";
        if (scoreVal >= 70) scoreStr = "High";
        else if (scoreVal >= 40) scoreStr = "Medium";
        
        return res.json({
            score: scoreStr,
            numeric_score: Math.round(scoreVal),
            reasoning: `Analyzed ${articles.length} articles using fallback logic. Found ${qualityMatches} high-quality sources based on keyword analysis.`,
            claim: claim
        });
        
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    }
});

router.post('/:agenda_id/analyze', getCurrentUser, async (req: AuthRequest, res: Response) => {
    const agendaId = parseInt(req.params.agenda_id as string, 10);
    const forceRefresh = req.body.force_refresh === true;
    const userId = req.user!.id;

    const pool = getDbPool();
    const client = await pool.connect();
    
    try {
        const agendaResult = await client.query(
            "SELECT title, analysis_score, analysis_reasoning, last_analyzed_at, analysis_article_count, analysis_numeric_score FROM agendas WHERE id = $1 AND user_id = $2",
            [agendaId, userId]
        );
        
        if (agendaResult.rows.length === 0) {
            return res.status(404).json({ detail: "Agenda not found" });
        }
        
        const row = agendaResult.rows[0];
        const claim = row.title;
        const cachedScore = row.analysis_score;
        const cachedReasoning = row.analysis_reasoning;
        const cachedCount = row.analysis_article_count;
        const cachedNumeric = row.analysis_numeric_score;

        const articlesResult = await client.query("SELECT title, url, description FROM articles WHERE agenda_id = $1", [agendaId]);
        const articles = articlesResult.rows;
        const currentCount = articles.length;

        if (cachedScore && cachedReasoning && !forceRefresh) {
            if (cachedCount === currentCount) {
                return res.json({
                    score: cachedScore,
                    reasoning: cachedReasoning,
                    claim: claim,
                    numeric_score: cachedNumeric,
                    is_cached: true,
                    is_stale: false
                });
            } else {
                return res.json({
                    score: cachedScore,
                    reasoning: cachedReasoning,
                    claim: claim,
                    numeric_score: cachedNumeric,
                    is_cached: true,
                    is_stale: true
                });
            }
        }

        const evidenceItems = [];
        for (let i = 0; i < articles.length; i++) {
            const a = articles[i];
            const excerpt = await fetchArticleExcerpt(a.url);
            evidenceItems.push({
                id: `a${i}`,
                title: a.title,
                url: a.url,
                publisher: getDomainOf(a.url),
                excerpt: excerpt
            });
        }

        const llmResult = await callLlmAnalysis(claim, evidenceItems);
        let result: any = null;

        if (llmResult) {
            result = llmResult;
        } else {
            // Fallback
            await new Promise(r => setTimeout(r, 1500));
            if (currentCount === 0) {
                result = {
                    score: "Low",
                    reasoning: "No evidence provided. Please add articles to verify this claim.",
                    claim: claim
                };
            } else {
                result = {
                    score: "Low",
                    reasoning: `Analysis simulation (Real AI failed). Based on ${currentCount} articles.`,
                    claim: claim
                };
            }
        }

        if (result && result.score) {
            try {
                await client.query(`
                    UPDATE agendas
                    SET analysis_score = $1,
                        analysis_reasoning = $2,
                        last_analyzed_at = CURRENT_TIMESTAMP,
                        analysis_article_count = $3,
                        analysis_numeric_score = $4
                    WHERE id = $5
                `, [result.score, result.reasoning, currentCount, result.numeric_score || null, agendaId]);
            } catch (e) {
                console.error(`Cache update failed: ${e}`);
            }
        }

        result.is_cached = false;
        result.is_stale = false;
        return res.json(result);
        
    } catch (e: any) {
        return res.status(500).json({ detail: e.message });
    } finally {
        client.release();
    }
});

export default router;
