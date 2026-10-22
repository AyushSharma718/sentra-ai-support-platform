from datetime import datetime
from zoneinfo import ZoneInfo
from conversation.memory import Conversation
from escalation.engine import EscalationEngine
def test_high_risk():
 now=datetime(2026,9,28,10,0,tzinfo=ZoneInfo('Asia/Kolkata')); d=EscalationEngine(lambda:now).decide('account hacked',{'sentiment':'neutral','urgency':'low','risk':'account_compromise','sarcasm':False,'emotion':'concerned'},Conversation('1')); assert d.required and d.queue=='human_support'
def test_urgent_after_hours():
 now=datetime(2026,9,27,22,0,tzinfo=ZoneInfo('Asia/Kolkata')); d=EscalationEngine(lambda:now).decide('help now',{'sentiment':'negative','urgency':'high','risk':'none','sarcasm':False,'emotion':'urgent'},Conversation('2')); assert d.required and d.queue=='on_call'
def test_normal_negative_after_hours():
 now=datetime(2026,9,27,22,0,tzinfo=ZoneInfo('Asia/Kolkata')); d=EscalationEngine(lambda:now).decide('not fixed',{'sentiment':'negative','urgency':'low','risk':'none','sarcasm':False,'emotion':'frustrated'},Conversation('3')); assert not d.required and d.queue=='next_working_day'
