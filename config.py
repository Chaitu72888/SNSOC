import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'soc_prod_sec_key_9f8d7e6a5b4c3d2e1f0a9b8c7d6e5f4a'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'snsoc.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ABUSEIPDB_API_KEY = os.environ.get('ABUSEIPDB_API_KEY', '')
    MOCK_TI_MODE = os.environ.get('MOCK_TI_MODE', 'true').lower() == 'true'
    
    # Cookie & Session Security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600

