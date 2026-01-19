import requests
from bs4 import BeautifulSoup

def fetch_article_excerpt(url: str, max_words: int = 200) -> str:
    """
    Fetches the URL and extracts text from the first few paragraphs.
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        # Short timeout to not stall the request too long
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Encoding (headers): {response.encoding}")
        print(f"Apparent Encoding: {response.apparent_encoding}")
        
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
        
        return text[:1000] # Return first 1000 chars for debug
    except Exception as e:
        return f"Error extracting content: {str(e)}"

url = "https://www.inn.co.il/news/671301"
print(fetch_article_excerpt(url))
