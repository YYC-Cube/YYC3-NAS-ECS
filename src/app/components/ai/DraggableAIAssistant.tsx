import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { LLMMessage } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';

export const DraggableAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: LLMMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.llm.sendMessage(userMsg.content);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error("Failed to get response", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50" ref={constraintsRef}>
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={constraintsRef}
        initial={{ x: 20, y: 20 }}
        className="pointer-events-auto absolute"
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="logo"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all border-2 border-white/20 backdrop-blur-md"
              style={{
                backgroundColor: 'var(--module-cpu-primary)',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bot className="text-white w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-[350px] md:w-[400px]"
            >
              <Card className="flex flex-col h-[500px] shadow-2xl border-blue-200/50 bg-white/95 backdrop-blur-sm overflow-hidden rounded-xl">
                {/* Header */}
                <div 
                  className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 flex justify-between items-center cursor-move"
                  onPointerDownCapture={(e) => e.stopPropagation()} // Allow dragging from header
                >
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles size={18} />
                    <h3 className="font-semibold">AI Assistant</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-white hover:bg-white/20"
                      onClick={() => setIsOpen(false)}
                    >
                      <Minimize2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-gray-50/50" viewportRef={scrollRef}>
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-400 mt-20">
                        <Bot size={48} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">How can I help you manage the system?</p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a command..."
                      className="flex-1 focus-visible:ring-blue-500"
                    />
                    <Button 
                      size="icon" 
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
