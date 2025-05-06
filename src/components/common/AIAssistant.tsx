
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Send, X, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate AI thinking
    setTimeout(() => {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: generateResponse(input),
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      toast.success('Voice recording processed');
      
      // Simulate voice recognition result
      setInput('Can you help me analyze sales trends from last quarter?');
    } else {
      // Start recording
      setIsRecording(true);
      toast.info('Listening... Speak now');
    }
  };

  const handleFileUpload = () => {
    toast.info('File upload feature coming soon');
  };

  // Mock function to generate AI responses
  const generateResponse = (query: string): string => {
    const responses = [
      "I'd be happy to help you with that! Based on the information you've provided, I recommend starting by...",
      "That's a great question. The best approach would be to analyze the data first and then make a decision based on the results.",
      "I've looked into that for you. The most effective strategy would be to segment your customer base and tailor your approach to each segment.",
      "Based on best practices in the industry, I suggest implementing a structured follow-up system to increase your conversion rates.",
      "Let me help you with that. First, let's break down the problem into manageable parts and tackle each one systematically."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full neuro shadow-lg z-50"
        >
          AI
        </Button>
      )}

      {/* Assistant dialog */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[90vw] max-w-md h-[500px] neuro shadow-xl border-none z-50 flex flex-col">
          <CardHeader className="space-y-1 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] neuro p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-pulse text-white rounded-tr-none'
                      : 'bg-muted/50 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-[10px] text-right mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
          
          <CardFooter className="border-t p-3 gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className={`h-8 w-8 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : ''}`}
              onClick={toggleRecording}
            >
              <Mic className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleFileUpload}
            >
              <UploadCloud className="h-4 w-4" />
            </Button>
            
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="neuro-inset text-sm min-h-[40px] focus:shadow-none resize-none"
              style={{ height: '40px' }}
            />
            
            <Button 
              disabled={!input.trim()}
              onClick={handleSend}
              className="h-8 w-8 rounded-full bg-pulse hover:bg-pulse/90 p-0 flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
};
