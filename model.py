import torch
import torch.nn as nn
import torch.nn.functional as F

class EncoderCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(4, 64, 3, padding=1)
        self.conv2 = nn.Conv2d(64, 3, 3, padding=1)
        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()

    def forward(self, image, payload):
        b, c, h, w = image.shape
        payload_map = payload.unsqueeze(-1).unsqueeze(-1)
        payload_map = payload_map.mean(dim=1, keepdim=True)
        payload_map = payload_map.expand(-1, -1, h, w)
        x = torch.cat([image, payload_map], dim=1)
        x = self.relu(self.conv1(x))
        residual = self.sigmoid(self.conv2(x))
        watermarked = image + residual * 0.1
        watermarked = torch.clamp(watermarked, 0, 1)
        return watermarked

class DecoderCNN(nn.Module):
    def __init__(self, payload_size=1024):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 64, 3, padding=1)
        self.conv2 = nn.Conv2d(64, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 32, 3, padding=1)
        self.adaptive_pool = nn.AdaptiveAvgPool2d((32, 32))
        self.flatten = nn.Flatten()
        self.fc = nn.Linear(32*32*32, payload_size)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = F.relu(self.conv3(x))
        x = self.adaptive_pool(x)
        x = self.flatten(x)
        x = self.sigmoid(self.fc(x))
        return x
