@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Estudio de desenho 3D: render no seu PC (usa a placa de video) ===
where node >nul 2>nul || (echo Falta o Node.js. Instale em https://nodejs.org e de dois cliques aqui de novo. & pause & exit /b 1)
if not exist node_modules (
  echo Instalando as pecas do estudio, so na primeira vez...
  call npm install --no-audit --no-fund
)
if not exist out mkdir out
set "COMP=%~1"
if "%COMP%"=="" set "COMP=Dividas82"
set "QUADROS=%~2"
if "%QUADROS%"=="" set "QUADROS=2025-2174"
if exist "out\%COMP%.mp4" del "out\%COMP%.mp4"
echo Renderizando %COMP% (quadros %QUADROS%). O registro fica em out\registro.txt
powershell -NoProfile -Command "npx remotion render src/index.ts %COMP% out/%COMP%.mp4 --frames=%QUADROS% --gl=angle --codec=h264 --crf=16 --log=verbose 2>&1 | Tee-Object -FilePath out/registro.txt"
echo.
if exist "out\%COMP%.mp4" (
  echo Pronto! O video esta em: %~dp0out\%COMP%.mp4
  start "" "%~dp0out"
) else (
  echo NAO deu certo: o video nao foi criado. Mande no chat o arquivo out\registro.txt
  start "" "%~dp0out"
)
pause
