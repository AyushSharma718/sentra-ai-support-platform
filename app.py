import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
from config import TIMEZONE
from ai.gemini import generate_response
from conversation.memory import Conversation
from sentiment.analyzer import analyze
from escalation.engine import EscalationEngine
from escalation.queues import EscalationQueues
from escalation.logger import log_escalation
def main():
 print('='*60);print(' GEMINI MULTILINGUAL SUPPORT BOT');print('='*60);print("Type 'exit' to quit. Type 'queue' to inspect queues.\n")
 c=Conversation(str(uuid.uuid4()),started_at=datetime.now(ZoneInfo(TIMEZONE))); engine=EscalationEngine(); queues=EscalationQueues()
 while True:
  message=input('You: ').strip()
  if message.lower()=='exit': print('Bot: Goodbye!');break
  if message.lower()=='queue': print(queues.snapshot());continue
  if not message:continue
  analysis=analyze(message,c.history_for_model())
  if analysis.get('sentiment')=='negative': c.negative_count+=1; c.last_negative_at=c.last_negative_at or engine.now()
  d=engine.decide(message,analysis,c)
  if d.required:
   summary=f"Latest message: {message}. Sentiment: {analysis.get('sentiment')}. Risk: {analysis.get('risk')}. Urgency: {analysis.get('urgency')}."
   queues.add(d.queue,{'conversation_id':c.conversation_id,'reason':d.reason,'condition':d.condition,'summary':summary});log_escalation(c.conversation_id,d,summary);c.escalated=True
  answer=generate_response(message,c.history_for_model(),d.tone,d.required);c.add(message,answer,analysis);print('\nBot:',answer)
  if d.required: print(f'\n[ESCALATED -> {d.queue}]')
  elif d.queue=='next_working_day': print('\n[Scheduled for next working day]')
  print()
if __name__=='__main__':main()
