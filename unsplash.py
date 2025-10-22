import requests
import os

ACCESS_KEY = "QwjCRIlLyXfjMx6dWdt5cCOKFtyfV-rQqUvg6jsSweU"  # replace this

query = "nature"
count = 50
save_dir = "datasets/train"
os.makedirs(save_dir, exist_ok=True)

for i in range(count):
    url = f"https://api.unsplash.com/photos/random?query={query}&client_id={ACCESS_KEY}"
    try:
        response = requests.get(url)
        data = response.json()
        image_url = data['urls']['regular']
        img_data = requests.get(image_url).content
        with open(os.path.join(save_dir, f"{query}_{i+1}.jpg"), "wb") as f:
            f.write(img_data)
        print(f"Downloaded {i+1}")
    except Exception as e:
        print(f"Failed to download image {i+1}: {e}")
