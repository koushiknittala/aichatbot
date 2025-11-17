@echo off
echo ========================================
echo   Downloading Ollama Model: llama3.2
echo ========================================
echo.
echo This will download the best Ollama model (llama3.2)
echo Size: ~2.0GB
echo.
echo Make sure Ollama is installed from: https://ollama.ai
echo.
pause

echo.
echo [1/2] Checking Ollama installation...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Ollama not found!
    echo.
    echo Please install Ollama first from: https://ollama.ai
    echo.
    pause
    exit /b 1
)

echo ✓ Ollama found
echo.
echo [2/2] Downloading llama3.2 model...
echo This may take a few minutes depending on your internet speed...
echo.

ollama pull llama3.2

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✓ Model downloaded successfully!
    echo ========================================
    echo.
    echo You can now run: start.bat
    echo.
) else (
    echo.
    echo ========================================
    echo   ✗ Download failed!
    echo ========================================
    echo.
    echo Please check your internet connection and try again.
    echo.
)

pause

