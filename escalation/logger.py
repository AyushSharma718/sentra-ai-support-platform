import json
from pathlib import Path
from datetime import datetime
LOG_FILE=Path('data')/'escalations.jsonl'
def log_escalation(conversation_id,decision,summary):
 LOG_FILE.parent.mkdir(exist_ok=True)
 record={'timestamp':datetime.utcnow().isoformat()+'Z','conversation_id':conversation_id,'queue':decision.queue,'reason':decision.reason,'condition':decision.condition,'summary':summary}
 with LOG_FILE.open('a',encoding='utf-8') as f:f.write(json.dumps(record,ensure_ascii=False)+'\n')
 return record
