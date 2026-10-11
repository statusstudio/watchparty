import os
import uuid
import shutil
import asyncio
import subprocess
from typing import Optional
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import edge_tts
from gradio_client import Client, handle_file

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI Voice Clone & TTS Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount generated audio files directory
app.mount("/audio", StaticFiles(directory=str(OUTPUTS_DIR)), name="audio")

# Cache CosyVoice 3.0 Clients by token
clients_cache = {}

def get_cosyvoice_client(hf_token: Optional[str] = None):
    token = hf_token or os.environ.get("HF_TOKEN") or None
    cache_key = token or "anonymous"
    if cache_key not in clients_cache:
        try:
            print(f"Connecting to Alibaba CosyVoice 3.0 (with auth token: {bool(token)})...")
            kwargs = {}
            if token:
                kwargs["hf_token"] = token
            clients_cache[cache_key] = Client("FunAudioLLM/Fun-CosyVoice3-0.5B", **kwargs)
            print("CosyVoice 3.0 client initialized successfully.")
        except Exception as e:
            print(f"Failed to connect to CosyVoice 3.0: {e}")
            raise HTTPException(status_code=503, detail=f"CosyVoice engine connection error: {str(e)}")
    return clients_cache[cache_key]


class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = "th-TH-PremwadeeNeural"
    rate: Optional[str] = "+0%"
    pitch: Optional[str] = "+0Hz"
    volume: Optional[str] = "+0%"


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "AI Voice Generation & Voice Cloning Studio",
        "models": {
            "neural_tts": "Microsoft Azure Neural (Premwadee / Niwat)",
            "voice_clone": "Alibaba FunAudioLLM CosyVoice 3.0 (0.5B)"
        },
        "gpu": "NVIDIA GeForce RTX 4060 8GB"
    }


@app.get("/voices")
def get_supported_voices():
    return [
        {
            "id": "th-TH-PremwadeeNeural",
            "name": "เปมนวดี (Premwadee)",
            "gender": "หญิง (Female)",
            "lang": "th-TH",
            "badge": "ยอดนิยม",
            "desc": "เสียงพากย์ผู้หญิง สุภาพ ชัดเจน เป็นธรรมชาติ เหมาะกับคอนเทนต์ทั่วไปและสารคดี",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
        },
        {
            "id": "th-TH-NiwatNeural",
            "name": "นิวัฒน์ (Niwat)",
            "gender": "ชาย (Male)",
            "lang": "th-TH",
            "badge": "ทางการ",
            "desc": "เสียงพากย์ผู้ชาย ทุ้มนุ่ม ลึกซึ้ง เหมาะกับงานข่าว พอดแคสต์ และบรรยาย",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
        },
        {
            "id": "en-US-JennyNeural",
            "name": "Jenny (US English)",
            "gender": "หญิง (Female)",
            "lang": "en-US",
            "badge": "Inter",
            "desc": "Natural, warm American English female voice",
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
        },
        {
            "id": "en-US-GuyNeural",
            "name": "Guy (US English)",
            "gender": "ชาย (Male)",
            "lang": "en-US",
            "badge": "Inter",
            "desc": "Professional American English male narrator",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
        },
        {
            "id": "ja-JP-NanamiNeural",
            "name": "Nanami (Japanese)",
            "gender": "หญิง (Female)",
            "lang": "ja-JP",
            "badge": "Anime/JP",
            "desc": "Sweet, expressive Japanese voice",
            "avatar": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80"
        },
        {
            "id": "zh-CN-XiaoxiaoNeural",
            "name": "Xiaoxiao (Chinese)",
            "gender": "หญิง (Female)",
            "lang": "zh-CN",
            "badge": "CN",
            "desc": "Warm, lively Mandarin Chinese female voice",
            "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
        }
    ]


@app.post("/synthesize")
async def synthesize_speech(req: SynthesizeRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="ข้อความต้องไม่ว่างเปล่า")
    
    file_id = f"tts_{uuid.uuid4().hex[:12]}.mp3"
    output_path = OUTPUTS_DIR / file_id

    try:
        communicate = edge_tts.Communicate(
            text=req.text,
            voice=req.voice or "th-TH-PremwadeeNeural",
            rate=req.rate or "+0%",
            pitch=req.pitch or "+0Hz",
            volume=req.volume or "+0%"
        )
        await communicate.save(str(output_path))

        return {
            "success": True,
            "filename": file_id,
            "audio_url": f"/api/voice/audio/{file_id}",
            "text": req.text,
            "voice": req.voice,
            "engine": "Azure Neural TTS"
        }
    except Exception as e:
        print(f"Synthesize error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการสังเคราะห์เสียง: {str(e)}")


def convert_audio_to_pcm_wav(input_path: Path, output_wav_path: Path) -> bool:
    """Normalize any audio format (.m4a, .webm, .mp3, .ogg, etc.) to 24kHz 16-bit mono PCM WAV for CosyVoice."""
    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(input_path),
        "-vn",
        "-ar", "24000",
        "-ac", "1",
        "-c:a", "pcm_s16le",
        str(output_wav_path)
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        if res.returncode == 0 and output_wav_path.exists() and output_wav_path.stat().st_size > 0:
            print(f"[FFmpeg] Successfully normalized {input_path.name} -> {output_wav_path.name} ({output_wav_path.stat().st_size} bytes)")
            return True
        else:
            print(f"[FFmpeg] Conversion warning (code {res.returncode}): {res.stderr.decode('utf-8', errors='ignore')[:200]}")
            return False
    except Exception as e:
        print(f"[FFmpeg] Exception running ffmpeg: {e}")
        return False


@app.post("/clone")
async def clone_voice(
    audio: UploadFile = File(...),
    text: str = Form(...),
    prompt_text: Optional[str] = Form(""),
    seed: Optional[int] = Form(0),
    x_hf_token: Optional[str] = Header(None, alias="X-HF-Token")
):
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="กรุณาระบุข้อความที่ต้องการให้เสียงที่โคลนพูด")
    
    # Save uploaded reference audio
    upload_ext = Path(audio.filename or "sample.wav").suffix or ".wav"
    raw_filename = f"raw_{uuid.uuid4().hex[:12]}{upload_ext}"
    raw_path = UPLOADS_DIR / raw_filename

    with open(raw_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    # Convert/Normalize to standard 24kHz 16-bit PCM WAV to eliminate any Libsndfile / codec incompatibility
    clean_wav_filename = f"ref_{uuid.uuid4().hex[:12]}.wav"
    clean_wav_path = UPLOADS_DIR / clean_wav_filename

    converted = convert_audio_to_pcm_wav(raw_path, clean_wav_path)
    audio_for_model = clean_wav_path if converted else raw_path

    try:
        client = get_cosyvoice_client(x_hf_token)
        print(f"Running CosyVoice 3.0 inference for text: '{text[:50]}...' with reference audio: {audio_for_model}")
        
        loop = asyncio.get_event_loop()
        # Run predict in thread pool because it's synchronous blocking
        def do_inference():
            return client.predict(
                tts_text=text,
                mode_value="zero_shot",
                prompt_text=prompt_text or "",
                prompt_wav_upload=handle_file(str(audio_for_model)),
                prompt_wav_record=None,
                instruct_text="You are a helpful assistant. Please say a sentence as loudly as possible.<|endofprompt|>",
                seed=float(seed or 0),
                stream=False,
                ui_lang="En",
                api_name="/generate_audio"
            )

        result_path = await loop.run_in_executor(None, do_inference)
        print(f"CosyVoice 3.0 inference complete! Output at: {result_path}")

        # Copy generated result to outputs directory
        out_id = f"clone_{uuid.uuid4().hex[:12]}.wav"
        out_path = OUTPUTS_DIR / out_id
        shutil.copyfile(result_path, str(out_path))

        return {
            "success": True,
            "filename": out_id,
            "audio_url": f"/api/voice/audio/{out_id}",
            "text": text,
            "reference_file": raw_filename,
            "engine": "Alibaba CosyVoice 3.0 (Zero-shot)"
        }
    except Exception as e:
        print(f"CosyVoice inference error: {e}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการโคลนเสียงด้วย CosyVoice 3.0: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8005, reload=True)
