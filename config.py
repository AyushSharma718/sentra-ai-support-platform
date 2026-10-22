import os
from dotenv import load_dotenv
load_dotenv()
GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')
GEMINI_MODEL=os.getenv('GEMINI_MODEL','gemini-3.8-flash')
TIMEZONE=os.getenv('TIMEZONE','Asia/Kolkata')
BUSINESS_START=int(os.getenv('BUSINESS_START','9'))
BUSINESS_END=int(os.getenv('BUSINESS_END','18'))
NEGATIVE_ESCALATION_MINUTES=int(os.getenv('NEGATIVE_ESCALATION_MINUTES','15'))
if not GEMINI_API_KEY: raise ValueError('GEMINI_API_KEY is missing. Add it to .env')
