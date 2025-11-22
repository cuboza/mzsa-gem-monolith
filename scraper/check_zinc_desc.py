import requests
from bs4 import BeautifulSoup

url = "https://www.mzsa.ru/goods/common/zincs/zinc_220.html"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")

# Check for id="model_desc"
desc_div = soup.find("div", id="model_desc")
if desc_div:
    print("Found div#model_desc")
    text = desc_div.get_text("\n", strip=True)
    print(text)
else:
    print("div#model_desc NOT found")

# Check for class="text"
text_div = soup.find("div", class_="text")
if text_div:
    print("Found div.text")
    print(text_div.get_text(strip=True)[:100])
else:
    print("div.text NOT found")

# Search for a snippet of the description to see where it lives
snippet = "Оцинкованное I-образное дышло продлено до заднего фартука прицепа"
found = soup.find(string=lambda t: snippet in t if t else False)
if found:
    parent = found.parent
    print(f"Snippet found in tag: {parent.name}")
    print(f"Parent classes: {parent.get('class')}")
    print(f"Grandparent tag: {parent.parent.name}")
    print(f"Grandparent classes: {parent.parent.get('class')}")
else:
    print("Snippet NOT found")
