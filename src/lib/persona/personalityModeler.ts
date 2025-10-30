import { db } from '@/db';
import type { PersonalityTraits } from '@/db/schema';

/**
 * Personality trait result
 */
export interface PersonalityResult {
  trait: string;
  percentile: number; // 0-100
  evidenceCount: number;
}

/**
 * Personality modeler using simplified trait analysis
 * Based on basic linguistic patterns (simplified Big5/LIWC approach)
 */
export class PersonalityModeler {
  // Simplified trait indicators (based on common linguistic patterns)
  private static readonly TRAIT_PATTERNS = {
    'openness': {
      high: ['imagine', 'creative', 'artistic', 'curious', 'explore', 'learn', 'new', 'different', 'variety', 'diverse'],
      low: ['practical', 'conventional', 'traditional', 'routine', 'familiar']
    },
    'conscientiousness': {
      high: ['organized', 'responsible', 'reliable', 'disciplined', 'thorough', 'careful', 'plan', 'schedule'],
      low: ['careless', 'disorganized', 'impulsive', 'spontaneous', 'flexible']
    },
    'extraversion': {
      high: ['social', 'outgoing', 'talkative', 'energetic', 'enthusiastic', 'gregarious', 'active', 'lively'],
      low: ['quiet', 'reserved', 'shy', 'introverted', 'solitary', 'independent']
    },
    'agreeableness': {
      high: ['kind', 'helpful', 'cooperative', 'friendly', 'compassionate', 'generous', 'understanding', 'patient'],
      low: ['critical', 'harsh', 'competitive', 'selfish', 'rude', 'demanding']
    },
    'neuroticism': {
      high: ['worried', 'anxious', 'nervous', 'tense', 'stressed', 'emotional', 'sensitive', 'insecure'],
      low: ['calm', 'relaxed', 'stable', 'confident', 'secure', 'composed']
    }
  };

  /**
   * Analyze text for personality traits
   */
  static analyze(text: string): PersonalityResult[] {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    const traitScores: Record<string, { high: number; low: number; total: number }> = {};

    // Initialize trait scores
    for (const trait of Object.keys(this.TRAIT_PATTERNS)) {
      traitScores[trait] = { high: 0, low: 0, total: 0 };
    }

    // Count trait indicators
    for (const [trait, patterns] of Object.entries(this.TRAIT_PATTERNS)) {
      for (const word of words) {
        if (patterns.high.includes(word)) {
          traitScores[trait].high += 1;
          traitScores[trait].total += 1;
        }
        if (patterns.low.includes(word)) {
          traitScores[trait].low += 1;
          traitScores[trait].total += 1;
        }
      }
    }

    // Convert to percentiles
    const results: PersonalityResult[] = [];
    for (const [trait, scores] of Object.entries(traitScores)) {
      if (scores.total > 0) {
        // Calculate percentile based on high vs low indicators
        const percentile = scores.high > scores.low ?
          Math.min(100, 50 + (scores.high / scores.total) * 50) :
          Math.max(0, 50 - (scores.low / scores.total) * 50);

        results.push({
          trait,
          percentile: Math.round(percentile),
          evidenceCount: scores.total
        });
      }
    }

    return results;
  }

  /**
   * Update personality traits for a user
   */
  static async updateTraits(userId: number, text: string): Promise<PersonalityTraits[]> {
    try {
      const newTraits = this.analyze(text);
      const updatedTraits: PersonalityTraits[] = [];

      for (const trait of newTraits) {
        // Check if trait already exists
        const existing = db.get(
          'SELECT * FROM personality_traits WHERE user_id = ? AND trait_label = ?',
          [userId, trait.trait]
        ) as PersonalityTraits | undefined;

        if (existing) {
          // Update existing trait with weighted average
          const newEvidenceCount = existing.evidence_count + trait.evidenceCount;
          const blendedPercentile = Math.round(
            (existing.percentile * existing.evidence_count + trait.percentile * trait.evidenceCount) / newEvidenceCount
          );

          db.run(
            'UPDATE personality_traits SET percentile = ?, evidence_count = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
            [blendedPercentile, newEvidenceCount, existing.id]
          );

          updatedTraits.push({
            ...existing,
            percentile: blendedPercentile,
            evidence_count: newEvidenceCount,
            last_updated: new Date().toISOString()
          });
        } else {
          // Create new trait
          const insertResult = db.run(
            'INSERT INTO personality_traits (user_id, trait_label, percentile, evidence_count) VALUES (?, ?, ?, ?)',
            [userId, trait.trait, trait.percentile, trait.evidenceCount]
          );

          const inserted = db.get(
            'SELECT * FROM personality_traits WHERE id = ?',
            [insertResult.lastInsertRowid]
          ) as PersonalityTraits;

          if (inserted) {
            updatedTraits.push(inserted);
          }
        }
      }

      return updatedTraits;
    } catch (error) {
      console.error('Error updating personality traits:', error);
      return [];
    }
  }

  /**
   * Get personality traits for a user
   */
  static async getTraits(userId: number): Promise<PersonalityTraits[]> {
    try {
      const traits = db.all(
        'SELECT * FROM personality_traits WHERE user_id = ? ORDER BY evidence_count DESC',
        [userId]
      ) as PersonalityTraits[];
      return traits;
    } catch (error) {
      console.error('Error getting personality traits:', error);
      return [];
    }
  }

  /**
   * Get dominant traits for a user
   */
  static async getDominantTraits(userId: number, limit: number = 3): Promise<PersonalityTraits[]> {
    const traits = await this.getTraits(userId);
    return traits.slice(0, limit);
  }
}
