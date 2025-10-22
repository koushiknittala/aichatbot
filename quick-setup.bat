@echo off
setlocal
cd /d %~dp0
echo Quick setup for MSME ONE Chatbot...

echo Installing Python deps (Flask, CORS, PyPDF2, requests, Werkzeug)...
pip install -q Flask==2.3.3 Flask-CORS==4.0.0 PyPDF2==3.0.1 requests==2.31.0 Werkzeug==2.3.7 >nul 2>&1

if exist package.json (
  echo Installing Node deps and building frontend...
  call npm install >nul 2>&1
  call npm run build >nul 2>&1
) else (
  echo Skipping frontend build (package.json not found)
)

echo Done. Use start.bat to run the app.
endlocal

