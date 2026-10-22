RISK_TERMS={'account_compromise':['hacked','account hacked','stolen account','someone logged in','unauthorized login','account compromised','password stolen','मेरा अकाउंट हैक','अकाउंट हैक'],'duplicate_payment':['charged twice','double charged','duplicate payment','paid twice','payment twice','दो बार पेमेंट','double payment'],'legal_threat':['lawyer','legal action','sue you','court','consumer court','lawsuit','कानूनी कार्रवाई','कोर्ट']}
def keyword_risk(message):
 t=message.lower()
 for risk,terms in RISK_TERMS.items():
  if any(term in t for term in terms): return risk
 return 'none'
def repeated_negative(conversation,analysis): return analysis.get('sentiment')=='negative' and conversation.negative_count>=2
def choose_tone(analysis):
 if analysis.get('sarcasm') or analysis.get('emotion') in {'frustrated','angry'}: return 'empathetic_professional'
 if analysis.get('sentiment')=='positive': return 'warm'
 return 'professional'
