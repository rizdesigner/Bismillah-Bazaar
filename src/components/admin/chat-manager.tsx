"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";

type Conversation = {
  id: string;
  user_id: string;
  admin_unread_count: number;
  customer_unread_count: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    restaurant_name: string | null;
    email: string;
  } | null;
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

export function ChatManager() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedConvId) return;
    fetchMessages(selectedConvId);
    const interval = setInterval(() => fetchMessages(selectedConvId), 5000);
    return () => clearInterval(interval);
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    setLoadingConvs(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.role !== "admin") return;

    const { data } = await supabase
      .from("conversations")
      .select(`
        id,
        user_id,
        admin_unread_count,
        customer_unread_count,
        created_at,
        updated_at,
        users!user_id(id, restaurant_name, email)
      `)
      .order("updated_at", { ascending: false });

    const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      user: Array.isArray(row.users) ? row.users[0] ?? null : row.users ?? null,
    }));
    setConversations(mapped as Conversation[]);
    setLoadingConvs(false);
  }

  async function fetchMessages(convId: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConvId || sending) return;
    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: msg } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConvId,
        sender_id: user.id,
        sender_role: "admin",
        content: newMessage.trim(),
      })
      .select()
      .single();

    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      fetchConversations();
    }
    setSending(false);
  }

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="flex h-[calc(100dvh-200px)] gap-4">
      {/* Conversation List */}
      <div className="w-64 flex-shrink-0 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
        <div className="sticky top-0 bg-white p-3 border-b border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900">Conversations</h3>
        </div>
        {loadingConvs ? (
          <p className="p-4 text-xs text-zinc-500">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-xs text-zinc-500">No conversations yet</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`w-full border-b border-zinc-100 p-3 text-left hover:bg-zinc-50 ${
                selectedConvId === conv.id ? "bg-emerald-50" : ""
              }`}
            >
              <p className="text-sm font-medium text-zinc-900">
                {conv.user?.restaurant_name || conv.user?.email || "Unknown"}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {conv.user?.email}
              </p>
              <p className="mt-1 text-[10px] text-zinc-400">
                {new Date(conv.updated_at).toLocaleString()}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col rounded-lg border border-zinc-200 bg-white">
        {selectedConvId ? (
          <>
            <div className="flex-shrink-0 border-b border-zinc-100 p-3">
              <p className="text-sm font-semibold text-zinc-900">
                {selectedConv?.user?.restaurant_name || selectedConv?.user?.email}
              </p>
              <p className="text-xs text-zinc-500">{selectedConv?.user?.email}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.sender_role === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
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

            <div className="flex-shrink-0 flex gap-2 border-t border-zinc-100 p-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())
                }
                placeholder="Type a message..."
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">
              Select a conversation to view messages
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
