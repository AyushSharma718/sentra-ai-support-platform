from collections import deque
class EscalationQueues:
 def __init__(self): self.queues={'human_support':deque(),'on_call':deque(),'next_working_day':deque()}
 def add(self,name,item):
  if name in self.queues:self.queues[name].append(item)
 def get(self,name): return self.queues[name].popleft() if name in self.queues and self.queues[name] else None
 def snapshot(self): return {k:list(v) for k,v in self.queues.items()}
