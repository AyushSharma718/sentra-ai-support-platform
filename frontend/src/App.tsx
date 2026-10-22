
import { useCallback, useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight,
  Bot, CheckCircle2, ChevronRight, CircleHelp, Clock3,
  LayoutDashboard, MessageSquare, Plus, Send, ShieldAlert,
  ShieldCheck, Users, Zap
} from "lucide-react";
// @ts-expect-error CSS is loaded by the bundler; it has no TypeScript declarations.
import "./index.css";


const API = (
  (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "") + "/api";

type Analysis = {
  language?: string;
  sentiment?: string;
  urgency?: string;
  risk?: string;
  emotion?: string;
  confidence?: number;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  analysis?: Analysis;
  escalation?: { required: boolean; queue?: string | null; reason?: string | null };
};

type Queues = Record<string, Array<{
  conversation_id: string;
  reason: string;
  condition: string;
  summary: string;
}>>;

type Dashboard = {
  total_conversations: number;
  total_messages: number;
  escalated_conversations: number;
  queues: Record<string, number>;
  risk_counts: Record<string, number>;
  sentiment_counts: Record<string, number>;
};

const emptyDashboard: Dashboard = {
  total_conversations: 0,
  total_messages: 0,
  escalated_conversations: 0,
  queues: {},
  risk_counts: {},
  sentiment_counts: {},
};

function App() {
  const [page, setPage] = useState<"overview" | "chat" | "queues">("overview");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [queues, setQueues] = useState<Queues>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const refreshData = useCallback(async () => {
    try {
      const [health, dash, queueData] = await Promise.all([
        fetch(`${API}/health`),
        fetch(`${API}/dashboard`),
        fetch(`${API}/queues`),
      ]);
      if (!health.ok || !dash.ok || !queueData.ok) throw new Error("API unavailable");
      const d = await dash.json();
      const q = await queueData.json();
      setDashboard(d);
      setQueues(q);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
    const id = window.setInterval(() => void refreshData(), 5000);
    return () => window.clearInterval(id);
  }, [refreshData]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");
    setMessages((old) => [...old, { role: "user", text }]);
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          ...(conversationId ? { conversation_id: conversationId } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "The request failed.");

      setConversationId(data.conversation_id);
      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          text: data.reply,
          analysis: data.analysis,
          escalation: data.escalation,
        },
      ]);
      await refreshData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reach the backend.");
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setError("");
    setPage("chat");
  }

  const queueEntries = Object.entries(queues);
  const queueTotal = queueEntries.reduce((n, [, items]) => n + items.length, 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Bot size={23} /></div>
          <div><strong>Sentra AI</strong><span>SUPPORT INTELLIGENCE</span></div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav">
          <button className={page === "overview" ? "nav-item active" : "nav-item"} onClick={() => setPage("overview")}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button className={page === "chat" ? "nav-item active" : "nav-item"} onClick={() => setPage("chat")}>
            <MessageSquare size={18} /> AI Assistant
          </button>
          <button className={page === "queues" ? "nav-item active" : "nav-item"} onClick={() => setPage("queues")}>
            <ShieldAlert size={18} /> Escalation queues
            {queueTotal > 0 && <span className="nav-count">{queueTotal}</span>}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card">
            <ShieldCheck size={19} />
            <strong>AI risk monitoring</strong>
            <p>Messages are analyzed for sentiment, urgency and potential risk.</p>
          </div>
          <div className="connection">
            <span className={connected ? "status-dot online" : "status-dot"} />
            <span>{connected ? "Backend connected" : "Backend disconnected"}</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace <ChevronRight size={13} /> <span>{page === "overview" ? "Overview" : page === "chat" ? "AI Assistant" : "Escalation queues"}</span></div>
            <h1>{page === "overview" ? "Support overview" : page === "chat" ? "AI support assistant" : "Escalation center"}</h1>
          </div>
          <div className="topbar-right">
            <span className="live-pill"><span className="status-dot online" /> LIVE DATA</span>
            <div className="avatar">A</div>
          </div>
        </header>

        {page === "overview" && (
          <section className="page-content">
            <div className="welcome-row">
              <div><h2>Your support at a glance</h2><p>Monitor AI conversations and customer risk in one place.</p></div>
              <button className="primary-button" onClick={newConversation}><Plus size={17} /> New conversation</button>
            </div>

            <div className="metric-grid">
              <Metric title="Conversations" value={dashboard.total_conversations} icon={<MessageSquare />} note="Tracked this session" />
              <Metric title="Messages analyzed" value={dashboard.total_messages} icon={<Activity />} note="User messages processed" />
              <Metric title="Escalated conversations" value={dashboard.escalated_conversations} icon={<ShieldAlert />} note="Flagged for human support" />
              <Metric title="Open queue items" value={queueTotal} icon={<Zap />} note="Across all escalation queues" />
            </div>

            <div className="dashboard-grid">
              <section className="panel">
                <div className="panel-heading"><div><h3>Escalation queues</h3><p>Current items by routing destination</p></div><button className="text-button" onClick={() => setPage("queues")}>View all <ArrowUpRight size={15} /></button></div>
                <div className="queue-summary">
                  <QueueCard title="Human support" count={queues.human_support?.length ?? 0} color="purple" icon={<Users />} />
                  <QueueCard title="On-call" count={queues.on_call?.length ?? 0} color="red" icon={<Zap />} />
                  <QueueCard title="Next working day" count={queues.next_working_day?.length ?? 0} color="amber" icon={<Clock3 />} />
                </div>
                {queueTotal === 0 && <div className="empty-state"><ShieldCheck size={25} /><strong>No active escalations</strong><span>Escalated cases will appear here.</span></div>}
                {queueTotal > 0 && <QueueList queues={queues} limit={3} />}
              </section>

              <section className="panel">
                <div className="panel-heading"><div><h3>Risk intelligence</h3><p>Detected risk categories</p></div><ShieldAlert size={19} className="muted-icon" /></div>
                {Object.keys(dashboard.risk_counts).length === 0 ? (
                  <div className="empty-state"><Activity size={25} /><strong>Waiting for activity</strong><span>Risk classifications appear after messages are analyzed.</span></div>
                ) : Object.entries(dashboard.risk_counts).map(([risk, count]) => (
                  <div className="risk-row" key={risk}><span className="risk-dot" /><span>{risk.replaceAll("_", " ")}</span><strong>{count}</strong></div>
                ))}
                <div className="sentiment-section">
                  <h4>Sentiment signals</h4>
                  {Object.entries(dashboard.sentiment_counts).length === 0 ? <p className="muted-text">No sentiment data yet.</p> : Object.entries(dashboard.sentiment_counts).map(([name, count]) => (
                    <div className="sentiment-row" key={name}><span>{name}</span><strong>{count}</strong></div>
                  ))}
                </div>
              </section>
            </div>

            <div className="footer-note"><Activity size={14} /> Metrics refresh automatically every 5 seconds. Data reflects the current backend process.</div>
          </section>
        )}

        {page === "chat" && (
          <section className="chat-layout">
            <div className="chat-panel">
              <div className="chat-header"><div className="bot-avatar"><Bot /></div><div><strong>Sentra AI assistant</strong><span><i /> Powered by your Gemini backend</span></div><button className="secondary-button" onClick={newConversation}><Plus size={15} /> New chat</button></div>
              <div className="messages">
                {messages.length === 0 && <div className="chat-welcome"><div className="welcome-icon"><Bot size={30} /></div><h2>How can I help today?</h2><p>Send a customer message to test multilingual support, sentiment analysis and risk-based escalation.</p><div className="suggestions">{["I was charged twice for the same payment.", "My account has been hacked.", "मेरा पेमेंट कट गया है लेकिन ऑर्डर कन्फर्म नहीं हुआ।"].map((s) => <button key={s} onClick={() => setInput(s)}>{s}<ArrowDownLeft size={15} /></button>)}</div></div>}
                {messages.map((m, i) => <div className={`message-row ${m.role}`} key={i}><div className="message-avatar">{m.role === "assistant" ? <Bot size={17} /> : "A"}</div><div className="message-body"><div className="message-name">{m.role === "assistant" ? "Sentra AI" : "You"} <span>{m.role === "assistant" ? "AI RESPONSE" : "CUSTOMER"}</span></div><div className="bubble">{m.text}</div>
                  {m.analysis && <div className="analysis-tags">{m.analysis.sentiment && <span className={`tag ${m.analysis.sentiment}`}>{m.analysis.sentiment}</span>}{m.analysis.urgency && <span className={`tag ${m.analysis.urgency}`}>{m.analysis.urgency} urgency</span>}{m.analysis.risk && m.analysis.risk !== "none" && <span className="tag high-risk"><AlertTriangle size={12} /> {m.analysis.risk.replaceAll("_", " ")}</span>}</div>}
                  {m.escalation?.required && <div className="escalation-notice"><ShieldAlert size={16} /><div><strong>Escalation triggered</strong><span>{m.escalation.reason} · Queue: {m.escalation.queue}</span></div></div>}
                </div></div>)}
                {loading && <div className="typing"><span /><span /><span /> Analyzing message with Gemini…</div>}
                <div id="chat-bottom" />
              </div>
              <form className="composer" onSubmit={sendMessage}><textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a customer support message…" rows={2} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(e as unknown as React.FormEvent); } }} /><div className="composer-bottom"><span><CircleHelp size={14} /> Enter to send · Shift + Enter for a new line</span><button className="primary-button" disabled={loading || !input.trim()}><Send size={15} /> {loading ? "Analyzing…" : "Send message"}</button></div></form>
              {error && <div className="error-banner">{error}</div>}
            </div>
            <aside className="context-panel">
              <div className="context-heading"><Activity size={18} /><strong>Live intelligence</strong></div>
              <p className="context-description">Analysis appears here after the assistant processes a message.</p>
              {(() => {
                const last = [...messages].reverse().find((m) => m.analysis);
                if (!last?.analysis) return <div className="context-empty"><ShieldCheck size={25} /><span>Awaiting message analysis</span></div>;
                const a = last.analysis;
                return <><div className="context-label">SENTIMENT</div><div className="context-value">{a.sentiment ?? "Unknown"}</div><div className="context-label">URGENCY</div><div className="context-value">{a.urgency ?? "Unknown"}</div><div className="context-label">DETECTED RISK</div><div className="context-value">{(a.risk ?? "none").replaceAll("_", " ")}</div><div className="context-label">LANGUAGE</div><div className="context-value">{a.language ?? "Unknown"}</div>{last.escalation?.required && <div className="context-alert"><AlertTriangle size={17} /><span>This conversation was escalated to {last.escalation.queue}.</span></div>}</>;
              })()}
              <div className="context-bottom"><ShieldCheck size={16} /><span>AI-assisted triage. Human review remains important for high-risk cases.</span></div>
            </aside>
          </section>
        )}

        {page === "queues" && <section className="page-content"><div className="welcome-row"><div><h2>Escalation management</h2><p>Cases routed by the Python escalation engine.</p></div><button className="secondary-button" onClick={() => void refreshData()}><Activity size={15} /> Refresh data</button></div><div className="metric-grid"><Metric title="Human support" value={queues.human_support?.length ?? 0} icon={<Users />} note="Business-hours routing" /><Metric title="On-call" value={queues.on_call?.length ?? 0} icon={<Zap />} note="Urgent / after-hours routing" /><Metric title="Next working day" value={queues.next_working_day?.length ?? 0} icon={<Clock3 />} note="Non-urgent after-hours cases" /><Metric title="All queue items" value={queueTotal} icon={<ShieldAlert />} note="Currently in memory" /></div><section className="panel queue-full"><QueueList queues={queues} /></section></section>}
      </main>
    </div>
  );
}

function Metric({ title, value, icon, note }: { title: string; value: number; icon: React.ReactNode; note: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{title}</span><div className="metric-icon">{icon}</div></div><div className="metric-value">{value.toLocaleString()}</div><div className="metric-note">{note}</div></div>;
}

function QueueCard({ title, count, color, icon }: { title: string; count: number; color: string; icon: React.ReactNode }) {
  return <div className="queue-card"><div className={`queue-card-icon ${color}`}>{icon}</div><span>{title}</span><strong>{count}</strong></div>;
}

function QueueList({ queues, limit }: { queues: Queues; limit?: number }) {
  const items = Object.entries(queues).flatMap(([name, list]) => list.map((item) => ({ ...item, queueName: name }))).slice(0, limit);
  if (items.length === 0) return null;
  return <div className="queue-list">{items.map((item, i) => <div className="queue-item" key={`${item.conversation_id}-${i}`}><div className="queue-item-icon"><ShieldAlert size={17} /></div><div className="queue-item-main"><strong>{item.reason}</strong><p>{item.summary}</p><span>ID: {item.conversation_id.slice(0, 8)}…</span></div><span className={`queue-badge ${item.queueName}`}>{item.queueName.replaceAll("_", " ")}</span></div>)}</div>;
}

export default App;
