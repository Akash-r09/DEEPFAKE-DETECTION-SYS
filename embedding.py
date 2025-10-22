from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import torch
import cv2
from werkzeug.utils import secure_filename
from model import EncoderCNN
import datetime
import numpy as np

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]}}, supports_credentials=True)

UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "fingerprinted"
CHECKPOINTS = "checkpoints"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

# ---------------- ECC Helper Functions ----------------
def hamming_encode(block):
    # 4-bit input → 7-bit Hamming code
    d = block + [0]*(4-len(block))
    p1 = d[0] ^ d[1] ^ d[3]
    p2 = d[0] ^ d[2] ^ d[3]
    p3 = d[1] ^ d[2] ^ d[3]
    return [p1, p2, d[0], p3, d[1], d[2], d[3]]

def str_to_bits(s):
    bits = []
    for c in s:
        bits.extend([int(b) for b in format(ord(c), '08b')])
    return bits

def ecc_encode_metadata(meta_str, payload_size=1024):
    bits = str_to_bits(meta_str)
    bits_ecc = []
    for i in range(0, len(bits), 4):
        block = bits[i:i+4]
        bits_ecc.extend(hamming_encode(block))
    # pad/truncate to payload_size
    if len(bits_ecc) < payload_size:
        bits_ecc += [0]*(payload_size - len(bits_ecc))
    else:
        bits_ecc = bits_ecc[:payload_size]
    return torch.FloatTensor(bits_ecc).unsqueeze(0).to(device)

# -------------------- Flask Route --------------------
@app.route("/api/embed", methods=["POST"])
def embed_image():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]
        username = request.form.get("username", "anonymous")
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(upload_path)

        # Load image
        img = cv2.imread(upload_path, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({"error": "Invalid image file"}), 400
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img_rgb.shape[:2]
        max_dim = 512
        scale = min(max_dim/h, max_dim/w, 1.0)
        img_resized = cv2.resize(img_rgb, (int(w*scale), int(h*scale)))
        img_tensor = torch.FloatTensor(img_resized/255.0).permute(2,0,1).unsqueeze(0).to(device)

        # Generate metadata
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        metadata_str = f"{username}|{timestamp}"
        payload = ecc_encode_metadata(metadata_str)

        # Load encoder
        encoder = EncoderCNN().to(device)
        encoder.load_state_dict(torch.load(os.path.join(CHECKPOINTS, "encoder.pth"), map_location=device))
        encoder.eval()

        # Encode
        with torch.no_grad():
            watermarked = encoder(img_tensor, payload)

        # Save fingerprinted image
        watermarked_np = (watermarked.squeeze().permute(1,2,0).cpu().numpy()*255).clip(0,255).astype("uint8")
        watermarked_img = cv2.cvtColor(cv2.resize(watermarked_np, (w,h)), cv2.COLOR_RGB2BGR)
        result_filename = f"fingerprinted_{filename}"
        result_path = os.path.join(RESULT_FOLDER, result_filename)
        cv2.imwrite(result_path, watermarked_img)

        return jsonify({
            "fingerprinted_image": result_filename,
            "metadata": metadata_str
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print(f"Running encoder on device: {device}")
    app.run(debug=True, port=5000)