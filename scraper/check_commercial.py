import requests
from bs4 import BeautifulSoup

url = "https://www.mzsa.ru/goods/commerce/"
try:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/goods/" in href and href.endswith(".html"):
            links.append(href)
            
    print(f"Found {len(links)} links in {url}")
    for l in links[:10]:
        print(l)
except Exception as e:
    print(f"Error: {e}")
