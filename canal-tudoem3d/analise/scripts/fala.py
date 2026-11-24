import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3], device='cpu', compute_type='int8')
import wave, numpy as np; wv = wave.open(sys.argv[1]); a = np.frombuffer(wv.readframes(wv.getnframes()), np.int16).astype(np.float32) / 32768
segs, info = m.transcribe(a, language='en', word_timestamps=True, vad_filter=False)
ws = [{'w': w.word.strip(), 'i': round(w.start, 2), 'f': round(w.end, 2)} for s in segs for w in s.words]
json.dump(ws, open(sys.argv[2], 'w'), ensure_ascii=False); print(len(ws), 'palavras')
