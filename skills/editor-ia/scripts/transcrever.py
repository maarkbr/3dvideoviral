"""Transcrição com tempo por palavra (faster-whisper, CPU) de um vídeo/áudio inteiro ou de um trecho.

uso: transcrever.py <vídeo ou áudio> <saida.json> [--inicio 13:17] [--fim 16:10] [--modelo small]
                    [--prompt "nomes, gírias"] [--vad] [--modelos <pasta do cache>] [--motor auto|whisper|scribe]

Motores:
- whisper (padrão, grátis, local): faster-whisper. Atenção: o Whisper "limpa" a fala — costuma omitir
  "é", "né", "hum", gaguejos e repetições, então eles não aparecem para a decupagem.
- scribe (opcional, pago ~US$0,22/h de áudio): ElevenLabs Scribe v2, transcrição literal (verbatim) com
  os vícios, falsos começos e repetições, e tempo por palavra. Usado quando há ELEVENLABS_API_KEY no
  ambiente ou num arquivo .env na pasta atual. O áudio do trecho é enviado à ElevenLabs.
  --motor auto (padrão) = scribe se houver chave, senão whisper.

- Os tempos na saída são ABSOLUTOS (tempo do arquivo original), mesmo transcrevendo um trecho.
- --prompt: vocabulário do assunto (nomes próprios, lugares, gírias). Melhora muito a grafia.
- --vad: pula silêncios longos (mais rápido em podcast inteiro; um pouco menos preciso nas bordas).
- Cache do modelo: $CORTES_MODELOS ou ./.models (baixa ~0,5 GB na primeira vez).
- Velocidade típica em CPU com 'small': ~3–6x mais rápido que o tempo real. Use 'base' para varrer
  um podcast muito longo mais rápido e refaça o trecho escolhido com 'small' + --prompt.
Saída: {fonte, offset, modelo, words:[{i,text,start,end,prob}], segments:[{start,end,text,words}]}
"""
import json
import os
import subprocess
import sys
import time

import numpy as np

arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d  # noqa: E731


def secs(v):
    if v is None:
        return None
    parts = [float(p) for p in str(v).replace(",", ".").split(":")]
    s = 0.0
    for p in parts:
        s = s * 60 + p
    return s


def chave_elevenlabs():
    k = os.environ.get("ELEVENLABS_API_KEY")
    if not k and os.path.exists(".env"):
        for ln in open(".env", encoding="utf-8"):
            if ln.strip().startswith("ELEVENLABS_API_KEY"):
                k = ln.split("=", 1)[1].strip().strip('"').strip("'")
    return k or None


def scribe(src, t0, t1, key):
    """ElevenLabs Scribe v2 → palavras literais (com vícios) e eventos de áudio, tempos relativos ao trecho."""
    import tempfile
    import urllib.request
    import uuid
    tmp = os.path.join(tempfile.gettempdir(), f"scribe_{uuid.uuid4().hex}.ogg")
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if t0:
        cmd += ["-ss", f"{t0:.3f}"]
    if t1:
        cmd += ["-t", f"{(t1 - (t0 or 0)):.3f}"]
    subprocess.run(cmd + ["-i", src, "-vn", "-ac", "1", "-ar", "24000", "-c:a", "libopus", "-b:a", "48k", tmp], check=True)
    data = open(tmp, "rb").read()
    os.remove(tmp)
    bnd = uuid.uuid4().hex
    campos = {"model_id": "scribe_v2", "language_code": "pt", "timestamps_granularity": "word", "tag_audio_events": "true",
              "diarize": "false"}
    crlf = bytes([13, 10])
    body = b"".join(f'--{bnd}'.encode() + crlf + f'Content-Disposition: form-data; name="{k}"'.encode() + crlf + crlf
                    + str(v).encode() + crlf for k, v in campos.items())
    body += (f'--{bnd}'.encode() + crlf + b'Content-Disposition: form-data; name="file"; filename="audio.ogg"' + crlf
             + b"Content-Type: audio/ogg" + crlf + crlf + data + crlf + f"--{bnd}--".encode() + crlf)
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body, method="POST",
                                 headers={"xi-api-key": key, "Content-Type": f"multipart/form-data; boundary={bnd}"})
    print(f"enviando {len(data) / 1e6:.1f} MB para o ElevenLabs Scribe…", flush=True)
    with urllib.request.urlopen(req, timeout=3600) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    src, out = sys.argv[1], sys.argv[2]
    t0, t1 = secs(arg("--inicio")), secs(arg("--fim"))
    model_name = arg("--modelo", "small")
    motor = arg("--motor", "auto")
    key = chave_elevenlabs() if motor in ("auto", "scribe") else None
    if motor == "scribe" and not key:
        sys.exit("--motor scribe: falta ELEVENLABS_API_KEY (no ambiente ou no arquivo .env da pasta do projeto)")
    if key:
        off = t0 or 0.0
        res = scribe(src, t0, t1, key)
        words, eventos = [], []
        for w in res.get("words", []):
            if w.get("start") is None:
                continue
            if w.get("type") == "audio_event":
                eventos.append({"text": w["text"], "start": round(w["start"] + off, 3), "end": round(w["end"] + off, 3)})
            elif w.get("type") == "word" and w["text"].strip():
                words.append({"i": len(words), "text": w["text"].strip(), "start": round(w["start"] + off, 3),
                              "end": round(w["end"] + off, 3), "prob": round(float(np.exp(w.get("logprob", 0.0))), 3)})
        segs, cur = [], []
        for w in words:  # segmentos: frase termina em pontuação ou pausa > 0,8 s
            if cur and w["start"] - words[cur[-1]]["end"] > 0.8:
                segs.append(cur)
                cur = []
            cur.append(w["i"])
            if w["text"][-1:] in ".?!":
                segs.append(cur)
                cur = []
        if cur:
            segs.append(cur)
        segs = [{"start": words[c[0]]["start"], "end": words[c[-1]]["end"], "text": " ".join(words[i]["text"] for i in c), "words": c} for c in segs]
        for sg in segs:
            m, sec = divmod(sg["start"], 60)
            print(f"[{int(m):02d}:{sec:05.2f}] {sg['text']}")
        json.dump({"fonte": os.path.abspath(src), "offset": off, "modelo": "elevenlabs-scribe_v2", "words": words, "segments": segs,
                   "eventos": eventos}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print()
        print(f"{len(words)} palavras (literal, com vícios), {len(eventos)} eventos de áudio, {len(segs)} segmentos -> {out}")
        return
    models = arg("--modelos", os.environ.get("CORTES_MODELOS", os.path.join(os.getcwd(), ".models")))
    cmd = ["ffmpeg", "-v", "error"]
    if t0:
        cmd += ["-ss", f"{t0:.3f}"]
    if t1:
        cmd += ["-t", f"{(t1 - (t0 or 0)):.3f}"]
    cmd += ["-i", src, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"]
    pcm = subprocess.run(cmd, capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
    dur = len(audio) / 16000
    print(f"áudio: {dur / 60:.1f} min · modelo {model_name} · cache {models}", flush=True)

    from faster_whisper import WhisperModel

    model = WhisperModel(model_name, device="cpu", compute_type="int8", download_root=models)
    segments, info = model.transcribe(audio, language="pt", word_timestamps=True, beam_size=5, vad_filter="--vad" in sys.argv,
                                      condition_on_previous_text=False, initial_prompt=arg("--prompt"))
    off = t0 or 0.0
    words, segs = [], []
    start = time.time()
    last = 0.0
    for s in segments:
        seg = {"start": round(s.start + off, 3), "end": round(s.end + off, 3), "text": s.text.strip(), "words": []}
        for w in s.words or []:
            wd = {"i": len(words), "text": w.word.strip(), "start": round(w.start + off, 3), "end": round(w.end + off, 3), "prob": round(w.probability, 3)}
            words.append(wd)
            seg["words"].append(wd["i"])
        segs.append(seg)
        m, sec = divmod(seg["start"], 60)
        h, m = divmod(m, 60)
        stamp = f"{int(h)}:{int(m):02d}:{sec:05.2f}" if h else f"{int(m):02d}:{sec:05.2f}"
        print(f"[{stamp}] {seg['text']}", flush=True)
        if s.end - last > 300:  # a cada 5 min de áudio, o andamento
            el = time.time() - start
            print(f"   … {s.end / dur * 100:.0f}% · {el / 60:.1f} min decorridos · faltam ~{el / max(s.end, 1) * (dur - s.end) / 60:.0f} min", flush=True)
            last = s.end
    json.dump({"fonte": os.path.abspath(src), "offset": off, "modelo": model_name, "words": words, "segments": segs},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n{len(words)} palavras, {len(segs)} segmentos -> {out}")


if __name__ == "__main__":
    main()
