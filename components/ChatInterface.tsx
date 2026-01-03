
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PaymentStatus } from '../types';
import ReactMarkdown from 'react-markdown';
import { Lock, Send, Sparkles, CreditCard, Copy, Check } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  paymentStatus: PaymentStatus;
  freebieUsed: boolean; // 新增：此生辰是否已用过免费额度
}

const SUGGESTED_QUESTIONS = [
  "明年运势如何？",
  "哪几年财运最好？",
  "婚姻感情有什么注意？",
  "适合去哪个方向发展？",
  "明年有什么大事件？",
  "我的贵人在哪里？"
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, paymentStatus, freebieUsed }) => {
  const [input, setInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleSuggestionClick = (question: string) => {
    if (isLoading) return;
    onSendMessage(question);
  };

  const handleCopy = async () => {
    if (messages.length === 0) return;
    const textToCopy = messages
      .filter(m => m.text)
      .map(msg => msg.role === 'user' ? `【推演需求】${msg.text}` : `【分析反馈】${msg.text}`)
      .join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const isDailyLimitReached = paymentStatus.questionCount >= paymentStatus.dailyLimit;
  
  // 判定是否享有“免费追问”机会：
  const userMessagesCount = messages.filter(m => m.role === 'user').length;
  const canAskFree = userMessagesCount === 0 && !freebieUsed;
  
  // 判定是否需要付费：
  const needsPayment = !paymentStatus.isPaid && !canAskFree;

  // 当至少有一条完整的回复（初始分析报告结束）时显示保存按钮
  const showSaveButton = messages.length > 0 && messages[0].text.length > 50;

  return (
    <div className="flex flex-col h-[520px] md:h-[650px] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden w-full max-w-full relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header: 优化后的响应式状态栏 */}
      <div className="bg-stone-50/80 backdrop-blur-md border-b border-stone-100 p-3 md:p-4 shrink-0 z-20 flex flex-col gap-1.5">
        {/* 第一行：标题与按钮 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm md:text-base font-serif font-bold text-stone-900 truncate shrink-0">
               深度逻辑推演
            </h3>
            {canAskFree && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gold-100 text-gold-700 text-[9px] font-bold rounded-sm border border-gold-200 animate-pulse whitespace-nowrap">
                <Sparkles size={8} /> 赠送免费追问
              </span>
            )}
          </div>
          
          {showSaveButton && (
            <button 
              onClick={handleCopy} 
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition-all shadow-sm active:scale-95 shrink-0"
            >
              {isCopied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              <span className="text-[11px] font-bold">{isCopied ? '已复制' : '保存'}</span>
            </button>
          )}
        </div>

        {/* 第二行：状态计数与隐私提示 */}
        <div className="flex items-center justify-between text-[10px] font-medium leading-tight">
          <div className="min-w-0">
            {isDailyLimitReached ? (
              <span className="text-red-500">● 今日限额已满</span>
            ) : paymentStatus.isPaid ? (
              <span className="text-green-600 flex items-center gap-1">
                <CreditCard size={10} /> 推演中: {paymentStatus.questionCount}/8
              </span>
            ) : (
              <span className="text-stone-400">
                当前消耗: {paymentStatus.questionCount}/{paymentStatus.dailyLimit}
              </span>
            )}
          </div>
          
          {showSaveButton && (
            <span className="text-stone-400 opacity-80 scale-90 origin-right whitespace-nowrap">
              推演结果不留存，网页刷新即销毁，请自行复制保存
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-stone-50/30 hide-scrollbar w-full relative">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`rounded-2xl p-4 shadow-sm text-sm md:text-base break-words min-w-0 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-stone-900 text-stone-100 rounded-tr-none max-w-[85%] md:max-w-[70%]'
                  : 'bg-white text-stone-800 border border-stone-100 rounded-tl-none max-w-[95%] md:max-w-[85%]'
              }`}>
              {msg.role === 'model' ? (
                <div className="markdown-body">
                  <ReactMarkdown 
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-stone-900 border-l-4 border-gold-400 pl-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4 list-disc" {...props} />,
                    }}
                  >
                    {msg.text || '...正在感应天机，请稍等...'}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="bg-white border border-stone-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Section */}
      {canAskFree && !isLoading && (
        <div className="px-4 py-3 bg-white border-t border-stone-100 shrink-0">
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <Sparkles size={10} className="text-gold-500" /> 还没想好？建议您问这些
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button 
                key={i} 
                onClick={() => handleSuggestionClick(q)} 
                className="whitespace-nowrap px-4 py-2 bg-stone-50 border border-stone-200 text-stone-700 text-xs rounded-full hover:bg-gold-50 hover:border-gold-200 transition-all shadow-sm active:scale-95 shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-stone-100 shrink-0 relative">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className={`flex-1 relative transition-all ${isDailyLimitReached ? 'opacity-50' : ''}`}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isDailyLimitReached 
                  ? "今日咨询额度已满" 
                  : isLoading
                    ? "正在感应天机..."
                    : needsPayment 
                      ? "想继续追问？" 
                      : "请输入您想了解的事情..."
              }
              className="w-full pl-4 pr-12 py-3.5 bg-stone-100 border-none rounded-2xl text-sm md:text-base outline-none focus:ring-2 focus:ring-gold-400/30 transition-all text-stone-900 placeholder-stone-400"
              disabled={isLoading || isDailyLimitReached}
            />
            <button 
              type="submit" 
              disabled={isLoading || isDailyLimitReached || (!input.trim() && !needsPayment)} 
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-stone-900 text-gold-400 rounded-xl flex items-center justify-center transition-all hover:bg-black disabled:opacity-30 active:scale-90"
            >
              {needsPayment ? <Lock size={16} /> : <Send size={16} />}
            </button>
          </div>
        </form>
        
        {needsPayment && !isDailyLimitReached && !isLoading && (
          <div 
            className="absolute inset-0 z-10 cursor-pointer" 
            onClick={() => onSendMessage("")} 
          />
        )}
      </div>

    </div>
  );
};

export default ChatInterface;
