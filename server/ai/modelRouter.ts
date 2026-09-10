import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { db } from '../db.js';

export type ModelProfile = 
  | 'STRONG_REASONING' 
  | 'FAST_ANALYSIS' 
  | 'LOW_COST' 
  | 'REVIEW' 
  | 'FALLBACK';

export interface ModelRouteResult {
  model: any;
  modelId: string;
  provider: string;
  profile: ModelProfile;
  isFallback: boolean;
}

export class ModelRouter {
  private googleProvider: any = null;

  constructor() {
    this.initProvider();
  }

  private initProvider() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
      this.googleProvider = createGoogleGenerativeAI({
        apiKey,
      });
    }
  }

  /**
   * Resolves the primary and fallback models based on agent profile or system settings.
   */
  public getModelForAgent(agentId: string, profile: ModelProfile = 'FAST_ANALYSIS'): ModelRouteResult {
    if (!this.googleProvider) {
      this.initProvider();
    }

    const database = db.getDB();
    const settings = database.settings;

    let targetModelId = 'gemini-2.5-flash';
    let provider = 'google';

    switch (profile) {
      case 'STRONG_REASONING':
        // Primary model for Supervisor and Risk assessment
        targetModelId = settings.models?.supervisorModel || 'gemini-2.5-flash';
        break;
      case 'FAST_ANALYSIS':
        // Primary model for Technical, Market Structure, Quant
        targetModelId = settings.models?.analyticalModel || 'gemini-2.5-flash';
        break;
      case 'LOW_COST':
        targetModelId = settings.models?.fastModel || 'gemini-2.5-flash';
        break;
      case 'REVIEW':
        targetModelId = 'gemini-2.5-flash';
        break;
      case 'FALLBACK':
      default:
        targetModelId = 'gemini-2.5-flash';
        break;
    }

    if (!this.googleProvider) {
      throw new Error('No AI provider credentials configured (missing GEMINI_API_KEY).');
    }

    try {
      const model = this.googleProvider(targetModelId);
      return {
        model,
        modelId: targetModelId,
        provider,
        profile,
        isFallback: false
      };
    } catch (err) {
      console.warn(`[ModelRouter] Failed to initialize ${targetModelId}, falling back to gemini-2.5-flash:`, err);
      const fallbackModel = this.googleProvider('gemini-2.5-flash');
      return {
        model: fallbackModel,
        modelId: 'gemini-2.5-flash',
        provider: 'google',
        profile: 'FALLBACK',
        isFallback: true
      };
    }
  }

  /**
   * Failover resolution if execution with primary model failed
   */
  public getFallbackModel(failedModelId: string): ModelRouteResult {
    if (!this.googleProvider) {
      this.initProvider();
    }
    const fallbackId = failedModelId === 'gemini-2.5-flash' ? 'gemini-1.5-flash' : 'gemini-2.5-flash';
    const model = this.googleProvider(fallbackId);
    return {
      model,
      modelId: fallbackId,
      provider: 'google',
      profile: 'FALLBACK',
      isFallback: true
    };
  }
}

export const modelRouter = new ModelRouter();
