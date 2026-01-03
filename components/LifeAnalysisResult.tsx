
import React from 'react';
import { LifeScores } from '../types';
import { Briefcase, Coins, Heart, Activity, Users, ScrollText, Star } from 'lucide-react';

interface LifeAnalysisResultProps {
  scores: LifeScores;
  summaryText: string;
}

const ScoreBar = ({ score, colorClass }: { score: number, colorClass: string }) => {
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-1000 ease-out`} 
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className="text-xs font-bold text-stone-600 w-8 text-right font-serif">
        {score}
      </span>
    </div>
  );
};

const AnalysisCard = ({ title, icon: Icon, score, colorClass, textColor }: any) => (
  <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
    <div className="absolute top-0 right-0 p-1 opacity-10">
        <Icon className="w-12 h-12" />
    </div>
    <div className="flex items-center gap-1.5 mb-1 relative z-10">
      <Icon className={`w-4 h-4 ${textColor}`} />
      <h3 className="font-serif font-bold text-sm text-stone-800">{title}</h3>
    </div>
    <div className="relative z-10">
      <ScoreBar score={score} colorClass={colorClass} />
    </div>
  </div>
);

const LifeAnalysisResult: React.FC<LifeAnalysisResultProps> = ({ scores, summaryText }) => {
  return (
    <div className="w-full space-y-4 animate-fade-in-up">
      {/* Summary Section */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-gold-200/50 shadow-md relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1 h-full bg-gold-400"></div>
         <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-gold-600" />
                命理综合评断
            </h3>
            <div className="flex items-center gap-2 bg-stone-50 px-3 py-1 rounded-full border border-stone-100">
                <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                <span className="text-xs font-bold text-stone-600">总评分: {scores.summary}</span>
            </div>
         </div>
         <p className="text-sm text-stone-700 leading-relaxed text-justify whitespace-pre-wrap">
            {summaryText}
         </p>
      </div>

      {/* 5-Dim Scores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
        <AnalysisCard 
          title="事业成就" 
          icon={Briefcase} 
          score={scores.career}
          colorClass="bg-blue-500" 
          textColor="text-blue-600"
        />
        <AnalysisCard 
          title="财富积累" 
          icon={Coins} 
          score={scores.wealth}
          colorClass="bg-amber-500" 
          textColor="text-amber-600"
        />
        <AnalysisCard 
          title="婚姻情感" 
          icon={Heart} 
          score={scores.marriage}
          colorClass="bg-pink-500" 
          textColor="text-pink-600"
        />
        <AnalysisCard 
          title="身体健康" 
          icon={Activity} 
          score={scores.health}
          colorClass="bg-emerald-500" 
          textColor="text-emerald-600"
        />
        <AnalysisCard 
          title="六亲缘分" 
          icon={Users} 
          score={scores.family}
          colorClass="bg-purple-500" 
          textColor="text-purple-600"
        />
      </div>
    </div>
  );
};

export default LifeAnalysisResult;
