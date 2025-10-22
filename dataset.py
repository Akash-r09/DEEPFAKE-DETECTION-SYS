import os
import random
import string
import base64
from torch.utils.data import Dataset
from PIL import Image
import torchvision.transforms as transforms
import torch
import datetime

class ImageDataset(Dataset):
    def __init__(self, root_dir, target_size=(256, 256), payload_size=1024):
        self.root_dir = root_dir
        self.image_files = [
            os.path.join(root_dir, f)
            for f in os.listdir(root_dir)
            if f.lower().endswith((".png", ".jpg", ".jpeg"))
        ]
        self.target_size = target_size
        self.payload_size = payload_size
        self.transform = transforms.Compose([
            transforms.Resize(self.target_size),
            transforms.ToTensor()
        ])

    def __len__(self):
        return len(self.image_files)

    def generate_random_username(self, length=6):
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

    def encode_metadata(self):
        username = self.generate_random_username()
        dt = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        meta = f"{username}|{dt}"
        return base64.b64encode(meta.encode("utf-8"))

    def metadata_to_tensor(self, encoded_meta):
        bits = []
        for byte in encoded_meta:
            bits.extend([int(b) for b in format(byte, "08b")])
        bits = bits[:self.payload_size]
        while len(bits) < self.payload_size:
            bits.append(0)
        return torch.FloatTensor(bits)

    def __getitem__(self, idx):
        img_path = self.image_files[idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)

        encoded_meta = self.encode_metadata()
        payload = self.metadata_to_tensor(encoded_meta)

        return image, payload
