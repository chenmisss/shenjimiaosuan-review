
export enum Gender {
  MALE = '男',
  FEMALE = '女',
}

export interface BaziPillar {
  gan: string;
  zhi: string;
  ganShen: string;
  zhiShen: string[];
  hiddenGan: string[];
  naYin: string;
}

export interface DaYun {
  ganZhi: string;
  startAge: number;
  startYear: number;
  endYear: number;
}

export interface BaziChart {
  year: BaziPillar;
  month: BaziPillar;
  day: BaziPillar;
  hour: BaziPillar;
  dayun: DaYun[];
  currentLiuNian: {
    year: number;
    ganZhi: string;
  };
  solarDate: string;
  lunarDate: string;
  gender: Gender;
  birthPlace?: string;
  birthYear: number;
}

export interface UserInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
  birthPlace?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface PaymentStatus {
  isPaid: boolean;
  questionCount: number;
  dailyLimit: number;
}

export interface OrderInfo {
  orderId: string;
  payUrl: string; // 二维码地址或跳转链接
  status: 'pending' | 'paid' | 'expired';
}

export interface KLinePoint {
  age: number;
  year: number;
  ganZhi: string;
  daYun: string;
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
}

export interface MeihuaInfo {
  guaName: string;
  upperElement: string;
  lowerElement: string;
  relationDesc: string;
  scoreImpact: number;
  luckLevel: string;
}

export interface LifeScores {
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  family: number;
  summary: number;
}

export interface LifeDestinyResult {
  chartPoints: KLinePoint[];
  meihua?: MeihuaInfo;
}
