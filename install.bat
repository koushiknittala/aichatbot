@echo off
echo Installing MSME ONE Chatbot Dependencies...
echo.

echo Installing Flask and basic dependencies...
pip install Flask==2.3.3 Flask-CORS==4.0.0 PyPDF2==3.0.1

echo.
echo Installing machine learning dependencies...
pip install scikit-learn --only-binary=all
pip install sentence-transformers

echo.
echo All dependencies installed successfully!
echo.
echo To run the application, use: python app.py
echo Then open your browser and go to: http://localhost:5000
echo.
pause
