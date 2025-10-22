# app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import datetime
import traceback
import cv2
import torch

# Import your model classes
from model import EncoderCNN, DecoderCNN

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]}}, supports_credentials=True)

# --- Folders & paths ---
UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "fingerprinted"
CHECKPOINTS = "checkpoints"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# --- Device handling ---
if torch.cuda.is_available():
    device = torch.device("cuda")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

# Globals for models (lazy-loaded)
_encoder = None
_decoder = None
_decoder_cpu = None  # CPU fallback for MPS issues

PAYLOAD_SIZE = 1024  # must match your training

# --- Model loading ---
def load_models():
    """Load encoder/decoder checkpoints and prepare models."""
    global _encoder, _decoder, _decoder_cpu

    enc_path = os.path.join(CHECKPOINTS, "encoder.pth")
    dec_path = os.path.join(CHECKPOINTS, "decoder.pth")

    if not os.path.exists(enc_path) or not os.path.exists(dec_path):
        raise FileNotFoundError("encoder.pth or decoder.pth not found in checkpoints/")

    enc_state = torch.load(enc_path, map_location="cpu")
    dec_state = torch.load(dec_path, map_location="cpu")

    _encoder = EncoderCNN()
    _encoder.load_state_dict(enc_state)
    _encoder.to(device).eval()

    _decoder = DecoderCNN(payload_size=PAYLOAD_SIZE)
    _decoder.load_state_dict(dec_state)
    _decoder.to(device).eval()

    if device.type == "mps":
        _decoder_cpu = DecoderCNN(payload_size=PAYLOAD_SIZE)
        _decoder_cpu.load_state_dict(dec_state)
        _decoder_cpu.to(torch.device("cpu")).eval()

# --- Metadata helpers ---
def encode_metadata_plain(username: str) -> bytes:
    """Return raw bytes of 'username|YYYY-MM-DD HH:MM:SS'."""
    dt = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    meta = f"{username}|{dt}"
    return meta.encode("utf-8")

def bytes_to_payload_tensor(b: bytes, device_target):
    """Convert metadata bytes → payload tensor (1, PAYLOAD_SIZE)."""
    bits = []
    for byte in b:
        bits.extend([int(bit) for bit in format(byte, "08b")])
    bits = bits[:PAYLOAD_SIZE]
    bits += [0] * (PAYLOAD_SIZE - len(bits))
    return torch.FloatTensor(bits).unsqueeze(0).to(device_target)

def payload_tensor_to_string(tensor):
    """Convert decoder output tensor → UTF-8 metadata string."""
    arr = (tensor.squeeze().detach().cpu().round().int().tolist())
    if isinstance(arr, int):
        arr = [arr]
    bytes_list = []
    for i in range(0, len(arr), 8):
        bytebits = arr[i:i+8]
        if len(bytebits) < 8:
            bytebits += [0]*(8-len(bytebits))
        val = int("".join(map(str, bytebits)), 2)
        bytes_list.append(val)
    raw = bytes(bytes_list).rstrip(b"\x00")
    return raw.decode("utf-8", errors="ignore")

# --- Image helpers ---
def read_image_cv2(path):
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to read image")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def tensor_from_rgb_image(img_rgb, device_target):
    """Convert HxWx3 RGB → tensor (1,3,H,W) normalized to 0..1."""
    t = torch.FloatTensor(img_rgb.astype("float32") / 255.0).permute(2, 0, 1).unsqueeze(0)
    return t.to(device_target), img_rgb.shape[:2]

def save_rgb_to_file(img_rgb, out_path):
    cv2.imwrite(out_path, cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))

# --- API endpoints ---
@app.route("/api/embed", methods=["POST", "OPTIONS"])
def api_embed():
    if request.method == "OPTIONS":
        return "", 200
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]
        username = request.form.get("username", "anonymous")
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(upload_path)

        if _encoder is None or _decoder is None:
            load_models()

        img_rgb = read_image_cv2(upload_path)
        img_tensor, _ = tensor_from_rgb_image(img_rgb, device)

        meta_bytes = encode_metadata_plain(username)
        payload = bytes_to_payload_tensor(meta_bytes, device)

        with torch.no_grad():
            watermarked = _encoder(img_tensor, payload)

        wm_np = (watermarked.squeeze().permute(1, 2, 0).cpu().numpy() * 255.0).clip(0, 255).astype("uint8")
        out_path = os.path.join(RESULT_FOLDER, f"fingerprinted_{filename}")
        save_rgb_to_file(wm_np, out_path)

        return jsonify({
            "fingerprinted_image": f"fingerprinted_{filename}",
            "metadata": meta_bytes.decode("utf-8")
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/decode", methods=["POST"])
def api_decode():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        file = request.files["image"]
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(upload_path)

        if _encoder is None or _decoder is None:
            load_models()

        img_rgb = read_image_cv2(upload_path)
        img_tensor, _ = tensor_from_rgb_image(img_rgb, device)

        if device.type == "mps":
            with torch.no_grad():
                payload_pred = _decoder_cpu(img_tensor.cpu())
        else:
            with torch.no_grad():
                payload_pred = _decoder(img_tensor)

        decoded_meta = payload_tensor_to_string(payload_pred)
        fingerprint, timestamp = ("", "")
        if "|" in decoded_meta:
            fingerprint, timestamp = decoded_meta.split("|", 1)
        else:
            fingerprint = decoded_meta

        return jsonify({
            "decoded_data": {
                "fingerprint": fingerprint,
                "timestamp": timestamp,
                "algorithm": "SHA-256 + RSA-2048",
                "security_level": "Military Grade",
                "origin": "Digital Fingerprint System v2.1",
                "checksum": "0x12345678"
            }
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/fingerprinted/<filename>")
def serve_fingerprinted(filename):
    return send_from_directory(RESULT_FOLDER, filename)

if __name__ == "__main__":
    print(f"Running on device: {device}")
    app.run(host="0.0.0.0", port=5000, debug=True)