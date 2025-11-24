import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

url = 'https://go-rm.ru/'
try:
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    
    print("Links found:")
    for a in soup.find_all('a', href=True):
        href = a['href']
        text = a.get_text(strip=True)
        if href.endswith('.html') and 'news' not in href and 'press' not in href:
            print(f"{text}: {href}")
            
except Exception as e:
    print(f"Error: {e}")
