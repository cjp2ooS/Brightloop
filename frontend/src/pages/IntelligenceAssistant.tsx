import React, { useState } from 'react';
import { apiRequest } from '../api/client';
import { Sparkles, Send, Bot, User, CheckCircle2, RotateCw } from 'lucide-react';

export const IntelligenceAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'USER' | 'AI'; text: string; data?: any }>>([
    {
      sender: 'AI',
      text: 'Hello! I am LOOPFLOW Intelligence. I query Brightloop’s financial engine in real-time to answer questions about recurring revenue, invoice arrears, cash collections, and product contributions. Ask me anything or select a prompt below.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleQuestions = [
    'How much revenue did we collect this month?',
    'Which invoices are overdue?',
    'How many subscriptions renew this week?',
    'Which products generate the highest MRR?',
  ];

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg = { sender: 'USER' as const, text: questionText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiRequest('/intelligence/query', {
        method: 'POST',
        body: JSON.stringify({ question: questionText }),
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'AI',
          text: res.answer,
          data: res.data,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'AI',
          text: `Error processing financial query: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">LOOPFLOW Financial Intelligence</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified backend calculations with zero hallucinations or fabricated numbers.
          </p>
        </div>
      </div>

      {/* Suggested Chips */}
      <div className="flex flex-wrap gap-2">
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(q)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 text-xs transition-all text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 min-h-[420px] max-h-[550px] overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'USER' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                m.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400'
              }`}
            >
              {m.sender === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-xl max-w-xl text-xs leading-relaxed space-y-2 ${
                m.sender === 'USER'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 border border-slate-800 text-slate-200'
              }`}
            >
              <p>{m.text}</p>

              {/* Verified Data Payload Card */}
              {m.data && (
                <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified System Aggregation:
                  </div>
                  {m.data.ranking && (
                    <div className="space-y-1 pt-1">
                      {m.data.ranking.slice(0, 4).map((r: any, rIdx: number) => (
                        <div key={rIdx} className="flex justify-between text-slate-300">
                          <span>{r.name}</span>
                          <span className="text-emerald-400 font-bold">₹{r.mrr.toLocaleString('en-IN')}/mo</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.data.invoices && (
                    <div className="space-y-1 pt-1">
                      {m.data.invoices.slice(0, 3).map((inv: any, iIdx: number) => (
                        <div key={iIdx} className="flex justify-between text-rose-300">
                          <span>{inv.invoiceNumber} ({inv.customerName})</span>
                          <span>Due: ₹{inv.balanceDue.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <RotateCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Querying verified database metrics...</span>
          </div>
        )}
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(input);
        }}
        className="flex items-center gap-3"
      >
        <input
          type="text"
          placeholder="Ask a financial or operational question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> Ask
        </button>
      </form>
    </div>
  );
};
