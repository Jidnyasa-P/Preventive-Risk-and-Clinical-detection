@echo off
echo Installing PreventAI backend dependencies...

pip install fastapi==0.115.5
pip install "uvicorn[standard]==0.32.1"
pip install scikit-learn==1.6.1
pip install pandas==2.2.3
pip install numpy==2.2.3
pip install joblib==1.4.2
pip install shap==0.46.0
pip install pydantic==2.9.2
pip install httpx==0.27.2
pip install python-dotenv==1.0.1

echo.
echo All packages installed!
echo Run: python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
