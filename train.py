import torch
from torch.utils.data import DataLoader
from dataset import ImageDataset
from model import EncoderCNN, DecoderCNN
import torch.nn as nn
import torch.optim as optim
import os

CHECKPOINTS = 'checkpoints'
os.makedirs(CHECKPOINTS, exist_ok=True)

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print("Using device:", device)

train_dataset = ImageDataset('datasets/train')
train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True)

encoder = EncoderCNN().to(device)
decoder = DecoderCNN().to(device)
encoder.train()
decoder.train()

bce_loss = nn.BCELoss()
mse_loss = nn.MSELoss()
lambda_payload = 5.0

optimizer = optim.Adam(list(encoder.parameters()) + list(decoder.parameters()), lr=1e-4)

EPOCHS = 50
for epoch in range(EPOCHS):
    total_loss = 0
    total_correct_bits = 0   # <-- initialize here
    total_bits = 0  
    for i, (imgs, payloads) in enumerate(train_loader):
        imgs = imgs.to(device).float()
        payloads = payloads.to(device).float()
        optimizer.zero_grad()

        watermarked = encoder(imgs, payloads)
        decoded = decoder(watermarked)

        payload_loss = bce_loss(decoded, payloads)
        image_loss = mse_loss(watermarked, imgs)
        loss = image_loss + lambda_payload * payload_loss

        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        # --- Accuracy calculation ---
        pred_bits = (decoded > 0.5).float()       # threshold at 0.5
        total_correct_bits += (pred_bits == payloads).sum().item()
        total_bits += payloads.numel()  
        if i % 5 == 0:
            print(f"[BATCH {i}] payload_loss={payload_loss.item():.4f}, "
                  f"image_loss={image_loss.item():.4f}, total={loss.item():.4f}")

    avg_loss = total_loss / len(train_loader)
    accuracy = total_correct_bits / total_bits * 100
    print(f"Epoch [{epoch+1}/{EPOCHS}], Avg Loss: {avg_loss:.4f}, Payload Accuracy: {accuracy:.2f}%")

torch.save(encoder.state_dict(), os.path.join(CHECKPOINTS, 'encoder.pth'))
torch.save(decoder.state_dict(), os.path.join(CHECKPOINTS, 'decoder.pth'))
print("✅ Training complete.")
