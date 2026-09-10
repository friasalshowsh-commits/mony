import { generateText } from 'ai';
import { db } from '../../db.js';
import { realtimeBus } from '../../realtime.js';
import { modelRouter, ModelProfile } from '../modelRouter.js';
import { usageTracker } from './usageTracker.js';
import { AgentRunRecord, AgentStatus, AgentToolCallRecord } from '../../../src/types/index.js';

export interface RunAgentOptions<TOutput> {
  agentId: string;
  agentName: string;
  agentNameAr: string;
  symbol: string;
  analysisSessionId: string;
  parentRunId?: string;
  instructions: string;
  prompt: string;
  tools: Record<string, any>;
  profile?: ModelProfile;
  promptVersion?: string;
  timeoutMs?: number;
  outputParser: (text: string) => TOutput;
}

export class AgentRunner {
  public async executeAgent<TOutput>(options: RunAgentOptions<TOutput>): Promise<{
    success: boolean;
    output?: TOutput;
    runRecord: AgentRunRecord;
    error?: string;
  }> {
    const {
      agentId,
      agentName,
      agentNameAr,
      symbol,
      analysisSessionId,
      parentRunId,
      instructions,
      prompt,
      tools,
      profile = 'FAST_ANALYSIS',
      promptVersion = 'v1.0',
      timeoutMs = 25000,
      outputParser
    } = options;

    const runId = `RUN-${agentId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const startTime = Date.now();

    // Check budget
    const budgetCheck = usageTracker.checkBudgetAvailable();
    if (!budgetCheck.allowed) {
      const runRecord: AgentRunRecord = {
        id: runId,
        analysisSessionId,
        parentRunId,
        agentId,
        agentName,
        symbol,
        provider: 'none',
        model: 'blocked',
        actualModel: 'blocked',
        status: 'FAILED',
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        latencyMs: 0,
        inputSummary: prompt.slice(0, 150),
        errorCode: 'BUDGET_LIMIT',
        errorMessage: budgetCheck.reasonAr || budgetCheck.reason,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        promptVersion,
        toolsUsed: []
      };
      db.addAgentRun(runRecord);
      return { success: false, runRecord, error: budgetCheck.reasonAr };
    }

    // 1. Mark Agent RUNNING in Control Room & emit realtime event
    this.updateAgentStatus(agentId, 'ANALYZING', symbol, `تحليل الأصل ${symbol}`);
    realtimeBus.broadcast('AGENT_STARTED', {
      runId,
      agentId,
      agentName,
      agentNameAr,
      symbol,
      analysisSessionId,
      timestamp: new Date().toISOString()
    });

    const route = modelRouter.getModelForAgent(agentId, profile);
    const toolsUsed: AgentToolCallRecord[] = [];

    // Wrap tools to intercept usage and broadcast live tool calls
    const instrumentedTools: Record<string, any> = {};
    for (const [toolName, toolInstance] of Object.entries(tools)) {
      instrumentedTools[toolName] = {
        ...toolInstance,
        execute: async (args: any, context: any) => {
          const callStart = Date.now();
          this.updateAgentStatus(agentId, 'CALLING_TOOL', symbol, `استدعاء أداة: ${toolName}`);
          realtimeBus.broadcast('AGENT_TOOL_CALLED', {
            runId,
            agentId,
            toolName,
            symbol,
            args,
            timestamp: new Date().toISOString()
          });

          try {
            const result = await toolInstance.execute(args, context);
            const durationMs = Date.now() - callStart;
            toolsUsed.push({
              name: toolName,
              timestamp: new Date().toISOString(),
              input: args,
              outputSummary: typeof result === 'object' ? JSON.stringify(result).slice(0, 200) : String(result).slice(0, 200),
              durationMs
            });
            return result;
          } catch (err: any) {
            toolsUsed.push({
              name: toolName,
              timestamp: new Date().toISOString(),
              input: args,
              outputSummary: `ERROR: ${err.message}`,
              durationMs: Date.now() - callStart
            });
            throw err;
          }
        }
      };
    }

    let actualModelUsed = route.modelId;
    let actualProvider = route.provider;
    let resultText = '';
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      // Execute with timeout
      const executePromise = generateText({
        model: route.model,
        system: instructions,
        prompt,
        tools: instrumentedTools as any
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout exceeding ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([executePromise, timeoutPromise]);
      resultText = response.text || '';
      promptTokens = (response.usage as any)?.inputTokens ?? (response.usage as any)?.promptTokens ?? 600;
      completionTokens = (response.usage as any)?.outputTokens ?? (response.usage as any)?.completionTokens ?? 350;
    } catch (primaryErr: any) {
      console.warn(`[AgentRunner] Primary model ${actualModelUsed} failed for ${agentId}:`, primaryErr.message);

      // Attempt Failover with Fallback Model
      try {
        const fallback = modelRouter.getFallbackModel(actualModelUsed);
        actualModelUsed = fallback.modelId;
        actualProvider = fallback.provider;

        this.updateAgentStatus(agentId, 'ANALYZING', symbol, `محاولة بديلة عبر ${actualModelUsed}`);
        const fallbackResponse = await generateText({
          model: fallback.model,
          system: instructions,
          prompt,
          tools: instrumentedTools as any
        });

        resultText = fallbackResponse.text || '';
        promptTokens = (fallbackResponse.usage as any)?.inputTokens ?? (fallbackResponse.usage as any)?.promptTokens ?? 600;
        completionTokens = (fallbackResponse.usage as any)?.outputTokens ?? (fallbackResponse.usage as any)?.completionTokens ?? 350;
      } catch (fallbackErr: any) {
        // Both primary and fallback failed
        const latencyMs = Date.now() - startTime;
        this.updateAgentStatus(agentId, 'ERROR', symbol, `فشل التحليل: ${fallbackErr.message}`);
        
        const runRecord: AgentRunRecord = {
          id: runId,
          analysisSessionId,
          parentRunId,
          agentId,
          agentName,
          symbol,
          provider: actualProvider,
          model: route.modelId,
          actualModel: actualModelUsed,
          status: 'FAILED',
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          latencyMs,
          inputSummary: prompt.slice(0, 150),
          errorCode: fallbackErr.message?.includes('Timeout') ? 'TIMEOUT' : 'MODEL_ERROR',
          errorMessage: fallbackErr.message,
          inputTokens: promptTokens,
          outputTokens: completionTokens,
          totalTokens: promptTokens + completionTokens,
          estimatedCost: usageTracker.calculateCost(promptTokens, completionTokens),
          promptVersion,
          toolsUsed
        };

        db.addAgentRun(runRecord);
        realtimeBus.broadcast('AGENT_FAILED', {
          runId,
          agentId,
          symbol,
          error: fallbackErr.message,
          timestamp: new Date().toISOString()
        });

        return {
          success: false,
          runRecord,
          error: fallbackErr.message
        };
      }
    }

    const latencyMs = Date.now() - startTime;
    const totalTokens = promptTokens + completionTokens;
    const estimatedCost = usageTracker.calculateCost(promptTokens, completionTokens);

    // Parse structured output
    let parsedOutput: TOutput;
    try {
      parsedOutput = outputParser(resultText);
    } catch (parseErr: any) {
      console.error(`[AgentRunner] Output parsing error for ${agentId}:`, parseErr.message, resultText.slice(0, 300));
      const runRecord: AgentRunRecord = {
        id: runId,
        analysisSessionId,
        parentRunId,
        agentId,
        agentName,
        symbol,
        provider: actualProvider,
        model: route.modelId,
        actualModel: actualModelUsed,
        status: 'FAILED',
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        latencyMs,
        inputSummary: prompt.slice(0, 150),
        errorCode: 'SCHEMA_ERROR',
        errorMessage: `Failed to validate structured agent output: ${parseErr.message}`,
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        totalTokens,
        estimatedCost,
        promptVersion,
        toolsUsed
      };
      db.addAgentRun(runRecord);
      this.updateAgentStatus(agentId, 'ERROR', symbol, 'خطأ في معالجة النتائج الهيكلية');
      return { success: false, runRecord, error: parseErr.message };
    }

    // Success: save run record, record budget usage, update agent stats
    const runRecord: AgentRunRecord = {
      id: runId,
      analysisSessionId,
      parentRunId,
      agentId,
      agentName,
      symbol,
      provider: actualProvider,
      model: route.modelId,
      actualModel: actualModelUsed,
      status: 'COMPLETED',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      latencyMs,
      inputSummary: prompt.slice(0, 150),
      structuredOutput: parsedOutput,
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      totalTokens,
      estimatedCost,
      promptVersion,
      toolsUsed
    };

    db.addAgentRun(runRecord);
    usageTracker.recordUsage(runRecord);

    // Update agent in Control Room
    this.updateAgentStatus(
      agentId, 
      'COMPLETED', 
      symbol, 
      (parsedOutput as any).summaryAr || `تم إكمال التحليل بنجاح`,
      latencyMs,
      totalTokens,
      estimatedCost
    );

    realtimeBus.broadcast('AGENT_COMPLETED', {
      runId,
      agentId,
      agentName,
      symbol,
      latencyMs,
      model: actualModelUsed,
      toolsCount: toolsUsed.length,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      output: parsedOutput,
      runRecord
    };
  }

  private updateAgentStatus(
    agentId: string, 
    status: AgentStatus, 
    asset?: string, 
    task?: string,
    latencyMs?: number,
    tokens?: number,
    cost?: number
  ) {
    const database = db.getDB();
    const agent = database.agents.find(a => a.id === `agent-${agentId}` || a.id === agentId);
    if (agent) {
      agent.status = status;
      if (asset) agent.currentAsset = asset;
      if (task) agent.currentTask = task;
      agent.lastActive = new Date().toISOString();
      if (status === 'COMPLETED') {
        agent.tasksCompleted = (agent.tasksCompleted || 0) + 1;
        if (latencyMs) {
          agent.avgLatencyMs = Math.round(((agent.avgLatencyMs || 500) * 0.7) + (latencyMs * 0.3));
        }
        if (tokens) {
          agent.tokensUsed = (agent.tokensUsed || 0) + tokens;
        }
        if (cost) {
          agent.estimatedCostUsd = parseFloat(((agent.estimatedCostUsd || 0) + cost).toFixed(4));
        }
      } else if (status === 'ERROR') {
        agent.tasksFailed = (agent.tasksFailed || 0) + 1;
      }
      db.save();
    }
  }
}

export const agentRunner = new AgentRunner();
