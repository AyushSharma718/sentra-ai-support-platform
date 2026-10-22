from dataclasses import dataclass,field
from datetime import datetime
@dataclass
class Conversation:
    conversation_id:str
    messages:list=field(default_factory=list)
    started_at:datetime=field(default_factory=datetime.now)
    last_negative_at:datetime|None=None
    negative_count:int=0
    resolved:bool=False
    escalated:bool=False
    def add(self,user,assistant,analysis=None): self.messages.append({'user':user,'assistant':assistant,'analysis':analysis or {}})
    def history_for_model(self): return [{'user':m['user'],'assistant':m['assistant']} for m in self.messages]
