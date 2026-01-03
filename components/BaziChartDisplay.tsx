
import React from 'react';
import { BaziChart, BaziPillar, DaYun } from '../types';

interface BaziChartDisplayProps {
  chart: BaziChart;
}

const PillarCard: React.FC<{ title: string; pillar: BaziPillar; isMain?: boolean }> = ({ title, pillar, isMain }) => (
  <div className={`flex flex-col items-center bg-stone-50 border border-stone-200 rounded-lg md:rounded-xl p-1 md:p-3 shadow-sm h-full relative overflow-hidden min-w-0 ${isMain ? 'ring-1 md:ring-2 ring-gold-400/50 bg-orange-50/30' : ''}`}>
    <span className="text-[10px] md:text-xs text-stone-400 mb-0.5 md:mb-1 font-serif tracking-widest uppercase scale-90 md:scale-100 origin-center">{title}</span>
    
    <div className="h-3 md:h-5 w-full flex items-center justify-center mb-0.5 md:mb-1">
      <span className="text-[9px] md:text-xs text-stone-600 font-medium px-1 rounded-sm bg-stone-100/50 truncate max-w-full scale-90 md:scale-100 origin-center">
        {pillar.ganShen || '-'}
      </span>
    </div>
    
    <div className="flex flex-col items-center justify-center gap-0 md:gap-1 mb-1 md:mb-1 bg-white rounded md:rounded-lg w-full py-1 md:py-2 border border-stone-100 shadow-sm flex-grow-0">
      <span className={`text-lg md:text-3xl font-bold font-serif leading-none ${isMain ? 'text-gold-600' : 'text-stone-800'}`}>
        {pillar.gan}
      </span>
      <span className="text-lg md:text-3xl font-bold text-stone-800 font-serif leading-none mt-0.5">
        {pillar.zhi}
      </span>
    </div>

    <div className="w-full text-center mb-1">
      <span className="text-[9px] text-stone-400 block scale-90 origin-center font-serif">
        {pillar.naYin}
      </span>
    </div>

    <div className="flex flex-col gap-0 w-full mt-auto bg-stone-100/50 rounded p-0.5 md:p-1 justify-start">
      {pillar.hiddenGan.map((gan, index) => (
        <div key={index} className="flex justify-between items-center text-[9px] leading-tight px-0.5 h-[12px] md:h-auto">
          <span className="font-serif text-stone-700 font-bold">{gan}</span>
          <span className="text-stone-400 scale-90 origin-right whitespace-nowrap overflow-hidden text-ellipsis max-w-[3em] text-right">
            {pillar.zhiShen[index]}
          </span>
        </div>
      ))}
      {Array.from({ length: 3 - pillar.hiddenGan.length }).map((_, i) => (
        <div key={`empty-${i}`} className="h-[12px] md:h-[13px] w-full"></div>
      ))}
    </div>
  </div>
);

const DaYunCard: React.FC<{ dayun: DaYun }> = ({ dayun }) => {
  const text = dayun.ganZhi;
  const isTongXian = text === '童限';
  // 字号自适应：如果是正式大运(2字)用大号，童限(2字)用中号
  const fontSizeClass = text.length > 2 ? 'text-[10px] md:text-xs' : isTongXian ? 'text-sm md:text-base' : 'text-sm md:text-lg';

  return (
    <div className="flex flex-col items-center bg-white border border-stone-100 rounded-lg p-1.5 shadow-sm w-full min-w-0 transition-transform hover:scale-[1.02]">
      <span className="text-[9px] md:text-[10px] text-stone-300 mb-0.5 whitespace-nowrap font-sans">{dayun.startAge}岁</span>
      
      <div className="min-h-[2.2em] md:min-h-[2em] flex items-center justify-center w-full overflow-hidden px-0.5">
        <span className={`${fontSizeClass} font-bold ${isTongXian ? 'text-stone-500' : 'text-stone-800'} font-serif text-center leading-tight`}>
          {text}
        </span>
      </div>
      
      <span className="text-[8px] md:text-[9px] text-stone-200 mt-0.5 font-sans whitespace-nowrap">{dayun.startYear}</span>
    </div>
  );
};

const BaziChartDisplay: React.FC<BaziChartDisplayProps> = ({ chart }) => {
  return (
    <div className="bg-white p-3 md:p-6 rounded-2xl shadow-xl border border-mystic-200 mb-4 md:mb-8 mx-auto w-full max-w-full overflow-hidden box-border">
      <div className="flex flex-wrap justify-between items-center mb-3 md:mb-4 border-b border-mystic-100 pb-2 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base md:text-xl font-serif font-bold text-stone-900">八字乾坤</h3>
          <span className="text-[10px] md:text-xs text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
            {chart.gender === '男' ? '乾造' : '坤造'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 justify-end items-center">
          <span className="text-[10px] md:text-xs px-1.5 py-0.5 bg-stone-50 border border-stone-100 rounded text-stone-600">
            {chart.lunarDate}
          </span>
          <span className="text-[10px] md:text-xs px-1.5 py-0.5 bg-gold-50 border border-gold-100 rounded text-gold-700 font-serif font-bold">
            流年: {chart.currentLiuNian.year} {chart.currentLiuNian.ganZhi}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 md:gap-4 pb-3 md:pb-6">
        <PillarCard title="年柱" pillar={chart.year} />
        <PillarCard title="月柱" pillar={chart.month} />
        <PillarCard title="日柱" pillar={chart.day} isMain={true} />
        <PillarCard title="时柱" pillar={chart.hour} />
      </div>

      <div className="border-t border-mystic-100 pt-3 md:pt-4">
        <h4 className="text-xs md:text-sm font-bold text-stone-700 mb-2 md:mb-3 font-serif flex items-center gap-2">
          <span className="w-1 h-3 md:h-4 bg-gold-500 rounded-full"></span>
          大运排盘
        </h4>
        <div className="grid grid-cols-4 md:flex md:overflow-x-auto gap-2 md:gap-2 pb-1 scrollbar-hide">
          {chart.dayun.map((yun, idx) => (
            <DaYunCard key={idx} dayun={yun} />
          ))}
        </div>
      </div>
      
      <div className="mt-2 md:mt-4 text-center border-t border-dashed border-stone-100 pt-2">
        <p className="text-[10px] text-stone-400">
          * 日元：{chart.day.gan} | 命理分析基于盲派技法与五行生克
        </p>
      </div>
    </div>
  );
};

export default BaziChartDisplay;
