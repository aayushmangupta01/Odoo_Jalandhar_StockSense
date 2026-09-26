import React, { useState } from 'react';
import { inventoryApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/button';
import { useToast } from '../../components/common/ToastContext';
import { Bot, Send, Sparkles, Database, CheckCircle2 } from 'lucide-react';

export function StockDetectivePage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am **Stock Detective**, your natural-language inventory analyst. Ask me any question grounded in your current products, stock levels, movement history, ledgers, or detected anomalies.',
      sampleChips: [
        'Why did steel stock change?',
        'Which products are at risk of stockout?',
        'Show unusual inventory movements',
        'What happened to Copper Wire recently?',
      ],
    },
  ]);

  const handleQuery = async (queryText) => {
    const textToSubmit = queryText || query;
    if (!textToSubmit.trim()) return;

    // Append user message
    const newHistory = [...chatHistory, { role: 'user', content: textToSubmit }];
    setChatHistory(newHistory);
    setQuery('');
    setLoading(true);

    try {
      const res = await inventoryApi.queryStockDetective(textToSubmit);
      setChatHistory([
        ...newHistory,
        {
          role: 'assistant',
          content: res.answer,
          evidence: res.evidence,
        },
      ]);
    } catch (err) {
      showToast('Failed to query Stock Detective: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" /> Stock Detective Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Natural-language inventory analyst. Answers are strictly grounded in authoritative database state without hallucinating.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" /> DB Grounded Intelligence
        </div>
      </div>

      {/* Chat Conversation Scroll Area */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-5 overflow-y-auto space-y-4 shadow-xl backdrop-blur-md custom-scrollbar">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl p-4 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/40 rounded-tr-none'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

              {/* Render Sample Query Chips */}
              {msg.sampleChips && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                  {msg.sampleChips.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => handleQuery(chip)}
                      className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 animate-pulse font-mono">
              Analyzing database products, receipts, deliveries, and stock ledger...
            </div>
          </div>
        )}
      </div>

      {/* Query Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleQuery();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Stock Detective a question (e.g. 'Why did steel inventory decrease yesterday?')"
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
        />
        <Button type="submit" isLoading={loading} icon={Send} className="px-5">
          Ask
        </Button>
      </form>
    </div>
  );
}

export default StockDetectivePage;
