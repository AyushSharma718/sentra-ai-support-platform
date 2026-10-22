import json
from google import genai
from config import GEMINI_API_KEY,GEMINI_MODEL
client=genai.Client(api_key=GEMINI_API_KEY)
ANALYSIS_PROMPT='''Analyze the current customer-support message and history. Return ONLY JSON with language, sentiment (positive|neutral|negative), confidence (0-1), emotion, sarcasm (boolean), urgency (low|medium|high), risk (none|account_compromise|duplicate_payment|legal_threat|other), response_tone (warm|professional|empathetic_professional). Understand English, Hindi, Hinglish and other languages. A calm message can still be high risk.'''
def _json(text):
 text=text.strip()
 if text.startswith('```'): text=text.replace('```json','',1).replace('```','')
 return text.strip()
def analyze_message(message,history=None):
 history=history or []
 h='\n'.join(f"User: {x['user']}\nAssistant: {x['assistant']}" for x in history[-10:])
 r=client.models.generate_content(model=GEMINI_MODEL,contents=ANALYSIS_PROMPT+'\nHISTORY:\n'+(h or '(none)')+'\nCURRENT:\n'+message)
 try: result=json.loads(_json(r.text))
 except Exception: result={'language':'unknown','sentiment':'neutral','confidence':0.0,'emotion':'other','sarcasm':False,'urgency':'low','risk':'none','response_tone':'professional'}
 result['confidence']=max(0,min(1,float(result.get('confidence',0))))
 return result
def generate_response(message,history=None,tone='professional',escalated=False):
 history=history or []
 h='\n'.join(f"User: {x['user']}\nAssistant: {x['assistant']}" for x in history[-10:])
 instruction=f'You are a helpful customer-support assistant. Use a {tone} tone. Do not change business policies, invent refunds, expose internal risk scores, or promise actions you cannot perform. Be concise and empathetic.'
 if escalated: instruction+=' The conversation has been escalated to human/on-call support. Tell the customer it has been escalated, but do not claim it is solved.'
 return client.models.generate_content(model=GEMINI_MODEL,contents=instruction+'\nConversation:\n'+h+'\nUser: '+message).text
