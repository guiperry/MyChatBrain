import { db } from '@/db';
import type { IdeaNodes } from '@/db/schema';

/**
 * Idea result
 */
export interface IdeaResult {
  title: string;
  content?: string;
  tags?: string[];
  status: 'draft' | 'refined' | 'implemented';
}

/**
 * Idea notetaker that captures and organizes user ideas
 */
export class IdeaNotetaker {
  // Idea-related keywords and patterns
  private static readonly IDEA_INDICATORS = [
    'idea', 'thought', 'concept', 'plan', 'project', 'brainstorm', 'invention',
    'innovation', 'creation', 'design', 'solution', 'approach', 'method',
    'strategy', 'vision', 'dream', 'imagine', 'could', 'maybe', 'perhaps',
    'what if', 'how about', 'consider', 'suggest', 'propose'
  ];

  private static readonly IMPLEMENTATION_INDICATORS = [
    'done', 'finished', 'completed', 'implemented', 'built', 'created',
    'developed', 'launched', 'released', 'deployed'
  ];

  /**
   * Analyze text for potential ideas
   */
  static analyze(text: string): IdeaResult[] {
    const lowerText = text.toLowerCase();
    const sentences = lowerText.split(/[.!?]+/).filter(s => s.trim().length > 0);

    const ideas: IdeaResult[] = [];

    for (const sentence of sentences) {
      // Check if sentence contains idea indicators
      const hasIdeaIndicator = this.IDEA_INDICATORS.some(indicator =>
        sentence.includes(indicator)
      );

      if (hasIdeaIndicator) {
        // Extract potential idea
        const ideaText = sentence.trim();

        // Generate a title from the first part of the idea
        const words = ideaText.split(' ');
        const title = words.length > 10
          ? words.slice(0, 8).join(' ') + '...'
          : ideaText;

        // Extract potential tags
        const tags = this.extractTags(ideaText);

        ideas.push({
          title,
          content: ideaText,
          tags,
          status: 'draft'
        });
      }
    }

    return ideas;
  }

  /**
   * Extract tags from idea text
   */
  private static extractTags(text: string): string[] {
    const commonTags = [
      'technology', 'business', 'health', 'education', 'entertainment',
      'travel', 'food', 'science', 'art', 'music', 'sports', 'finance',
      'productivity', 'creativity', 'innovation', 'automation', 'ai',
      'web', 'mobile', 'design', 'marketing', 'sales', 'management'
    ];

    const lowerText = text.toLowerCase();
    return commonTags.filter(tag => lowerText.includes(tag));
  }

  /**
   * Save an idea for a user
   */
  static async saveIdea(userId: number, idea: IdeaResult): Promise<IdeaNodes | null> {
    try {
      const tagsJson = idea.tags ? JSON.stringify(idea.tags) : null;

      const insertResult = db.run(
        'INSERT INTO idea_nodes (user_id, title, content, tags, status) VALUES (?, ?, ?, ?, ?)',
        [userId, idea.title, idea.content, tagsJson, idea.status]
      );

      const inserted = db.get(
        'SELECT * FROM idea_nodes WHERE id = ?',
        [insertResult.lastInsertRowid]
      ) as IdeaNodes;

      return inserted || null;
    } catch (error) {
      console.error('Error saving idea:', error);
      return null;
    }
  }

  /**
   * Update idea status
   */
  static async updateIdeaStatus(ideaId: number, status: 'draft' | 'refined' | 'implemented'): Promise<boolean> {
    try {
      const result = db.run(
        'UPDATE idea_nodes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, ideaId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating idea status:', error);
      return false;
    }
  }

  /**
   * Get ideas for a user
   */
  static async getUserIdeas(userId: number, status?: 'draft' | 'refined' | 'implemented'): Promise<IdeaNodes[]> {
    try {
      let query = 'SELECT * FROM idea_nodes WHERE user_id = ?';
      const params: any[] = [userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY updated_at DESC';

      const ideas = db.all(query, params) as IdeaNodes[];

      // Parse tags JSON
      return ideas.map(idea => ({
        ...idea,
        tags: idea.tags ? JSON.parse(idea.tags) : undefined
      }));
    } catch (error) {
      console.error('Error getting user ideas:', error);
      return [];
    }
  }

  /**
   * Search ideas by tags or content
   */
  static async searchIdeas(userId: number, searchTerm: string): Promise<IdeaNodes[]> {
    try {
      const lowerSearch = searchTerm.toLowerCase();
      const ideas = await this.getUserIdeas(userId);

      return ideas.filter(idea => {
        const titleMatch = idea.title.toLowerCase().includes(lowerSearch);
        const contentMatch = idea.content?.toLowerCase().includes(lowerSearch);
        const tags = idea.tags ? (Array.isArray(idea.tags) ? idea.tags : JSON.parse(idea.tags)) : [];
        const tagMatch = tags.some((tag: string) => tag.toLowerCase().includes(lowerSearch));

        return titleMatch || contentMatch || tagMatch;
      });
    } catch (error) {
      console.error('Error searching ideas:', error);
      return [];
    }
  }

  /**
   * Get idea statistics for a user
   */
  static async getIdeaStats(userId: number): Promise<{
    total: number;
    draft: number;
    refined: number;
    implemented: number;
  }> {
    try {
      const allIdeas = await this.getUserIdeas(userId);

      return {
        total: allIdeas.length,
        draft: allIdeas.filter(i => i.status === 'draft').length,
        refined: allIdeas.filter(i => i.status === 'refined').length,
        implemented: allIdeas.filter(i => i.status === 'implemented').length
      };
    } catch (error) {
      console.error('Error getting idea stats:', error);
      return { total: 0, draft: 0, refined: 0, implemented: 0 };
    }
  }

  /**
   * Process text and automatically capture ideas
   */
  static async processTextForIdeas(userId: number, text: string): Promise<IdeaNodes[]> {
    try {
      const ideas = this.analyze(text);
      const savedIdeas: IdeaNodes[] = [];

      for (const idea of ideas) {
        const saved = await this.saveIdea(userId, idea);
        if (saved) {
          savedIdeas.push(saved);
        }
      }

      return savedIdeas;
    } catch (error) {
      console.error('Error processing text for ideas:', error);
      return [];
    }
  }
}
