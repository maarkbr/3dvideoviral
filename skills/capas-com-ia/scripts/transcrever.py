"""Transcreve a fala do vídeo para achar a promessa, os números reais e os capítulos do YouTube.

uso: <Python da pasta de trabalho> transcrever.py <video> <saida.txt> [--modelo small]
Escreve <saida.txt> com uma linha por trecho ("[01:23] texto") e <saida>.json com os tempos.
O modelo do Whisper fica em <pasta de trabalho>/_ferramentas/modelos-whisper (baixa sozinho na 1ª vez, ~460 MB no small).
Rode com o Python da pasta de trabalho (_ferramentas/.venv), que tem o faster-whisper.
"""
import argparse
import json
import os
import subprocess

from comum import ffmpeg, pasta_de_trabalho


def main():
    ap = argparse.ArgumentParser(description="Transcrição para capa, título e capítulos")
    ap.add_argument("video")
    ap.add_argument("saida")
    ap.add_argument("--modelo", default="small")
    a = ap.parse_args()
    import numpy as np
    from faster_whisper import WhisperModel

    pcm = subprocess.run([ffmpeg(), "-nostdin", "-v", "error", "-i", a.video, "-vn", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0  # passar o áudio pronto evita o erro do "av" com caminho de arquivo
    if len(audio) < 16000:
        raise SystemExit("O vídeo não tem fala (ou o áudio está vazio): faça a capa pela ideia.")
    raiz = pasta_de_trabalho(a.video, a.saida)
    modelos = os.path.join(raiz, "_ferramentas", "modelos-whisper") if raiz else os.path.join(os.getcwd(), ".models")
    os.makedirs(modelos, exist_ok=True)
    m = WhisperModel(a.modelo, device="cpu", compute_type="int8", download_root=modelos)
    segs, _ = m.transcribe(audio, language="pt", beam_size=5, condition_on_previous_text=False)
    trechos = [{"inicio": round(s.start, 2), "fim": round(s.end, 2), "texto": s.text.strip()} for s in segs if s.text.strip()]
    os.makedirs(os.path.dirname(os.path.abspath(a.saida)), exist_ok=True)
    with open(a.saida, "w", encoding="utf-8") as f:
        for t in trechos:
            mm, ss = divmod(int(t["inicio"]), 60)
            f.write(f"[{mm:02d}:{ss:02d}] {t['texto']}\n")
    with open(os.path.splitext(a.saida)[0] + ".json", "w", encoding="utf-8") as f:
        json.dump({"duracao": round(len(audio) / 16000, 2), "trechos": trechos}, f, ensure_ascii=False, indent=1)
    print(f"ok: {len(trechos)} trechos, {len(audio) / 16000:.0f} s de áudio -> {a.saida}")


if __name__ == "__main__":
    main()
