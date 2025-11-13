import { db, collections } from '@/database/nebuladb';
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
        const existing = await collections.personality_traits.findOne({
          user_id: userId,
          trait_label: trait.trait
        }) as any;

        if (existing) {
          // Update existing trait with weighted average
          const newEvidenceCount = existing.evidence_count + trait.evidenceCount;
          const blendedPercentile = Math.round(
            (existing.percentile * existing.evidence_count + trait.percentile * trait.evidenceCount) / newEvidenceCount
          );

          const updatedTrait = {
            _id: existing._id,
            user_id: existing.user_id,
            trait_label: existing.trait_label,
            percentile: blendedPercentile,
            evidence_count: newEvidenceCount,
            last_updated: new Date().toISOString(),
            created_at: existing.created_at
          };

          await collections.personality_traits.update(
            { _id: existing._id },
            { $set: updatedTrait }
          );

          updatedTraits.push({
            id: parseInt(existing._id.split('-').pop() || '0'),
            ...updatedTrait
          });
        } else {
          // Create new trait
          const personalityTrait = {
            _id: `trait-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            trait_label: trait.trait,
            percentile: trait.percentile,
            evidence_count: trait.evidenceCount,
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString()
          };

          const inserted = await collections.personality_traits.insert(personalityTrait);
          updatedTraits.push({
            id: parseInt(personalityTrait._id.split('-').pop() || '0'),
            ...personalityTrait
          });
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
      const traits = await (collections.personality_traits as any).find({ user_id: userId }).toArray();
      return traits.map((trait: any) => ({
        id: parseInt(trait._id.split('-').pop() || '0'),
        user_id: trait.user_id,
        trait_label: trait.trait_label,
        percentile: trait.percentile,
        evidence_count: trait.evidence_count,
        last_updated: trait.last_updated,
        created_at: trait.created_at
      })).sort((a: PersonalityTraits, b: PersonalityTraits) => b.evidence_count - a.evidence_count);
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
