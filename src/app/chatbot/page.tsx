"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Copy, Check } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
  fallbackReason?: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  setupRequired: boolean;
}

export default function ChatbotPage() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    setupRequired: false
  });
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  const handleSend = async () => {
    if (!input.trim() || chatState.isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }));

    setInput("");
    textareaRef.current?.focus();

    try {
      const response = await fetch("http://127.0.0.1:5000/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatState.messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        model: data.model,
        fallbackReason: data.fallback_reason
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        setupRequired: data.setup_required || false
      }));
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to get response. Please try again."
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const clearChat = () => {
    setChatState({
      messages: [],
      isLoading: false,
      error: null,
      setupRequired: false
    });
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* 🕸 Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ff000020_1px,transparent_1px),linear-gradient(to_bottom,#ff000020_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* 🔥 Red + Blue Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/30 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full" />

      <div className="relative z-10 flex flex-col h-screen max-h-screen">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-blue-600 rounded-full flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">AI Assistant</h1>
                <p className="text-xs text-gray-400">Powered by OpenAI GPT-4</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all"
            >
              Clear Chat
            </button>
          </div>
        </motion.div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            
            {/* Setup Warning Banner */}
            {chatState.setupRequired && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-600/20 border border-yellow-500/30 rounded-2xl p-4 mb-6 text-yellow-400"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <h3 className="font-semibold mb-2">OpenAI API Key Required</h3>
                    <p className="text-sm">
                      To get real AI responses, you need to configure your OpenAI API key in the backend.
                      <br />
                      <span className="font-mono text-xs bg-yellow-600/30 px-2 py-1 rounded">
                        OPENAI_API_KEY=sk-your-actual-key-here
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Welcome Message */}
            {chatState.messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to AI Assistant</h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  I'm here to help you with coding, writing, analysis, and more. Ask me anything!
                </p>
              </motion.div>
            )}

            {/* Messages */}
            <AnimatePresence>
              {chatState.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`mb-6 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-3xl ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" 
                        ? "bg-red-600" 
                        : "bg-gradient-to-r from-red-600 to-blue-600"
                    }`}>
                      {message.role === "user" ? (
                        <User size={16} className="text-white" />
                      ) : (
                        <Bot size={16} className="text-white" />
                      )}
                    </div>
                    <div className={`relative group ${
                      message.role === "user" 
                        ? "bg-red-600 text-white" 
                        : "bg-white/10 backdrop-blur-md text-white border border-white/20"
                    } rounded-2xl px-4 py-3`}>
                      <div className="pr-8">
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <p className="text-xs opacity-60 mt-2">
                          {formatTimestamp(message.timestamp)}
                          {message.model && (
                            <span className="ml-2 px-2 py-1 bg-white/10 rounded-full text-xs">
                              {message.model === 'smart-fallback' ? '🧠 Smart Mode' : message.model}
                            </span>
                          )}
                        </p>
                        {message.fallbackReason && (
                          <p className="text-xs text-green-400 mt-1">
                            ✨ {message.fallbackReason}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${
                          message.role === "user"
                            ? "bg-red-700 hover:bg-red-800"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        {copiedId === message.id ? (
                          <Check size={14} className="text-green-400" />
                        ) : (
                          <Copy size={14} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {chatState.isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex justify-start"
              >
                <div className="flex gap-3 max-w-3xl">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {chatState.error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-600/20 border border-red-500/30 rounded-2xl p-4 text-red-400"
              >
                {chatState.error}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 backdrop-blur-md border-t border-white/10 px-6 py-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 pr-12 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-red-500 transition-all"
                  rows={1}
                  style={{
                    minHeight: "48px",
                    maxHeight: "120px",
                    overflowY: "auto"
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = Math.min(target.scrollHeight, 120) + "px";
                  }}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {input.length}/4000
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || chatState.isLoading}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-blue-600 rounded-2xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Send size={18} />
                Send
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
