@echo off
REM Instalador do Edicao com IA (Windows). Ex.: Instalar.bat --pasta "%USERPROFILE%\Meu Canal" --sim
where py >nul 2>nul && (py -3 "%~dp0skills\painel-edicao-com-ia\scripts\instalar.py" %* & goto :eof)
where python >nul 2>nul && (python "%~dp0skills\painel-edicao-com-ia\scripts\instalar.py" %* & goto :eof)
echo Falta o Python 3. Instale em https://www.python.org/downloads/ (marque "Add to PATH") e rode de novo.
pause
