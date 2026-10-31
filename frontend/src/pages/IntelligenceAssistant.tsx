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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 shadow-2xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">LOOPFLOW Intelligence Copilot</h1>
          <p className="text-xs text-slate-500 mt-0.5">
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
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 text-xs font-medium transition-all text-left shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-4 min-h-[420px] max-h-[550px] overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'USER' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                m.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-600'
              }`}
            >
              {m.sender === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-xl max-w-xl text-xs leading-relaxed space-y-2 ${
                m.sender === 'USER'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs'
              }`}
            >
              <p>{m.text}</p>

              {/* Verified Data Payload Card */}
              {m.data && (
                <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-[11px] font-mono space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified System Aggregation:
                  </div>
                  {m.data.ranking && (
                    <div className="space-y-1 pt-1">
                      {m.data.ranking.slice(0, 4).map((r: any, rIdx: number) => (
                        <div key={rIdx} className="flex justify-between text-slate-800">
                          <span>{r.name}</span>
                          <span className="text-emerald-700 font-bold">₹{r.mrr.toLocaleString('en-IN')}/mo</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.data.invoices && (
                    <div className="space-y-1 pt-1">
                      {m.data.invoices.slice(0, 3).map((inv: any, iIdx: number) => (
                        <div key={iIdx} className="flex justify-between text-rose-700">
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
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <RotateCw className="w-4 h-4 animate-spin text-blue-600" />
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
          className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" /> Ask
        </button>
      </form>
    </div>
  );
};
