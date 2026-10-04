"use client";

import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "Center a div three different ways",
  "Explain useEffect with a small example",
  "What's the difference between let and const?",
];

export default function Chat() {
  // THE MEMORY: every turn lives here and is sent to the server each time.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  // Grow the textarea with its content (up to 160px).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  async function send(text) {
    const content = text.trim();
    if (!content || loading) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");

      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      // Roll back so history stays valid, and give the text back to edit.
      setMessages(messages);
      setInput(content);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    setMessages([]);
    setError("");
    setInput("");
  }

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col px-4">
      <header className="flex items-center justify-between border-b border-[#D5DCE2] py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Frontend mentor</h1>
          <p className="text-sm text-[#5B6B78]">Ask about CSS, JavaScript, or React.</p>
        </div>
        <button
          onClick={reset}
          disabled={messages.length === 0 || loading}
          className="rounded-lg border border-[#D5DCE2] px-3 py-1.5 text-sm text-[#16212B] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5C66] disabled:opacity-40"
        >
          New chat
        </button>
      </header>

      <div
        role="log"
        aria-live="polite"
        className="flex-1 space-y-6 overflow-y-auto py-6"
      >
        {messages.length === 0 && (
          <div className="pt-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              What are you working on?
            </h2>
            <div className="mt-5 flex flex-col items-start gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border border-[#D5DCE2] bg-white px-3 py-2 text-left text-sm hover:border-[#0F5C66] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5C66]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#0F5C66] px-4 py-2.5 text-white">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="border-l-2 border-[#0F5C66]/30 pl-4">
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          )
        )}

        {loading && (
          <p className="border-l-2 border-[#0F5C66]/30 pl-4 text-[#5B6B78] motion-safe:animate-pulse">
            Thinking…
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="pb-4">
        <div className="flex items-end gap-2 rounded-2xl border border-[#D5DCE2] bg-white p-2 focus-within:border-[#0F5C66]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question"
            aria-label="Message"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 outline-none placeholder:text-[#5B6B78]"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-[#0F5C66] px-4 py-2 text-sm font-medium text-white hover:bg-[#0B4A52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F5C66] disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-[#5B6B78]">
          Enter to send, Shift+Enter for a new line.
        </p>
      </div>
    </div>
  );
}