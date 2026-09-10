import { AnalysisSession } from '../src/types/index.js';
import { analysisOrchestrator } from './ai/services/analysisOrchestrator.js';

export class MultiAgentOrchestrator {
  /**
   * Runs an end-to-end multi-agent analysis session on an asset using Vercel AI SDK & Model Router.
   */
  public async runAnalysisSession(asset: string, triggerEvent: string): Promise<AnalysisSession> {
    return await analysisOrchestrator.runSession(asset, triggerEvent);
  }
}

export const orchestrator = new MultiAgentOrchestrator();
