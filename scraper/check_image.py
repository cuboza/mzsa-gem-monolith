import requests

url = "https://www.mzsa.ru/netcat_files/176/185/h_c610b58cca8b0c8aa965de673ec3e869"
try:
    response = requests.head(url, allow_redirects=True)
    print(f"URL: {url}")
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Content-Length: {response.headers.get('Content-Length')}")
except Exception as e:
    print(e)
