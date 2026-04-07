"use client";

import { useState } from "react";
import { engageAgent } from "../lib/agentClient";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export default function AnalystWorkspace() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;

    const text = input.trim();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await engageAgent({
        input: text,
        stage: "analyse",
        company_name: "TestCo",
      });

      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data?.outputs?.analyse || "No analysis returned.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, reply]);
    } catch (error) {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Analyst agent failed to respond.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-white">
      <h2 className="mb-4 text-xl font-semibold">Analyst Agent</h2>

      <div className="mb-4 max-h-[420px] space-y-3 overflow-y-auto rounded-xl bg-slate-950 p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-xl p-3 ${
              message.role === "user" ? "bg-sky-900/40" : "bg-slate-800"
            }`}
          >
            <div className="mb-1 text-xs uppercase text-slate-400">
              {message.role}
            </div>
            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
          </div>
        ))}

        {loading && (
          <div className="rounded-xl bg-slate-800 p-3 text-sm text-slate-300">
            Analyst is thinking...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Analyst..."
        />
        <button
          onClick={handleSend}
          className="rounded-xl bg-sky-600 px-4 py-3 font-medium text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}