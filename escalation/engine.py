from dataclasses import dataclass
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
from config import TIMEZONE,BUSINESS_START,BUSINESS_END,NEGATIVE_ESCALATION_MINUTES
from escalation.rules import keyword_risk,repeated_negative,choose_tone
@dataclass
class EscalationDecision:
 required:bool; queue:str|None; reason:str|None; condition:str|None; tone:str
class EscalationEngine:
 def __init__(self,clock=None): self.clock=clock or (lambda:datetime.now(ZoneInfo(TIMEZONE)))
 def now(self): return self.clock()
 def is_business_hours(self,now=None):
  now=now or self.now(); return now.weekday()<5 and BUSINESS_START<=now.hour<BUSINESS_END
 def decide(self,message,analysis,conversation):
  tone=choose_tone(analysis); risk=analysis.get('risk','none'); detected=keyword_risk(message)
  if risk=='none' and detected!='none': risk=detected
  if risk in {'account_compromise','duplicate_payment','legal_threat'}:
   q='human_support' if self.is_business_hours() else 'on_call'
   return EscalationDecision(True,q,f'High-risk issue: {risk}',f'high-risk:{risk}',tone)
  if analysis.get('urgency')=='high':
   q='human_support' if self.is_business_hours() else 'on_call'
   return EscalationDecision(True,q,'High-urgency complaint','high-urgency',tone)
  if repeated_negative(conversation,analysis):
   q='human_support' if self.is_business_hours() else 'next_working_day'
   return EscalationDecision(True,q,'Repeated negative messages','repeated-negative',tone)
  if conversation.last_negative_at and analysis.get('sentiment')=='negative' and self.now()-conversation.last_negative_at>=timedelta(minutes=NEGATIVE_ESCALATION_MINUTES):
   q='human_support' if self.is_business_hours() else 'next_working_day'
   return EscalationDecision(True,q,'Negative conversation unresolved for over 15 minutes','negative-unresolved-over-15-minutes',tone)
  if analysis.get('sentiment')=='negative' and not self.is_business_hours(): return EscalationDecision(False,'next_working_day','Normal complaint received outside business hours','after-hours-normal-complaint',tone)
  return EscalationDecision(False,None,None,None,tone)
