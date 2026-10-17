#!/usr/bin/env python3
"""CPU-only Kokoro Mandarin speech; no cloud TTS key. Apache-2.0 model."""
import json, os, re, sys
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KModel, KPipeline

REPO = "hexgrad/Kokoro-82M-v1.1-zh"
VOICE = os.getenv("KOKORO_VOICE", "zf_001")
SAMPLE_RATE = 24000

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python3 voice_free.py scenes.json output_directory")
    scenes = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    folder = Path(sys.argv[2])
    folder.mkdir(parents=True, exist_ok=True)
    model = KModel(repo_id=REPO).to("cpu").eval()
    en_pipeline = KPipeline(lang_code="a", repo_id=REPO, model=False)
    def english(text):
        try:
            return next(en_pipeline(text)).phonemes
        except StopIteration:
            return ""
    pipeline = KPipeline(lang_code="z", repo_id=REPO, model=model, en_callable=english)

    for i, scene in enumerate(scenes):
        text = scene["narration"].strip()
        if not text:
            raise ValueError(f"No narration for scene {i}")
        segments = [p.strip() for p in re.findall(r"[^。！？!?；;]+[。！？!?；;]?", text) if p.strip()]
        audio_parts = []
        for segment in segments:
            # Keep input phoneme sequences short for reliable generation.
            for piece in [segment[j:j + 70] for j in range(0, len(segment), 70)]:
                for result in pipeline(piece, voice=VOICE, speed=1.02):
                    wav = np.asarray(result.audio, dtype=np.float32)
                    if wav.size:
                        audio_parts.append(wav)
                        audio_parts.append(np.zeros(int(SAMPLE_RATE * 0.13), dtype=np.float32))
        if not audio_parts:
            raise RuntimeError(f"No audio generated for scene {i}")
        wav_out = folder / f"part{i}.wav"
        sf.write(wav_out, np.concatenate(audio_parts), SAMPLE_RATE)
        print(f"GENERATED {wav_out} ({len(text)} chars)", flush=True)

if __name__ == "__main__":
    main()
