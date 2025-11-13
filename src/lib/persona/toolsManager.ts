import { collections } from '@/database/nebuladb';

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
 * Tool usage document structure for Nebula DB
 */
export interface ToolUsageDocument {
  _id?: string;
  session_id: number;
  tool_name: string;
  success: boolean;
  latency_ms: number;
  parameters?: string;
  created_at: string;
}

/**
 * Tools manager that tracks tool usage patterns and performance
 */
export class ToolsManager {
  /**
   * Record a tool usage event
   */
  static async recordUsage(sessionId: number, usage: ToolUsageResult): Promise<ToolUsageDocument | null> {
    try {
      const toolUsage: ToolUsageDocument = {
        _id: `tool_usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: sessionId,
        tool_name: usage.toolName,
        success: usage.success,
        latency_ms: usage.latencyMs,
        parameters: usage.parameters,
        created_at: new Date().toISOString()
      };

      const result = await collections.tool_usages.insert(toolUsage);
      return result;
    } catch (error) {
      console.error('Error recording tool usage:', error);
      return null;
    }
  }

  /**
   * Get tool usage statistics for a session
   */
  static async getSessionToolUsage(sessionId: number): Promise<ToolUsageDocument[]> {
    try {
      // In Nebula DB, we'd use a query to find documents by session_id
      // For now, we'll need to implement a basic filtering approach
      // This would be more efficient with proper querying capabilities
      const allUsages = await this.getAllToolUsages();
      return allUsages.filter(usage => usage.session_id === sessionId)
                     .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error getting session tool usage:', error);
      return [];
    }
  }

  /**
   * Get tool usage statistics across all sessions
   */
  static async getToolUsageStats(limit: number = 100): Promise<ToolUsageDocument[]> {
    try {
      const allUsages = await this.getAllToolUsages();
      return allUsages
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
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
      const allUsages = await this.getAllToolUsages();
      const toolUsages = allUsages.filter(usage => usage.tool_name === toolName);

      if (toolUsages.length === 0) {
        return { successRate: 0, totalUses: 0 };
      }

      const successful = toolUsages.filter(u => u.success).length;
      const successRate = successful / toolUsages.length;

      return { successRate, totalUses: toolUsages.length };
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
      const allUsages = await this.getAllToolUsages();
      const toolUsages = allUsages.filter(usage => usage.tool_name === toolName);

      if (toolUsages.length === 0) {
        return { averageLatency: 0, totalUses: 0 };
      }

      const totalLatency = toolUsages.reduce((sum, u) => sum + u.latency_ms, 0);
      const averageLatency = totalLatency / toolUsages.length;

      return { averageLatency, totalUses: toolUsages.length };
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
      const allUsages = await this.getAllToolUsages();
      const toolCounts: Record<string, number> = {};

      allUsages.forEach(usage => {
        toolCounts[usage.tool_name] = (toolCounts[usage.tool_name] || 0) + 1;
      });

      return Object.entries(toolCounts)
        .map(([toolName, usageCount]) => ({ toolName, usageCount }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting most used tools:', error);
      return [];
    }
  }

  /**
   * Helper method to get all tool usages (would be replaced with proper querying)
   */
  private static async getAllToolUsages(): Promise<ToolUsageDocument[]> {
    try {
      // This is a simplified approach - in a real Nebula DB implementation,
      // we'd use proper querying methods
      // For now, we'll simulate getting all documents
      // Note: This approach may not scale well for large datasets
      return []; // Placeholder - actual implementation would query the collection
    } catch (error) {
      console.error('Error getting all tool usages:', error);
      return [];
    }
  }
}
