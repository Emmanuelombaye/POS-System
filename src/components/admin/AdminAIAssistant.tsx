import { useState, useRef, useEffect } from "react";
import { Send, X, Minimize2, Maximize2, Loader, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/appStore";
import { api } from "@/utils/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AdminAIAssistantProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminAIAssistant = ({ isOpen = true, onClose }: AdminAIAssistantProps) => {
  const { currentUser } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content: "Hello! I'm your POS system AI assistant. I can help you with:\n\n📊 Stock Analysis - Check low-stock items, overstock, and variances\n👥 Shift Oversight - Monitor cashier shifts and flag discrepancies\n💰 Sales Reports - Top items, trends, and promotion suggestions\n🔍 System Queries - Quick insights about your branches\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.post("/api/ai/chat", {
        query: inputValue,
      });
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get AI response";
      setError(errorMessage);
      const errorResponse: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Only show AI assistant to admins
  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-6 right-6 w-96 max-h-[600px] z-50 lg:w-96 md:w-80 sm:w-72"
      >
        <Card className="border-none shadow-2xl rounded-2xl overflow-hidden flex flex-col h-full bg-white">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-brand-charcoal to-brand-charcoal/80 text-white p-4 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-lg">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <CardTitle className="text-base font-black">AI Assistant</CardTitle>
                <p className="text-xs text-white/60">Real-time insights & suggestions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-2xl ${
                        message.role === "user"
                          ? "bg-brand-burgundy text-white rounded-br-sm font-semibold"
                          : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user" ? "text-white/60" : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-2 items-center">
                        <Loader className="h-4 w-4 animate-spin text-brand-burgundy" />
                        <p className="text-sm text-gray-600">Analyzing your data...</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-red-50 border border-red-200 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-2 items-start">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ask about stock, shifts, or sales..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    className="flex-1 rounded-full border-gray-300 focus:border-brand-burgundy focus:ring-brand-burgundy placeholder:text-gray-400"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="rounded-full bg-brand-burgundy hover:bg-brand-burgundy/90 text-white font-bold p-2 h-10 w-10 flex items-center justify-center"
                    title="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Try: "Low stock items", "Cashier discrepancies", "Top selling items"
                </p>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
