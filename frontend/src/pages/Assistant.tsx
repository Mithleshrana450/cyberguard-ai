import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, Trash2, User as UserIcon } from "lucide-react";
import AppLayout from "../components/layout/AppLayout";
import api from "../services/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const SUGGESTED_PROMPTS = [
  "What's my biggest security risk right now?",
  "Explain what a brute-force attack is.",
  "Summarize my recent alerts.",
  "What is a Content-Security-Policy header for?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-secondary"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = () => {
    api.get<ChatMessage[]>("/assistant/history").then((res) => setMessages(res.data));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setError(null);
    setInput("");
    setIsSending(true);

    const optimisticUser: ChatMessage = {
      id: `pending-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...(prev || []), optimisticUser]);

    try {
      const response = await api.post("/assistant/chat", { message: text });
      setMessages((prev) => [
        ...(prev || []).filter((m) => m.id !== optimisticUser.id),
        response.data.user_message,
        response.data.assistant_message,
      ]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "The assistant couldn't respond. Try again.");
      setMessages((prev) => (prev || []).filter((m) => m.id !== optimisticUser.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClear = async () => {
    await api.delete("/assistant/history");
    setMessages([]);
  };

  return (
    <AppLayout title="AI Security Assistant">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <p className="text-text-primary text-xl font-semibold tracking-tight">Ask about your security posture</p>
          <p className="text-text-secondary text-sm mt-1">
            Grounded in your latest scans, alerts, and threat-intel results.
          </p>
        </div>
        <AnimatePresence>
          {messages && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClear}
              className="flex items-center gap-1.5 text-text-secondary hover:text-critical text-sm transition-colors"
            >
              <Trash2 size={14} />
              Clear chat
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="card flex flex-col h-[600px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages === null && (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
              Loading...
            </div>
          )}

          {messages && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
                <Sparkles size={20} strokeWidth={1.5} className="text-accent" />
              </div>
              <div>
                <p className="text-text-primary text-sm font-medium mb-1">Ask me anything security-related</p>
                <p className="text-text-secondary text-xs max-w-[320px]">
                  I can explain vulnerabilities, summarize your alerts, or answer general
                  questions - grounded in your actual scan and alert data when relevant.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-[420px]">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs border border-border rounded-lg px-3 py-1.5 text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages?.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "assistant" ? "bg-accent/15 text-accent" : "bg-surface-elevated text-text-secondary"
                  }`}
                >
                  {msg.role === "assistant" ? <Bot size={14} /> : <UserIcon size={14} />}
                </div>
                <div
                  className={`max-w-[75%] rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "bg-surface-elevated text-text-primary"
                      : "bg-accent/10 text-text-primary"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isSending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-surface-elevated rounded-lg px-3.5 py-3 flex items-center">
                <TypingDots />
              </div>
            </motion.div>
          )}
        </div>

        {error && <p className="text-critical text-xs px-5 pb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a security question..."
            className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.93 }}
            type="submit"
            disabled={isSending || !input.trim()}
            className="bg-accent text-background rounded-lg px-4 py-2 hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </div>
    </AppLayout>
  );
}
