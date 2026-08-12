import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'soc_prod_sec_key_9f8d7e6a5b4c3d2e1f0a9b8c7d6e5f4a'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'snsoc.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ABUSEIPDB_API_KEY = os.environ.get('ABUSEIPDB_API_KEY', '')
    MOCK_TI_MODE = os.environ.get('MOCK_TI_MODE', 'true').lower() == 'true'
    
    # Google OAuth
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

    # Cookie & Session Security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 3600

    # Email Service Configuration (SMTP / Resend)
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    SMTP_SENDER = os.environ.get('SMTP_SENDER', os.environ.get('SMTP_USERNAME', 'noreply@snsoc.live'))
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')



