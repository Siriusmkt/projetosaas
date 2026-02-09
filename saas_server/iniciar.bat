@echo off
chcp 65001 >nul
title SaaS Server - Porta 8000
cd /d "%~dp0"

echo.
echo ========================================
echo   Iniciando servidor SaaS
echo   Quando subir, abra: http://localhost:8000
echo ========================================
echo.

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    echo Ambiente virtual ativado.
) else (
    echo Sem .venv - usando Python do sistema.
)

echo.
python --version
echo.

python main.py
if errorlevel 1 (
    echo.
    echo [ERRO] O servidor nao iniciou. Verifique:
    echo   1. Python instalado? python --version
    echo   2. Dependencias: pip install -r requirements.txt
    echo   3. Porta 8000 livre? Feche outro programa que use a porta.
    echo.
)

pause
