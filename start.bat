@echo off
echo ========================================
echo   MSME ONE Chatbot - Starting Server
echo ========================================
echo.
echo Starting Flask server...
echo.
echo Server: http://localhost:5000
echo Admin: http://localhost:5000/admin/login
echo   Username: admin1
echo   Password: admin1234
echo.
echo Note: Make sure Ollama is running (ollama serve)
echo Press Ctrl+C to stop
echo ========================================
echo.

python app.py
