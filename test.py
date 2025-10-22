import requests

ACCESS_KEY = "QwjCRIlLyXfjMx6dWdt5cCOKFtyfV-rQqUvg6jsSweU"
query = "nature"
url = f"https://api.unsplash.com/search/photos?page=1&query={query}&per_page=5"
headers = {"Authorization": f"Client-ID {ACCESS_KEY}"}
resp = requests.get(url, headers=headers)
print(resp.json())
