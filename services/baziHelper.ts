
import { Solar, Lunar } from 'lunar-javascript';
import { BaziChart, BaziPillar, Gender, DaYun, KLinePoint, LifeDestinyResult } from '../types';

// --- Five Elements Mapping & Logic ---

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const WUXING_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '寅': '木', '卯': '木',
  '丙': '火', '丁': '火', '巳': '火', '午': '火',
  '戊': '土', '己': '土', '辰': '土', '戌': '土', '丑': '土', '未': '土',
  '庚': '金', '辛': '金', '申': '金', '酉': '金',
  '壬': '水', '癸': '水', '亥': '水', '子': '水'
};

const WUXING_RELATIONSHIP = {
  '木': { generate: '火', control: '土', weaken: '水', damage: '金' },
  '火': { generate: '土', control: '金', weaken: '木', damage: '水' },
  '土': { generate: '金', control: '水', weaken: '火', damage: '木' },
  '金': { generate: '水', control: '木', weaken: '土', damage: '火' },
  '水': { generate: '木', control: '火', weaken: '金', damage: '土' }
};

// Meihua Yishu Constants
const ZHI_NUM: Record<string, number> = {
  '子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
  '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
};

const GUA_NAME_MAP: Record<number, string> = {
  1: '乾', 2: '兑', 3: '离', 4: '震', 5: '巽', 6: '坎', 7: '艮', 8: '坤', 0: '坤'
};

const GUA_WUXING: Record<number, string> = {
  1: '金', // Qian 乾
  2: '金', // Dui 兑
  3: '火', // Li 离
  4: '木', // Zhen 震
  5: '木', // Xun 巽
  6: '水', // Kan 坎
  7: '土', // Gen 艮
  0: '土', // Kun 坤 (Modulo 8 gives 0)
  8: '土'  // Fallback
};

export const getCurrentTime = (): Date => {
  return new Date();
};

export const calculateBazi = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  gender: Gender,
  birthPlace?: string
): BaziChart => {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(2); 

  const yun = eightChar.getYun(gender === Gender.MALE ? 1 : 0);
  const daYunArr = yun.getDaYun();
  const daYunList: DaYun[] = [];

  // 获取正式起运的虚岁
  const firstRealStartAge = daYunArr.length > 0 ? daYunArr[0].getStartAge() : 10;

  // 1. 如果正式起运年龄大于 1 岁，首个格子强制显示为“童限”
  if (firstRealStartAge > 1) {
    daYunList.push({
      ganZhi: '童限',
      startAge: 1,
      startYear: solar.getYear(),
      endYear: solar.getYear() + (firstRealStartAge - 2)
    });
  }

  // 2. 填充后续正式大运
  for (let i = 0; i < daYunArr.length && i < 10; i++) {
    const dy = daYunArr[i];
    const gz = dy.getGanZhi();
    // 判定逻辑：如果干支为空且为第一步大运，则仍视为童限；否则显示干支。
    const label = (gz && gz.trim() !== "") ? gz : (dy.getStartAge() <= 1 ? '童限' : '正式大运');
    
    daYunList.push({
      ganZhi: label,
      startAge: dy.getStartAge(),
      startYear: dy.getStartYear(),
      endYear: dy.getEndYear()
    });
  }

  const createPillar = (gan: string, zhi: string, ganShen: string, hiddenGan: string[], zhiShen: string[], naYin: string): BaziPillar => ({
    gan: gan || '?', zhi: zhi || '?', ganShen: ganShen || '-', zhiShen: zhiShen.length ? zhiShen : ['-'], hiddenGan: hiddenGan.length ? hiddenGan : ['-'], naYin: naYin || '-'
  });

  const now = getCurrentTime();
  const currentLunar = Lunar.fromDate(now);

  return {
    year: createPillar(eightChar.getYearGan(), eightChar.getYearZhi(), eightChar.getYearShiShenGan(), eightChar.getYearHideGan(), eightChar.getYearShiShenZhi(), eightChar.getYearNaYin()),
    month: createPillar(eightChar.getMonthGan(), eightChar.getMonthZhi(), eightChar.getMonthShiShenGan(), eightChar.getMonthHideGan(), eightChar.getMonthShiShenZhi(), eightChar.getMonthNaYin()),
    day: createPillar(eightChar.getDayGan(), eightChar.getDayZhi(), "日主", eightChar.getDayHideGan(), eightChar.getDayShiShenZhi(), eightChar.getDayNaYin()),
    hour: createPillar(eightChar.getTimeGan(), eightChar.getTimeZhi(), eightChar.getTimeShiShenGan(), eightChar.getTimeHideGan(), eightChar.getTimeShiShenZhi(), eightChar.getTimeNaYin()),
    dayun: daYunList,
    currentLiuNian: { year: currentLunar.getYear(), ganZhi: currentLunar.getYearInGanZhi() },
    solarDate: solar.toFullString(),
    lunarDate: lunar.toString(),
    gender,
    birthPlace,
    birthYear: year
  };
};

export const formatBaziForPrompt = (chart: BaziChart): string => {
  const formatPillar = (p: BaziPillar) => {
    const hidden = p.hiddenGan.map((g, i) => `${g}[${p.zhiShen[i]}]`).join(' ');
    return `${p.ganShen} ${p.gan}${p.zhi} [${p.naYin}] (藏: ${hidden})`;
  };
  const dayunString = chart.dayun.map(dy => `${dy.startAge}岁起运: ${dy.ganZhi}`).join('\n    ');
  return `性别: ${chart.gender}\n阳历: ${chart.solarDate}\n八字: 年[${formatPillar(chart.year)}] 月[${formatPillar(chart.month)}] 日[${formatPillar(chart.day)}] 时[${formatPillar(chart.hour)}]\n大运列表:\n${dayunString}`;
};

export const generateLocalLifeKLine = (chart: BaziChart): LifeDestinyResult => {
    const startYear = chart.birthYear;
    const dayMasterElement = WUXING_MAP[chart.day.gan] || '木';
    const monthBranchElement = WUXING_MAP[chart.month.zhi] || '木';
    
    const rel = WUXING_RELATIONSHIP[dayMasterElement as keyof typeof WUXING_RELATIONSHIP];
    let isDmStrong = false;
    if (dayMasterElement === monthBranchElement || rel.weaken === monthBranchElement) {
        isDmStrong = true;
    }

    const favoredElements = new Set<string>();
    const avoidElements = new Set<string>();
    
    if (isDmStrong) {
        favoredElements.add(rel.generate); favoredElements.add(rel.control); favoredElements.add(rel.damage);   
        avoidElements.add(rel.weaken); avoidElements.add(dayMasterElement); 
    } else {
        favoredElements.add(dayMasterElement); favoredElements.add(rel.weaken);       
        avoidElements.add(rel.generate); avoidElements.add(rel.control); avoidElements.add(rel.damage);         
    }

    // 梅花卦逻辑
    const now = new Date();
    const currentLunar = Lunar.fromDate(now);
    const yearNum = ZHI_NUM[currentLunar.getYearZhi()] || 1;
    const monthNum = currentLunar.getMonth(); 
    const dayNum = currentLunar.getDay();     
    const hourNum = ZHI_NUM[currentLunar.getTimeZhi()] || 1;
    const minuteNum = now.getMinutes();       
    let upperGuaNum = (yearNum + monthNum + dayNum) % 8 || 8;
    let lowerGuaNum = (yearNum + monthNum + dayNum + hourNum + minuteNum) % 8 || 8;
    let movingLine = (yearNum + monthNum + dayNum + hourNum + minuteNum) % 6 || 6;
    let tiGua = movingLine <= 3 ? upperGuaNum : lowerGuaNum;
    let yongGua = movingLine <= 3 ? lowerGuaNum : upperGuaNum;
    const tiElement = GUA_WUXING[tiGua];
    const yongElement = GUA_WUXING[yongGua];
    let divinationOffset = 0;
    const tiRelObj = WUXING_RELATIONSHIP[tiElement as keyof typeof WUXING_RELATIONSHIP];
    const yongRelObj = WUXING_RELATIONSHIP[yongElement as keyof typeof WUXING_RELATIONSHIP];
    let meihuaLuckLevel = "平";
    if (tiElement === yongElement) { divinationOffset = 2; meihuaLuckLevel = "小吉"; }
    else if (yongRelObj.generate === tiElement) { divinationOffset = 15; meihuaLuckLevel = "大吉"; }
    else if (tiRelObj.control === yongElement) { divinationOffset = 5; meihuaLuckLevel = "中吉"; }
    else if (tiRelObj.generate === yongElement) { divinationOffset = -5; meihuaLuckLevel = "小凶"; }
    else if (yongRelObj.control === tiElement) { divinationOffset = -12; meihuaLuckLevel = "大凶"; }
    const meihuaInfo = { guaName: `${GUA_NAME_MAP[upperGuaNum]}${GUA_NAME_MAP[lowerGuaNum]}卦`, upperElement: GUA_NAME_MAP[upperGuaNum], lowerElement: GUA_NAME_MAP[lowerGuaNum], relationDesc: "", scoreImpact: Math.round(divinationOffset), luckLevel: meihuaLuckLevel };

    const points: KLinePoint[] = [];
    let prevClose = 60 + divinationOffset * 0.5; 
    const simulationVolatility = 0.8 + Math.random() * 0.6; 

    for (let i = 0; i < 100; i++) {
        const age = i + 1;
        const currentYear = startYear + i;
        const lunarYear = Lunar.fromYmd(currentYear, 6, 1);
        const yearGanZhi = lunarYear.getYearInGanZhi();

        // --- 核心判定：确保大运标签正确 ---
        let daYunLabel = "童限";
        let scoreGan = chart.month.gan;
        let scoreZhi = chart.month.zhi;

        if (chart.dayun && chart.dayun.length > 0) {
            let matched = null;
            for (const dy of chart.dayun) {
                if (age >= dy.startAge) matched = dy;
                else break;
            }
            if (matched) {
                daYunLabel = matched.ganZhi;
                // 评分时需检查：如果是正式大运（2个字符），则更新评分用的干支
                if (daYunLabel !== "童限" && daYunLabel.length >= 2) {
                    scoreGan = daYunLabel.charAt(0);
                    scoreZhi = daYunLabel.charAt(1);
                } else {
                    // 如果标签虽然匹配上了但还是“童限”，保持用月柱评分
                    scoreGan = chart.month.gan;
                    scoreZhi = chart.month.zhi;
                }
            }
        }

        // 最终强制：如果标签中包含“大运”字样且在起运初期，回正为“童限”
        if (daYunLabel === "大运" || daYunLabel === "正式大运") {
            daYunLabel = "童限";
        }

        // 评分逻辑
        let daYunScore = 60;
        const dyGanEl = WUXING_MAP[scoreGan];
        const dyZhiEl = WUXING_MAP[scoreZhi];
        let favCount = (dyGanEl && favoredElements.has(dyGanEl) ? 1 : 0) + (dyZhiEl && favoredElements.has(dyZhiEl) ? 1.5 : 0);
        daYunScore = favCount >= 2 ? 75 : favCount >= 1 ? 65 : (dyZhiEl && avoidElements.has(dyZhiEl) ? 45 : 55);

        const ynGanEl = WUXING_MAP[yearGanZhi.charAt(0)];
        const ynZhiEl = WUXING_MAP[yearGanZhi.charAt(1)];
        let lnScore = favoredElements.has(ynGanEl) && favoredElements.has(ynZhiEl) ? 75 : favoredElements.has(ynZhiEl) ? 60 : 45;

        let targetScore = (daYunScore * 0.5) + (lnScore * 0.3) + 12 + divinationOffset;
        targetScore += (Math.random() - 0.5) * 15 * simulationVolatility;
        const close = Math.round(Math.max(15, Math.min(98, (prevClose * 0.3 + targetScore * 0.7))));
        
        let open = prevClose + (Math.random() - 0.5) * 6 * simulationVolatility;
        const high = Math.min(100, Math.max(open, close) + Math.random() * 5);
        const low = Math.max(0, Math.min(open, close) - Math.random() * 5);

        points.push({
            age, year: currentYear, ganZhi: yearGanZhi,
            daYun: daYunLabel,
            open: Math.round(open), close, high: Math.round(high), low: Math.round(low), score: close
        });
        prevClose = close;
    }

    return { chartPoints: points, meihua: meihuaInfo };
};
