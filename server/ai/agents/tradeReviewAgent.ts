import { agentRunner } from '../services/agentRunner.js';
import { TradeRecord } from '../../../src/types/index.js';

export interface PostTradeReviewOutput {
  tradeId: string;
  asset: string;
  pnlNet: number;
  thesisAccuracy: 'CORRECT' | 'PARTIALLY_CORRECT' | 'FAILED';
  whatWorked: string[];
  whatFailed: string[];
  agentErrors: string[];
  lessonProposal: string;
  summaryAr: string;
}

export class TradeReviewAgent {
  public static readonly ID = 'trade-review';
  public static readonly NAME = 'Post-Trade Review Agent';
  public static readonly NAME_AR = 'وكيل مراجعة الصفقات اللاحقة';
  public static readonly PROMPT_VERSION = 'review-v1.0';

  public async reviewTrade(trade: TradeRecord): Promise<PostTradeReviewOutput> {
    const isWin = trade.netPnL > 0;
    const accuracy = isWin ? 'CORRECT' : 'FAILED';

    const whatWorked = isWin 
      ? ['التزام صارم بنقطة الدخول ومستويات وقف الخسارة المحددة', 'دقة إشارات التحليل الفني وكسر هيكل السوق']
      : ['تطبيق وقف الخسارة الصارم حد من تفاقم الخسائر وحمى رأس المال'];

    const whatFailed = isWin
      ? []
      : [`انعكاس السعر بفعل سيولة مضادة مما أدى لتفعيل ${trade.exitReason}`];

    const agentErrors = isWin 
      ? [] 
      : ['قد يكون هناك مبالغة في تقدير سرعة الزخم دون انتظار تأكيد إعادة الاختبار'];

    const lessonProposal = isWin
      ? 'الحفاظ على نفس معايير نسبة العائد إلى المخاطرة (R:R >= 1.5) وتجنب الإغلاق المبكر.'
      : 'انتظار شمعة تأكيد إضافية على الإطار الزمني 1H قبل إرسال أمر الشراء لتقليل الانزلاق.';

    const summaryAr = isWin
      ? `الصفقة أغلقت بربح قدره $${trade.netPnL.toFixed(2)} (${trade.netPnLPercent.toFixed(2)}%) بنجاح.`
      : `الصفقة أغلقت عند مستوى ${trade.exitReason} بخسارة منضبطة قدرها $${Math.abs(trade.netPnL).toFixed(2)} ضمن الحدود المسموحة.`;

    return {
      tradeId: trade.id,
      asset: trade.asset,
      pnlNet: trade.netPnL,
      thesisAccuracy: accuracy,
      whatWorked,
      whatFailed,
      agentErrors,
      lessonProposal,
      summaryAr
    };
  }
}

export const tradeReviewAgent = new TradeReviewAgent();
