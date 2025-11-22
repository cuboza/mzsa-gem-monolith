import requests
from bs4 import BeautifulSoup

url = "https://www.mzsa.ru/goods/water/water_103.html"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

# Find div with id="model_desc"
desc_div = soup.find("div", id="model_desc")
if desc_div:
    print("Found div#model_desc")
    for child in desc_div.children:
        if child.name:
            print(f"Child: {child.name}, classes: {child.get('class')}")
            if child.name == 'p':
                print(f"  P content: {child.get_text(strip=True)[:50]}...")
else:
    print("div#model_desc not found")




