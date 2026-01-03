
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { KLinePoint, MeihuaInfo } from '../types';
import { ZoomIn, ZoomOut, Maximize, Compass } from 'lucide-react';

interface LifeKLineChartProps {
  data: KLinePoint[];
  meihuaInfo?: MeihuaInfo;
}

const DEFAULT_CANDLE_WIDTH = 20; 
const MIN_CANDLE_WIDTH = 4;      
const MAX_CANDLE_WIDTH = 80;     

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as KLinePoint;
    const isUp = data.close >= data.open;
    const diff = data.close - data.open;
    
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-stone-200 z-50 w-[180px] md:w-[220px] pointer-events-none transition-all duration-200">
        <div className="flex justify-between items-start mb-2 border-b border-stone-200/50 pb-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm md:text-base font-bold text-stone-900 font-serif truncate">
              {data.year} {data.ganZhi} <span className="text-[10px] text-stone-500 font-sans font-normal">({data.age}岁)</span>
            </p>
            <p className="text-[10px] text-gold-700 font-medium mt-0.5 font-sans truncate">
              阶段：{data.daYun || '童限'}
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0 ml-2">
             <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded mb-0.5 ${isUp ? 'bg-red-100/80 text-red-800' : 'bg-green-100/80 text-green-800'}`}>
               {isUp ? '吉' : '凶'}
             </div>
             <span className={`text-[10px] font-mono font-bold ${isUp ? 'text-red-700' : 'text-green-700'}`}>
                {diff > 0 ? '+' : ''}{diff}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-600 bg-white/40 p-1.5 rounded border border-white/30">
          <div className="flex justify-between px-1"><span className="opacity-70 scale-90 origin-left">开</span><span className="font-mono font-bold">{data.open}</span></div>
          <div className="flex justify-between px-1"><span className="opacity-70 scale-90 origin-left">收</span><span className="font-mono font-bold">{data.close}</span></div>
          <div className="flex justify-between px-1"><span className="opacity-70 scale-90 origin-left">高</span><span className="font-mono font-bold">{data.high}</span></div>
          <div className="flex justify-between px-1"><span className="opacity-70 scale-90 origin-left">低</span><span className="font-mono font-bold">{data.low}</span></div>
        </div>
      </div>
    );
  }
  return null;
};

const CandleShape = (props: any) => {
  const { x, y, width, height, payload, yAxis } = props;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#ef4444' : '#22c55e'; 
  const strokeColor = isUp ? '#dc2626' : '#16a34a';

  let yHigh = y;
  let yLow = y + height;
  if (yAxis && typeof yAxis.scale === 'function') {
      yHigh = yAxis.scale(high);
      yLow = yAxis.scale(low);
  }
  const center = x + width / 2;
  const isThin = width < 8;

  return (
    <g>
      <line x1={center} y1={yHigh} x2={center} y2={yLow} stroke={strokeColor} strokeWidth={isThin ? 1 : 1.5} />
      <rect x={x} y={y} width={width} height={Math.max(1, height)} fill={color} stroke={strokeColor} strokeWidth={isThin ? 0 : 0.5} />
    </g>
  );
};

const MeihuaDashboard: React.FC<{ info: MeihuaInfo }> = ({ info }) => {
    const isGood = info.scoreImpact >= 0;
    return (
        <div className="w-full mb-3 bg-stone-900 text-stone-100 rounded-lg p-3 flex items-center justify-between shadow-lg border-t border-white/10 overflow-hidden shrink-0">
             <div className="flex items-center gap-3 min-w-0">
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-stone-800 rounded-full flex items-center justify-center border border-gold-500/50 text-gold-400 shrink-0">
                    <Compass size={18} />
                 </div>
                 <div className="flex flex-col min-w-0">
                     <span className="text-[10px] text-stone-400 uppercase tracking-widest truncate">梅花时空卦</span>
                     <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm md:text-base font-bold font-serif text-white truncate">{info.guaName}</span>
                     </div>
                 </div>
             </div>
             <div className="flex flex-col items-end shrink-0 ml-2">
                 <div className={`text-xs font-bold ${isGood ? 'text-gold-400' : 'text-stone-400'}`}>
                     {info.luckLevel}
                 </div>
                 <div className="flex items-center gap-1 mt-0.5">
                     <span className={`text-xs font-mono font-bold ${isGood ? 'text-gold-400' : 'text-stone-400'}`}>
                         {info.scoreImpact > 0 ? '+' : ''}{info.scoreImpact}
                     </span>
                 </div>
             </div>
        </div>
    );
};

const LifeKLineChart: React.FC<LifeKLineChartProps> = ({ data, meihuaInfo }) => {
  const [candleWidth, setCandleWidth] = useState(DEFAULT_CANDLE_WIDTH);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const lastTouchDistanceRef = useRef<number | null>(null);

  const processedData = useMemo(() => {
    if (!data) return [];
    return data.map(d => ({ ...d, candleRange: [Math.min(d.open, d.close), Math.max(d.open, d.close)] }));
  }, [data]);

  // 计算纵轴自适应范围
  const yDomain = useMemo(() => {
    if (!data || data.length === 0) return [0, 100];
    const allLows = data.map(d => d.low);
    const allHighs = data.map(d => d.high);
    const minVal = Math.min(...allLows);
    const maxVal = Math.max(...allHighs);
    const range = maxVal - minVal;
    // 增加 10% 的上下缓冲空间，且限制在 0-100 之间
    return [
      Math.max(0, Math.floor(minVal - range * 0.1)),
      Math.min(100, Math.ceil(maxVal + range * 0.1))
    ];
  }, [data]);

  const daYunChanges = data.filter((d, i) => i === 0 || d.daYun !== data[i - 1].daYun);
  const totalChartWidth = Math.max(data.length * candleWidth, 100);

  const handleZoomIn = () => setCandleWidth(prev => Math.min(MAX_CANDLE_WIDTH, prev + 5));
  const handleZoomOut = () => setCandleWidth(prev => Math.max(MIN_CANDLE_WIDTH, prev - 5));
  const handleFitScreen = () => {
    if (scrollContainerRef.current) {
      const fitWidth = (scrollContainerRef.current.clientWidth - 50) / data.length;
      setCandleWidth(Math.max(MIN_CANDLE_WIDTH, fitWidth));
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDistanceRef.current = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
        e.preventDefault();
        const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        const delta = dist - lastTouchDistanceRef.current;
        if (Math.abs(delta) > 2) {
          setCandleWidth(prev => Math.max(MIN_CANDLE_WIDTH, Math.min(MAX_CANDLE_WIDTH, prev + (delta > 0 ? 1 : -1) * (prev * 0.05))));
          lastTouchDistanceRef.current = dist;
        }
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', () => { lastTouchDistanceRef.current = null; });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    startXRef.current = e.pageX;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - (e.pageX - startXRef.current) * 1.5;
  };

  const CHART_HEIGHT = 340;

  return (
    <div className="w-full max-w-full bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden flex flex-col box-border">
      <div className="px-3 md:px-6 py-6 w-full overflow-hidden flex flex-col min-h-0">
        {meihuaInfo && <MeihuaDashboard info={meihuaInfo} />}

        <div className="mb-4 space-y-2 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h3 className="text-sm md:text-lg font-bold text-stone-800 font-serif flex items-center gap-2 truncate">
              <span className="w-1.5 h-4 bg-stone-900 rounded-full shrink-0"></span>
              人生K线走势
            </h3>
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button onClick={handleZoomOut} className="p-1.5 hover:bg-white rounded-md text-stone-600 transition shadow-sm"><ZoomOut size={12} /></button>
                <button onClick={handleFitScreen} className="p-1.5 hover:bg-white rounded-md text-stone-600 transition shadow-sm"><Maximize size={12} /></button>
                <button onClick={handleZoomIn} className="p-1.5 hover:bg-white rounded-md text-stone-600 transition shadow-sm"><ZoomIn size={12} /></button>
              </div>
            </div>
          </div>
          <p className="text-[10px] md:text-xs text-stone-500 font-serif leading-relaxed italic pl-3.5 opacity-80 border-l-2 border-stone-100">
            该走势融合了八字命理与当前的梅花易数综合测算。起心动念，时空流转，每时每刻之推演皆不完全相似，数值与走势仅供逻辑参考。
          </p>
        </div>

        <div className="flex w-full border border-stone-100 rounded-xl overflow-hidden relative select-none bg-stone-50/20 shadow-inner box-border">
          <div className="flex-shrink-0 bg-white z-20 border-r border-stone-100" style={{ width: '40px', height: CHART_HEIGHT }}>
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={processedData} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
                  <YAxis dataKey="close" tick={{fontSize: 8, fill: '#78716c'}} width={40} axisLine={false} tickLine={false} domain={yDomain} />
               </ComposedChart>
             </ResponsiveContainer>
          </div>

          <div 
            ref={scrollContainerRef}
            className={`flex-1 overflow-x-auto relative hide-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} min-w-0`}
            style={{ height: CHART_HEIGHT, touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
            onMouseDown={handleMouseDown}
            onMouseLeave={() => setIsDragging(false)}
            onMouseUp={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
          >
            <div style={{ width: totalChartWidth, height: '100%', pointerEvents: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={processedData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <YAxis dataKey="close" domain={yDomain} hide />
                  <XAxis 
                    dataKey="age" 
                    tick={{fontSize: 8, fill: '#a8a29e'}} 
                    interval="preserveStart" 
                    minTickGap={45} 
                    axisLine={{ stroke: '#e7e5e4' }} 
                    tickLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d6d3d1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  {daYunChanges.map((point) => (
                    <ReferenceLine key={`dayun-${point.year}`} x={point.age} stroke="#e7e5e4" strokeDasharray="2 2">
                       <Label value={point.daYun} position="insideTop" fill="#d97706" fontSize={8} fontWeight="bold" offset={10} 
                              content={(props: any) => candleWidth >= 12 ? <text x={props.x} y={props.y + 10} fill="#d97706" fontSize={9} fontWeight="bold" textAnchor="middle">{props.value}</text> : null} />
                    </ReferenceLine>
                  ))}
                  <Bar dataKey="candleRange" shape={<CandleShape />} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex justify-center text-[9px] text-stone-400 font-sans tracking-tight">
          <span className="italic opacity-70">支持双指缩放及平滑拖动查看流年详批</span>
        </div>
      </div>
    </div>
  );
};

export default LifeKLineChart;
