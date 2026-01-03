
import React, { useState, useRef, useEffect } from 'react';
import InputForm from './components/InputForm';
import BaziChartDisplay from './components/BaziChartDisplay';
import ChatInterface from './components/ChatInterface';
import LifeKLineChart from './components/LifeKLineChart'; // 还原引入 K线图组件
import { UserInput, BaziChart, ChatMessage, PaymentStatus, OrderInfo, LifeDestinyResult } from './types';
import { calculateBazi, generateLocalLifeKLine } from './services/baziHelper'; // 引入K线生成函数
import { baziChatService } from './services/geminiService';
import { CheckCircle2, ShieldCheck, Wallet, ExternalLink, RefreshCw, Star, Sparkles, Quote } from 'lucide-react';

const STORAGE_KEY = 'bazi_usage_record';
const FREEBIE_MAP_KEY = 'bazi_freebie_usage_map';

const App: React.FC = () => {
  const [baziChart, setBaziChart] = useState<BaziChart | null>(null);
  const [lifeDestiny, setLifeDestiny] = useState<LifeDestinyResult | null>(null); // 新增 K线数据状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentBaziKey, setCurrentBaziKey] = useState<string | null>(null);
  const [freebieUsed, setFreebieUsed] = useState(false);

  const [payment, setPayment] = useState<PaymentStatus>({
    isPaid: false,
    questionCount: 0,
    dailyLimit: 8
  });
  
  const [currentOrder, setCurrentOrder] = useState<OrderInfo | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const record = localStorage.getItem(STORAGE_KEY);
    if (record) {
      const { date, count } = JSON.parse(record);
      if (date === new Date().toDateString()) {
        setPayment(prev => ({ ...prev, questionCount: count }));
      }
    }
  }, []);

  const updateUsageRecord = (newCount: number) => {
    const today = new Date().toDateString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: newCount }));
    setPayment(prev => ({ ...prev, questionCount: newCount }));
  };

  const markFreebieAsUsed = (key: string) => {
    const mapStr = localStorage.getItem(FREEBIE_MAP_KEY);
    const map = mapStr ? JSON.parse(mapStr) : {};
    map[key] = true;
    localStorage.setItem(FREEBIE_MAP_KEY, JSON.stringify(map));
    setFreebieUsed(true);
  };

  const checkFreebieStatus = (key: string): boolean => {
    const mapStr = localStorage.getItem(FREEBIE_MAP_KEY);
    if (!mapStr) return false;
    const map = JSON.parse(mapStr);
    return !!map[key];
  };

  const isLimitReached = payment.questionCount >= payment.dailyLimit;
  const remainingCount = Math.max(0, payment.dailyLimit - payment.questionCount);

  const handleStartPay = async () => {
    setIsLoading(true);
    // 纯前端模拟演示
    setTimeout(() => {
        setIsLoading(false);
        setIsRedirecting(true);
        setCurrentOrder({ orderId: 'DEMO_' + Date.now(), payUrl: '', status: 'pending' });
        setTimeout(() => { handlePaymentSuccess(); }, 1500);
    }, 800);
  };

  const handlePaymentSuccess = () => {
    setPayment(prev => ({ ...prev, isPaid: true }));
    setCurrentOrder(prev => prev ? { ...prev, status: 'paid' } : null);
    setTimeout(() => {
      setShowPayModal(false);
      setCurrentOrder(null);
      setIsRedirecting(false);
    }, 1500);
  };

  const handleFormSubmit = async (input: UserInput) => {
    if (isLimitReached) return;
    setIsLoading(true);
    setError(null);
    setChatMessages([]);
    setBaziChart(null); 
    setLifeDestiny(null);
    
    const baziKey = `${input.year}-${input.month}-${input.day}-${input.hour}-${input.minute}-${input.gender}`;
    setCurrentBaziKey(baziKey);
    const hasUsedBefore = checkFreebieStatus(baziKey);
    setFreebieUsed(hasUsedBefore);

    try {
      const chart = calculateBazi(input.year, input.month, input.day, input.hour, input.minute, input.gender, input.birthPlace);
      setBaziChart(chart);

      const kLineData = generateLocalLifeKLine(chart);
      setLifeDestiny(kLineData);
      
      const stream = baziChatService.startAnalysisStream(chart);
      setChatMessages([{ role: 'model', text: '' }]);
      
      let accumulatedText = '';
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setChatMessages([{ role: 'model', text: accumulatedText }]);
      }

      if (accumulatedText.length > 100) {
        updateUsageRecord(payment.questionCount + 1);
      } else if (accumulatedText.length === 0) {
        throw new Error("AI 响应异常，请重试。本次推演未消耗额度。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生了未知错误');
      setBaziChart(null);
      setLifeDestiny(null);
      setChatMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (msg: string) => {
    if (isLimitReached) return;
    
    const userMessagesInSession = chatMessages.filter(m => m.role === 'user').length;
    const isFirstTimeAsking = userMessagesInSession === 0 && !freebieUsed;

    if (!payment.isPaid && !isFirstTimeAsking) {
      setShowPayModal(true);
      return;
    }
    
    if (!msg.trim()) return;

    const wasPaidAtStart = payment.isPaid;
    const wasFreebieAtStart = isFirstTimeAsking;

    const backupMessages = [...chatMessages];
    setChatMessages(prev => [...prev, { role: 'user', text: msg }, { role: 'model', text: '' }]);
    setIsLoading(true);
    setError(null);

    try {
      const stream = baziChatService.sendMessageStream(msg);
      let accumulatedText = '';

      for await (const chunk of stream) {
        accumulatedText += chunk;
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: accumulatedText };
          return updated;
        });
      }

      if (accumulatedText.length > 10) {
          if (wasPaidAtStart) {
            setPayment(prev => ({ ...prev, isPaid: false }));
          } else if (wasFreebieAtStart && currentBaziKey) {
            markFreebieAsUsed(currentBaziKey);
          }
          updateUsageRecord(payment.questionCount + 1);
      } else {
          throw new Error("天机感应不足，回复中断。请稍后再试。");
      }

    } catch (err) {
      console.error("Chat Error:", err);
      setError("网络波动导致推演中断。您的咨询额度或付费状态已为您保留，请点击发送重试。");
      setChatMessages(backupMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col w-full relative">
      <header className="bg-stone-900 text-stone-100 shadow-lg sticky top-0 z-50 pt-safe">
        <div className="py-4 px-4 max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-stone-900 font-bold border-2 border-stone-800">问</div>
            <h1 className="text-lg font-serif tracking-wide">神机妙算</h1>
          </div>
          <div className="text-[10px] md:text-xs text-stone-400 bg-stone-800 px-3 py-1 rounded-full">
            今日余量: {remainingCount}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full space-y-6">
        <div className="text-center space-y-3 font-serif text-stone-700 leading-relaxed w-full mx-auto py-6 px-6 bg-white/40 rounded-3xl border border-stone-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Quote size={80} />
          </div>
          <div className="w-8 h-8 bg-gold-50 rounded-full flex items-center justify-center border border-gold-100 text-gold-600 mx-auto mb-2">
            <Sparkles size={14} />
          </div>
          <div className="space-y-2">
            <p className="text-base md:text-lg font-bold text-stone-900 tracking-tight not-italic">
              这可能是你接触到的，最硬核的命运推理。
            </p>
            <p className="text-xs md:text-sm tracking-wide not-italic px-4">
              正如科学实验中的观测会改变物质的既定轨迹，您观测后的起心动念，或如蝴蝶效应般，影响整个人生。<br/>
              命运并非一成不变，而是因果的概率推演。<br/>
              照见因果，未来的种子虽深埋过去，但境随心转，事在人为。
            </p>
          </div>
          <div className="pt-3 border-t border-stone-200/60 w-3/4 mx-auto mt-3">
            <p className="text-[9px] md:text-[10px] text-stone-400 tracking-[0.2em] uppercase font-sans font-medium">
              本结果仅作为思维辅助工具，助您在不确定的世界中寻找确定性。
            </p>
          </div>
        </div>

        <InputForm onSubmit={handleFormSubmit} isLoading={isLoading} isLimitReached={isLimitReached} />
        
        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm animate-pulse">{error}</div>}
        
        {baziChart && (
          <div ref={resultRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
             <BaziChartDisplay chart={baziChart} />
             {lifeDestiny && (
                <LifeKLineChart 
                  data={lifeDestiny.chartPoints} 
                  meihuaInfo={lifeDestiny.meihua}
                />
             )}
          </div>
        )}
        
        {chatMessages.length > 0 && (
            <ChatInterface 
                messages={chatMessages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                paymentStatus={payment} 
                freebieUsed={freebieUsed} 
            />
        )}
      </main>

      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 animate-in slide-in-from-bottom md:zoom-in-95 duration-300">
            <div className="bg-stone-900 px-6 py-6 text-center text-white relative">
              <button onClick={() => { setShowPayModal(false); setCurrentOrder(null); setIsRedirecting(false); }} className="absolute top-4 right-4 text-stone-500 hover:text-white transition-colors">✕</button>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-[10px] text-gold-400/40 mb-2 uppercase tracking-tighter">
                   <Star size={10} className="fill-gold-400/40" /> 今日全网剩余推演名额: {remainingCount} <Star size={10} className="fill-gold-400/40" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-1">欢迎打赏</h3>
                <p className="text-stone-400 text-[10px] tracking-widest uppercase">Appreciate & Support</p>
              </div>
            </div>
            <div className="p-6">
              {!isRedirecting && currentOrder?.status !== 'paid' ? (
                <>
                  <div className="bg-stone-50/60 rounded-2xl p-6 border border-stone-100 mb-6 relative overflow-hidden">
                    {/* 背景装饰星星 - 调浅颜色以防干扰文字 */}
                    <div className="absolute -right-8 -top-8 text-gold-400/5"><Sparkles size={120} /></div>
                    <div className="flex flex-col items-center justify-center space-y-3 text-center relative z-10">
                        <p className="text-lg font-serif font-bold text-stone-600 tracking-[0.15em]">
                            一杯奶茶钱，趋吉避凶
                        </p>
                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-300/30 to-transparent"></div>
                        <p className="text-xl font-serif font-bold text-stone-900 tracking-[0.15em]">
                            一次九块九，问你想问
                        </p>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-6">
                    <button onClick={() => setPayMethod('alipay')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${payMethod === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-stone-100 bg-stone-50'}`}>
                      <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs italic">支</div>
                      <span className="text-xs font-bold text-stone-700">支付宝</span>
                    </button>
                    <button onClick={() => setPayMethod('wechat')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${payMethod === 'wechat' ? 'border-green-500 bg-green-50' : 'border-stone-100 bg-stone-50'}`}>
                      <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center text-white"><Wallet size={12} /></div>
                      <span className="text-xs font-bold text-stone-700">微信支付</span>
                    </button>
                  </div>
                  
                  <div className="text-center mb-6 relative">
                    <div className="absolute top-0 right-8 -mt-2 rotate-12">
                        <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">限时特惠</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-2">
                        <div className="text-sm text-stone-400 line-through decoration-stone-400 decoration-1">
                            原价 ¥99.00
                        </div>
                        <div className="text-4xl font-serif font-bold text-red-600">
                            <span className="text-xl font-sans mr-1">¥</span>9.90
                        </div>
                    </div>
                  </div>

                  <button onClick={handleStartPay} disabled={isLoading} className="w-full py-4 bg-stone-900 text-gold-400 font-bold rounded-2xl shadow-xl hover:shadow-gold-200/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                    {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <ExternalLink size={18} />}
                    {isLoading ? '正在处理请求...' : `确认支付 ¥9.90 并提问`}
                  </button>
                </>
              ) : (
                <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
                  {currentOrder?.status !== 'paid' ? (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mb-6 animate-pulse"><RefreshCw size={28} className="text-gold-600 animate-spin-slow" /></div>
                      <h4 className="text-lg font-bold text-stone-900 mb-2">正在处理支付...</h4>
                      <p className="text-xs text-stone-500 px-4 mb-8">
                        演示模式：系统正在自动确认您的订单
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8"><CheckCircle2 size={32} className="text-green-600 mb-4" /><h4 className="text-xl font-bold text-stone-900">推演授权成功</h4></div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-stone-50 p-6 border-t border-stone-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest"><ShieldCheck size={12} className="text-green-600" /> 逻辑推演 · 拒绝迷信</div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-stone-900 text-stone-500 text-center py-10 border-t border-stone-800 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <p className="text-[10px] opacity-60">© {new Date().getFullYear()} 神机妙算 | 科学推演 · 拒绝迷信</p>
      </footer>
    </div>
  );
};

export default App;
