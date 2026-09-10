import React, { useState } from 'react';
import { 
  Bot, 
  CornerDownLeft, 
  Loader2, 
  Send, 
  Sparkles, 
  X 
} from 'lucide-react';
import { useNexus } from '../context/NexusContext.js';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actionTaken?: string;
  timestamp: string;
}

export const AssistantDrawer: React.FC = () => {
  const { isAssistantOpen, setIsAssistantOpen, askAssistant } = useNexus();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'I am **NEXUS AI**, your real-time trading desk copilot. You can ask me to evaluate markets, inspect rejected trades, check open portfolio risks, or compare regimes.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  if (!isAssistantOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askAssistant(textToSend);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.response,
        actionTaken: res.actionTaken,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Error communicating with Nexus desk tools: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Analyze BTC',
    'Why was this trade rejected?',
    'Show the riskiest position',
    'Compare BTC and ETH'
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#0f1420] border-l border-slate-800 z-50 flex flex-col shadow-2xl">
      {/* Drawer Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-mono">NEXUS AI ASSISTANT</div>
            <div className="text-[10px] text-slate-400">Integrated Trading Desk Tools</div>
          </div>
        </div>
        <button
          onClick={() => setIsAssistantOpen(false)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Actions */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap gap-1.5">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSend(prompt)}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition border border-slate-700/60"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[88%] p-2.5 rounded-xl text-xs leading-relaxed ${
              m.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
            }`}>
              {m.actionTaken && (
                <div className="mb-2 px-2 py-1 rounded bg-sky-500/20 border border-sky-500/30 text-[10px] font-mono text-sky-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>{m.actionTaken}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap font-sans">{m.text}</div>
            </div>
            <span className="text-[9px] text-slate-400 mt-1 font-mono">{m.timestamp}</span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono py-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Consulting desk agents and risk models...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Nexus desk or request an action..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition font-sans"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
