import { collections } from '@/database/nebuladb';
import { SentimentAnalyzer } from './sentimentAnalyzer';
import { InterestProfiler } from './interestProfiler';
import { GoalTracker } from './goalTracker';
import { PersonalityModeler } from './personalityModeler';
import { ErrorMonitor } from './errorMonitor';
import { ToolsManager } from './toolsManager';
import { IdeaNotetaker } from './ideaNotetaker';

/**
 * Persona snapshot containing all metrics for a user
 */
export interface PersonaSnapshot {
  userId: number;
  sentiment?: {
    polarity: number;
    score: number;
    modelVersion: string;
    averagePolarity?: number;
    averageScore?: number;
    totalSamples?: number;
    updatedAt?: string;
  };
  interests?: Array<{
    topic: string;
    weight: number;
    lastUpdated?: string;
  }>;
  goals?: Array<{
    description: string;
    status: 'active' | 'completed' | 'cancelled';
    confidence: number;
    updatedAt?: string;
  }>;
  personality?: Array<{
    trait: string;
    percentile: number;
    evidenceCount?: number;
    updatedAt?: string;
  }>;
  recentErrors?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
  }>;
  toolUsage?: Array<{
    toolName: string;
    success: boolean;
    latencyMs: number;
  }>;
  ideas?: Array<{
    title: string;
    status: 'draft' | 'refined' | 'implemented';
    updatedAt?: string;
    createdAt?: string;
    tags?: string[];
  }>;
  lastUpdated: string;
}

/**
 * Persona orchestrator that coordinates all persona analyzers
 */
export class PersonaOrchestrator {
  /**
   * Initialize persona tracking for a user
   */
  static async initializeUser(userId: number): Promise<boolean> {
    try {
      // TODO: Add persona_users table to RxDB schema
      // For now, persona initialization is skipped
      console.log(`Persona initialization for user ${userId} - tables not yet migrated to RxDB`);
      return true;
    } catch (error) {
      console.error('Error initializing user persona:', error);
      return false;
    }
  }

  /**
   * Start a new persona session
   */
  static async startSession(userId: number, channel: string = 'web', context?: string): Promise<number | null> {
    try {
      // TODO: Add persona_sessions table to RxDB schema
      console.log(`Persona session start for user ${userId} - tables not yet migrated to RxDB`);
      return Date.now(); // Return a temporary session ID
    } catch (error) {
      console.error('Error starting persona session:', error);
      return null;
    }
  }

  /**
   * Record a message in a persona session
   */
  static async recordMessage(
    sessionId: number,
    messageId: number | null,
    role: 'user' | 'assistant',
    text: string
  ): Promise<number | null> {
    try {
      // TODO: Add persona_messages table to RxDB schema
      console.log(`Recording persona message for session ${sessionId} - tables not yet migrated to RxDB`);
      return Date.now(); // Return a temporary message ID
    } catch (error) {
      console.error('Error recording persona message:', error);
      return null;
    }
  }

  /**
   * Process a message through all persona analyzers
   */
  static async processMessage(sessionId: number, userId: number, text: string): Promise<void> {
    try {
      // Record the message
      const messageId = await this.recordMessage(sessionId, null, 'user', text);
      if (!messageId) return;

      // Run all analyzers in parallel
      const promises = [
        // Sentiment analysis
        SentimentAnalyzer.analyzeAndStore(messageId, text),

        // Interest profiling
        InterestProfiler.updateInterests(userId, text),

        // Goal tracking
        GoalTracker.updateGoals(userId, text),

        // Personality modeling
        PersonalityModeler.updateTraits(userId, text),

        // Idea notetaking
        IdeaNotetaker.processTextForIdeas(userId, text)
      ];

      await Promise.all(promises);

      console.log(`Processed message for user ${userId} in session ${sessionId}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    } catch (error) {
      console.error('Error processing message for persona:', error);
    }
  }

  /**
   * Record tool usage
   */
  static async recordToolUsage(
    sessionId: number,
    toolName: string,
    success: boolean,
    latencyMs: number,
    parameters?: string
  ): Promise<void> {
    try {
      await ToolsManager.recordUsage(sessionId, {
        toolName,
        success,
        latencyMs,
        parameters
      });
    } catch (error) {
      console.error('Error recording tool usage:', error);
    }
  }

  /**
   * Record an error event
   */
  static async recordError(sessionId: number, errorType: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: string): Promise<void> {
    try {
      const errors = ErrorMonitor.analyze(details || errorType);
      if (errors.length > 0) {
        await ErrorMonitor.recordError(sessionId, errors[0]);
      }
    } catch (error) {
      console.error('Error recording error event:', error);
    }
  }

  /**
   * Get complete persona snapshot for a user
   */
  static async getPersonaSnapshot(userId: number): Promise<PersonaSnapshot> {
    try {
      const [
        interests,
        goals,
        personality,
        recentErrors,
        toolUsage,
        ideas,
        sentiment
      ] = await Promise.all([
        InterestProfiler.getTopInterests(userId, 5),
        GoalTracker.getActiveGoals(userId),
        PersonalityModeler.getDominantTraits(userId, 5),
        this.getRecentErrors(userId, 5),
        this.getRecentToolUsage(userId, 5),
        IdeaNotetaker.getUserIdeas(userId),
        this.getSentimentSummary(userId)
      ]);

      return {
        userId,
        sentiment: sentiment
          ? {
              polarity: sentiment.polarity,
              score: sentiment.score,
              modelVersion: sentiment.modelVersion,
              averagePolarity: sentiment.averagePolarity,
              averageScore: sentiment.averageScore,
              totalSamples: sentiment.totalSamples,
              updatedAt: sentiment.updatedAt
            }
          : undefined,
        interests: interests.map(i => ({
          topic: i.topic,
          weight: i.weight,
          lastUpdated: i.last_updated
        })),
        goals: goals.map(g => ({
          description: g.description,
          status: g.status,
          confidence: g.confidence,
          updatedAt: g.updated_at
        })),
        personality: personality.map(p => ({
          trait: p.trait_label,
          percentile: p.percentile,
          evidenceCount: p.evidence_count,
          updatedAt: p.last_updated
        })),
        recentErrors: recentErrors.map(e => ({
          type: e.type,
          severity: e.severity,
          created_at: e.created_at
        })),
        toolUsage: toolUsage.map(t => ({
          toolName: t.tool_name,
          success: t.success,
          latencyMs: t.latency_ms
        })),
        ideas: ideas.slice(0, 5).map(i => ({
          title: i.title,
          status: i.status,
          updatedAt: i.updated_at,
          createdAt: i.created_at,
          tags: Array.isArray(i.tags) ? i.tags : undefined
        })),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting persona snapshot:', error);
      return {
        userId,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private static async getSentimentSummary(userId: number): Promise<{
    polarity: number;
    score: number;
    modelVersion: string;
    updatedAt?: string;
    averagePolarity?: number;
    averageScore?: number;
    totalSamples?: number;
  } | null> {
    try {
      const sentiments = await (collections.sentiment_metrics as any).find({ user_id: userId }).toArray();

      if (sentiments.length === 0) {
        return null;
      }

      const totalPolarity = sentiments.reduce((sum: number, s: any) => sum + s.polarity, 0);
      const totalScore = sentiments.reduce((sum: number, s: any) => sum + s.score, 0);
      const latest = sentiments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      return {
        polarity: latest.polarity,
        score: latest.score,
        modelVersion: latest.model_version,
        updatedAt: latest.created_at,
        averagePolarity: totalPolarity / sentiments.length,
        averageScore: totalScore / sentiments.length,
        totalSamples: sentiments.length
      };
    } catch (error) {
      console.error('Error getting sentiment summary:', error);
      return null;
    }
  }

  /**
   * Get recent errors for a user
   */
  private static async getRecentErrors(userId: number, limit: number = 5): Promise<any[]> {
    try {
      const errors = await (collections.error_events as any).find({ user_id: userId }).toArray();

      return errors
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
        .map((error: any) => ({
          type: error.type,
          severity: error.severity,
          created_at: error.created_at
        }));
    } catch (error) {
      console.error('Error getting recent errors:', error);
      return [];
    }
  }

  /**
   * Get recent tool usage for a user
   */
  private static async getRecentToolUsage(userId: number, limit: number = 5): Promise<any[]> {
    try {
      const usages = await (collections.tool_usages as any).find({ user_id: userId }).toArray();

      return usages
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
        .map((usage: any) => ({
          tool_name: usage.tool_name,
          success: usage.success,
          latency_ms: usage.latency_ms
        }));
    } catch (error) {
      console.error('Error getting recent tool usage:', error);
      return [];
    }
  }

  /**
   * End a persona session
   */
  static async endSession(sessionId: number): Promise<void> {
    try {
      // Could add session end logic here if needed
      console.log(`Ended persona session ${sessionId}`);
    } catch (error) {
      console.error('Error ending persona session:', error);
    }
  }

  /**
   * Get persona analytics summary
   */
  static async getAnalyticsSummary(userId: number): Promise<any> {
    try {
      const [
        interestStats,
        goalStats,
        personalityStats,
        errorStats,
        toolStats,
        ideaStats
      ] = await Promise.all([
        this.getInterestStats(userId),
        this.getGoalStats(userId),
        this.getPersonalityStats(userId),
        this.getErrorStats(userId),
        this.getToolStats(userId),
        IdeaNotetaker.getIdeaStats(userId)
      ]);

      return {
        userId,
        interests: interestStats,
        goals: goalStats,
        personality: personalityStats,
        errors: errorStats,
        tools: toolStats,
        ideas: ideaStats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return { userId, error: 'Failed to generate analytics' };
    }
  }

  private static async getInterestStats(userId: number) {
    const interests = await InterestProfiler.getCurrentInterests(userId);
    return {
      totalTopics: interests.length,
      topInterests: interests.slice(0, 3).map(i => i.topic),
      averageWeight: interests.length > 0
        ? interests.reduce((sum, i) => sum + i.weight, 0) / interests.length
        : 0
    };
  }

  private static async getGoalStats(userId: number) {
    const goals = await GoalTracker.getAllGoals(userId);
    return {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      averageConfidence: goals.length > 0
        ? goals.reduce((sum, g) => sum + g.confidence, 0) / goals.length
        : 0
    };
  }

  private static async getPersonalityStats(userId: number) {
    const traits = await PersonalityModeler.getTraits(userId);
    return {
      totalTraits: traits.length,
      dominantTraits: traits.slice(0, 3).map(t => ({
        trait: t.trait_label,
        percentile: t.percentile
      }))
    };
  }

  private static async getErrorStats(userId: number) {
    const errors = await this.getRecentErrors(userId, 100);
    return {
      totalErrors: errors.length,
      criticalErrors: errors.filter(e => e.severity === 'critical').length,
      resolvedErrors: errors.filter(e => e.resolution_state === 'resolved').length
    };
  }

  private static async getToolStats(userId: number) {
    const usage = await this.getRecentToolUsage(userId, 100);
    const successful = usage.filter(u => u.success).length;
    return {
      totalUses: usage.length,
      successRate: usage.length > 0 ? successful / usage.length : 0,
      averageLatency: usage.length > 0
        ? usage.reduce((sum, u) => sum + u.latency_ms, 0) / usage.length
        : 0
    };
  }
}

