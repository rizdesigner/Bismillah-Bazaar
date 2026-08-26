"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import type { SupabaseClient } from "@supabase/supabase-js";

type Conversation = {
  id: string;
  user_id: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

function useSupabase() {
  const ref = useRef<SupabaseClient | null>(null);
  if (!ref.current && typeof window !== "undefined") {
    ref.current = createClient();
  }
  return ref;
}

export default function MessagesPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useSupabase();

  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  }, [supabaseRef]);

  const [error, setError] = useState<string | null>(null);

  const initConversation = useCallback(async () => {
    let cancelled = false;
    try {
      const supabase = getSupabase();
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        if (!cancelled) { setError("Auth error: " + authError.message); setLoading(false); }
        return;
      }
      if (!user) {
        if (!cancelled) { setError("Not logged in"); setLoading(false); }
        return;
      }

      let { data: conv, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.log("Conversation fetch error:", error.code, error.message);
        if (error.code === 'PGRST116') {
          const { data: newConv, error: insertError } = await supabase
            .from("conversations")
            .insert({ user_id: user.id })
            .select()
            .single();
          if (insertError) {
            if (!cancelled) { setError("Cannot create conversation: " + insertError.message); setLoading(false); }
            return;
          }
          conv = newConv;
        } else {
          if (!cancelled) { setError("Database error: " + error.message); setLoading(false); }
          return;
        }
      }

      if (!cancelled) {
        setConversation(conv);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("initConversation error:", err);
      if (!cancelled) { setError(err.message || "Unknown error"); setLoading(false); }
    }
    return () => { cancelled = true; };
  }, [getSupabase]);

  const fetchMessages = useCallback(async () => {
    if (!conversation) return;
    const supabase = getSupabase();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  }, [conversation, getSupabase]);

  const sendMessage = useCallback(async () => {
    const supabase = getSupabase();
    if (!newMessage.trim() || !conversation || sending) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: msg } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_role: "customer",
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    }
    setSending(false);
  }, [newMessage, conversation, sending, getSupabase]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cleanup = initConversation();
      return cleanup;
    }
  }, [initConversation]);

  useEffect(() => {
    if (!conversation) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-zinc-500">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        <p className="mt-2 text-xs text-zinc-500">
          The messaging tables may not exist yet. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-180px)] flex-col sm:h-[calc(100dvh-200px)]">
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Messages</h1>
      <p className="mt-1 text-sm text-zinc-600">Chat with the butcher about your orders.</p>

      <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <p className="text-center text-sm text-zinc-500">
              No messages yet. Send a message to start the conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {messages.map((msg) => {
              const isMine = msg.sender_role === "customer";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[70%] ${
                      isMine
                        ? "bg-emerald-600 text-white rounded-br-md"
                        : "bg-zinc-100 text-zinc-900 rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        isMine ? "text-emerald-200" : "text-zinc-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          className="flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
