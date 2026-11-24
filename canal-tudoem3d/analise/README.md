# Dados da análise (24/11/2026)
- `scripts/quadros.py`: mede todos os quadros (cor, luz, nitidez, diferença, movimento de câmera por ORB).
- `scripts/cortes2.py`: candidatos a corte e fusão (distância de cor em grade, lag 1 e lag 6).
- `scripts/planos2.py`: métricas por plano a partir das fronteiras confirmadas olhando.
- `scripts/tiras.py`: tiras de 12 quadros seguidos em volta de cada candidato, para conferir.
- `scripts/fala.py`: tempos de cada palavra (faster-whisper).
- `dados/`: resultados (só números e tempos; sem o texto do roteiro da referência, sem quadros do vídeo dela).
Uso: `python3 scripts/quadros.py video.mp4 saida.csv` (precisa de opencv e numpy; a venv do projeto tem).
