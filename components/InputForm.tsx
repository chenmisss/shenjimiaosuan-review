
import React, { useState, useEffect, useMemo } from 'react';
import { Gender, UserInput } from '../types';
import { ShieldCheck } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
  isLimitReached?: boolean; // 新增：是否达到每日限额
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, isLimitReached = false }) => {
  const [year, setYear] = useState<number | ''>(1990);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [birthPlace, setBirthPlace] = useState('');

  const maxDays = useMemo(() => {
    if (!year) return 31;
    return new Date(Number(year), month, 0).getDate();
  }, [year, month]);

  useEffect(() => {
    if (day > maxDays) {
      setDay(maxDays);
    }
  }, [maxDays, day]);

  const isYearValid = useMemo(() => {
    const yStr = String(year);
    return yStr.length === 4 && Number(yStr) >= 1900 && Number(yStr) <= 2100;
  }, [year]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isLimitReached || !isYearValid) return;
    onSubmit({ year: Number(year), month, day, hour, minute, gender, birthPlace });
  };

  const inputClass = "w-full px-3 py-3 md:py-2 rounded-lg border border-mystic-300 focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none transition text-base appearance-none bg-white text-stone-900 placeholder-gray-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-5 md:p-8 rounded-2xl shadow-xl border border-mystic-200 w-full max-w-full">
      <div className="text-center mb-4 md:mb-8">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-mystic-900">请输入生辰信息</h2>
        <p className="text-mystic-600 text-xs md:text-sm mt-1">公历 (阳历) 时间</p>
        
        <div className="flex items-center justify-center gap-1.5 mt-3 bg-stone-50 py-1.5 px-3 rounded-lg border border-stone-100 inline-flex mx-auto">
           <ShieldCheck size={12} className="text-green-600" />
           <span className="text-[10px] text-stone-500 font-medium">无需注册 · 无数据留存 · 隐私绝对安全</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs md:text-sm font-medium text-mystic-700">出生年份</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="new-password"
              spellCheck="false"
              maxLength={4}
              value={year}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setYear(val === '' ? '' : Number(val));
              }}
              className={`${inputClass} ${!isYearValid && year !== '' ? 'border-red-400 ring-1 ring-red-100' : ''}`}
              placeholder="1990"
              required
              disabled={isLimitReached}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs md:text-sm font-medium text-mystic-700">出生月份</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={inputClass}
              disabled={isLimitReached}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs md:text-sm font-medium text-mystic-700">出生日期</label>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className={inputClass}
              disabled={isLimitReached}
            >
              {Array.from({ length: maxDays }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}日</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs md:text-sm font-medium text-mystic-700">时间</label>
            <div className="flex gap-1">
              <select
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                className={`${inputClass} px-1`}
                disabled={isLimitReached}
              >
                {Array.from({ length: 24 }, (_, i) => i).map(h => (
                  <option key={h} value={h}>{h}时</option>
                ))}
              </select>
              <select
                value={minute}
                onChange={(e) => setMinute(Number(e.target.value))}
                className={`${inputClass} px-1`}
                disabled={isLimitReached}
              >
                <option value={0}>00分</option>
                <option value={15}>15分</option>
                <option value={30}>30分</option>
                <option value={45}>45分</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <label className="block text-xs md:text-sm font-medium text-mystic-700">出生地点 (选填)</label>
        <input
          type="text"
          autoComplete="off"
          value={birthPlace}
          onChange={(e) => setBirthPlace(e.target.value)}
          className={inputClass}
          placeholder="例如：北京朝阳区"
          disabled={isLimitReached}
        />
      </div>

      <div className="space-y-2 pt-2">
        <label className="block text-xs md:text-sm font-medium text-mystic-700">性别</label>
        <div className="flex gap-4">
          <label className={`flex items-center space-x-2 p-2 rounded-lg transition border border-transparent ${isLimitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-mystic-50 hover:border-mystic-200'}`}>
            <input
              type="radio"
              checked={gender === Gender.MALE}
              onChange={() => !isLimitReached && setGender(Gender.MALE)}
              className="w-5 h-5 text-gold-600 focus:ring-gold-500 bg-white border-gray-300"
              disabled={isLimitReached}
            />
            <span className="text-stone-700">男 (乾造)</span>
          </label>
          <label className={`flex items-center space-x-2 p-2 rounded-lg transition border border-transparent ${isLimitReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-mystic-50 hover:border-mystic-200'}`}>
            <input
              type="radio"
              checked={gender === Gender.FEMALE}
              onChange={() => !isLimitReached && setGender(Gender.FEMALE)}
              className="w-5 h-5 text-gold-600 focus:ring-gold-500 bg-white border-gray-300"
              disabled={isLimitReached}
            />
            <span className="text-stone-700">女 (坤造)</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || isLimitReached || !isYearValid}
        className={`w-full py-3.5 md:py-3 px-4 rounded-lg text-white font-bold text-lg shadow-md transition-all duration-300 mt-2 ${
          isLoading || !isYearValid || isLimitReached
            ? 'bg-stone-300 cursor-not-allowed opacity-80'
            : 'bg-gradient-to-r from-stone-700 to-stone-900 hover:from-stone-800 hover:to-black hover:shadow-lg transform active:scale-95'
        } ${isLimitReached ? 'bg-red-200 text-red-700 border border-red-300' : ''}`}
      >
        {isLimitReached 
          ? '本日推演已达上限' 
          : isLoading 
            ? '正在分析...' 
            : isYearValid 
              ? '排盘并分析' 
              : '请输入完整年份'}
      </button>
    </form>
  );
};

export default InputForm;
