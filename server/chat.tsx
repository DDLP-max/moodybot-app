import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, mode: "savage" })
    });

    const data = await res.json();
    const botMessage = { role: "bot", content: data.reply || "..." };
    setMessages(prev => [...prev, botMessage]);
  };

  return (
    <div className="chat-container">
      <h1 className="text-4xl font-black mb-6 gradient-text text-center text-shadow-neon">
        MoodyBot Chat
      </h1>

      <div className="mb-6 max-h-[60vh] overflow-y-auto">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={`message ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {msg.content}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-grow"
          placeholder="Confess to MoodyBot…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <Button className="bg-primary shadow-brutal" onClick={handleSend}>
          Send
        </Button>
      </div>
    </div>
  );
}
