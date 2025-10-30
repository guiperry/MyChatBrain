import { db } from '@/db';
import type { ToolUsages } from '@/db/schema';

/**
 * Tool usage result
 */
export interface ToolUsageResult {
  toolName: string;
  success: boolean;
  latencyMs: number;
  parameters?: string;
}

/**
 * Tools manager that tracks tool usage patterns and performance
 */
export class ToolsManager {
  /**
   * Record a tool usage event
   */
  static async recordUsage(sessionId: number, usage: ToolUsageResult): Promise<ToolUsages | null> {
    try {
      const insertResult = db.run(
        'INSERT INTO tool_usages (session_id, tool_name, success, latency_ms, parameters) VALUES (?, ?, ?, ?, ?)',
        [sessionId, usage.toolName, usage.success, usage.latencyMs, usage.parameters]
      );

      const inserted = db.get(
        'SELECT * FROM tool_usages WHERE id = ?',
        [insertResult.lastInsertRowid]
      ) as ToolUsages;

      return inserted || null;
    } catch (error) {
      console.error('Error recording tool usage:', error);
      return null;
    }
  }

  /**
   * Get tool usage statistics for a session
   */
  static async getSessionToolUsage(sessionId: number): Promise<ToolUsages[]> {
    try {
      const usages = db.all(
        'SELECT * FROM tool_usages WHERE session_id = ? ORDER BY created_at DESC',
        [sessionId]
      ) as ToolUsages[];
      return usages;
    } catch (error) {
      console.error('Error getting session tool usage:', error);
      return [];
    }
  }

  /**
   * Get tool usage statistics across all sessions
   */
  static async getToolUsageStats(limit: number = 100): Promise<ToolUsages[]> {
    try {
      const usages = db.all(
        'SELECT * FROM tool_usages ORDER BY created_at DESC LIMIT ?',
        [limit]
      ) as ToolUsages[];
      return usages;
    } catch (error) {
      console.error('Error getting tool usage stats:', error);
      return [];
    }
  }

  /**
   * Get success rate for a specific tool
   */
  static async getToolSuccessRate(toolName: string): Promise<{ successRate: number; totalUses: number }> {
    try {
      const usages = db.all(
        'SELECT success FROM tool_usages WHERE tool_name = ?',
        [toolName]
      ) as { success: boolean }[];

      if (usages.length === 0) {
        return { successRate: 0, totalUses: 0 };
      }

      const successful = usages.filter(u => u.success).length;
      const successRate = successful / usages.length;

      return { successRate, totalUses: usages.length };
    } catch (error) {
      console.error('Error getting tool success rate:', error);
      return { successRate: 0, totalUses: 0 };
    }
  }

  /**
   * Get average latency for a specific tool
   */
  static async getToolAverageLatency(toolName: string): Promise<{ averageLatency: number; totalUses: number }> {
    try {
      const usages = db.all(
        'SELECT latency_ms FROM tool_usages WHERE tool_name = ?',
        [toolName]
      ) as { latency_ms: number }[];

      if (usages.length === 0) {
        return { averageLatency: 0, totalUses: 0 };
      }

      const totalLatency = usages.reduce((sum, u) => sum + u.latency_ms, 0);
      const averageLatency = totalLatency / usages.length;

      return { averageLatency, totalUses: usages.length };
    } catch (error) {
      console.error('Error getting tool average latency:', error);
      return { averageLatency: 0, totalUses: 0 };
    }
  }

  /**
   * Get most used tools
   */
  static async getMostUsedTools(limit: number = 10): Promise<{ toolName: string; usageCount: number }[]> {
    try {
      const results = db.all(
        'SELECT tool_name, COUNT(*) as usage_count FROM tool_usages GROUP BY tool_name ORDER BY usage_count DESC LIMIT ?',
        [limit]
      ) as { tool_name: string; usage_count: number }[];

      return results.map(r => ({ toolName: r.tool_name, usageCount: r.usage_count }));
    } catch (error) {
      console.error('Error getting most used tools:', error);
      return [];
    }
  }
}
