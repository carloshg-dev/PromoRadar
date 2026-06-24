@echo off
chcp 65001 >nul
title PromoRadar Backend

echo.
echo  ====================================================
echo   📡 PromoRadar — Backend Python Local
echo  ====================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Python nao encontrado!
    echo  Baixe em: https://www.python.org/downloads/
    echo  Marque "Add Python to PATH" na instalacao
    pause & exit /b 1
)

if not exist "node_modules\" (
    echo  [1/2] Instalando dependencias Python...
    pip install -r requirements.txt
    echo  [2/2] Instalando browser para scraping...
    playwright install chromium
    echo.
)

echo  Iniciando PromoRadar Backend...
echo  A API estara disponivel em: http://localhost:8765
echo  Abra o arquivo PromoRadar.html no navegador.
echo.
echo  Pressione Ctrl+C para encerrar.
echo.

python scheduler.py

pause
