@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Estudio de desenho 3D: render no seu PC (usa a placa de video) ===
where node >nul 2>nul || (echo Falta o Node.js. Instale em https://nodejs.org e de dois cliques aqui de novo. & pause & exit /b 1)
if not exist node_modules (
  echo Instalando as pecas do estudio (so na primeira vez, alguns minutos^)...
  call npm install --no-audit --no-fund || (echo Falhou a instalacao. Tire um print desta janela e mande no chat. & pause & exit /b 1)
)
if not exist out mkdir out
set "TEMP=%~dp0out\tmp" & set "TMP=%~dp0out\tmp"
if not exist "%TEMP%" mkdir "%TEMP%"
set "COMP=%~1" & if "%COMP%"=="" set "COMP=Dividas82"
set "QUADROS=%~2" & if "%QUADROS%"=="" set "QUADROS=2025-2174"
echo Renderizando %COMP% (quadros %QUADROS%)...
call npx remotion render src/index.ts %COMP% out/%COMP%.mp4 --frames=%QUADROS% --gl=angle --codec=h264 --crf=16 || (echo Deu erro. Tire um print desta janela e mande no chat. & pause & exit /b 1)
echo.
echo Pronto! O video esta em: %~dp0out\%COMP%.mp4
start "" "%~dp0out"
pause
