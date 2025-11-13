import { db } from '@/db';

// Interface for extracted entities
interface ExtractedEntity {
  text: string;
  type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom';
  metadata?: Record<string, any>;
}

// Interface for extracted relationships
interface ExtractedRelationship {
  source: string;
  target: string;
  relation: 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom';
  weight: number;
  metadata?: Record<string, any>;
}

/**
 * Extract entities and keywords from a chat message
 * @param message The chat message to extract from
 * @param userId The user ID
 * @returns An object containing the extracted entities and relationships
 */
export async function extractFromMessage(message: string, userId: number) {
  // This is a simple implementation that extracts keywords based on frequency
  // In a production environment, you would use a more sophisticated NLP approach
  
  // Remove common stop words and punctuation
  const stopWords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
    'may', 'might', 'must', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against',
    'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from', 'up',
    'down', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
    'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours',
    'hers', 'ours', 'theirs', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
  ];
  
  // Clean the message
  const cleanedMessage = message.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
    .trim();
  
  // Split into words and filter out stop words
  const words = cleanedMessage.split(' ')
    .filter(word => word.length > 2)  // Filter out short words
    .filter(word => !stopWords.includes(word));
  
  // Count word frequency
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Sort words by frequency
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);  // Take the top 5 keywords
  
  // Create entities for each keyword
  const entities: ExtractedEntity[] = sortedWords.map(([word, count]) => ({
    text: word,
    type: 'keyword',
    metadata: { frequency: count }
  }));
  
  // Create a message entity
  const messageEntity: ExtractedEntity = {
    text: message.length > 50 ? message.substring(0, 47) + '...' : message,
    type: 'message',
    metadata: { fullText: message }
  };
  
  entities.push(messageEntity);
  
  // Create relationships between the message and each keyword
  const relationships: ExtractedRelationship[] = entities
    .filter(entity => entity.type === 'keyword')
    .map(entity => ({
      source: messageEntity.text,
      target: entity.text,
      relation: 'mentioned_in',
      weight: (entity.metadata?.frequency || 1) as number
    }));
  
  // Create relationships between keywords
  for (let i = 0; i < entities.length - 1; i++) {
    if (entities[i].type !== 'keyword') continue;
    
    for (let j = i + 1; j < entities.length; j++) {
      if (entities[j].type !== 'keyword') continue;
      
      relationships.push({
        source: entities[i].text,
        target: entities[j].text,
        relation: 'related_to',
        weight: 5  // Default weight
      });
    }
  }
  
  return { entities, relationships };
}

/**
 * Save extracted entities and relationships to the database
 * @param entities The extracted entities
 * @param relationships The extracted relationships
 * @param userId The user ID
 */
export async function saveToMemoryGraph(
  entities: ExtractedEntity[],
  relationships: ExtractedRelationship[],
  userId: number
) {
  // Get RxDB helper instance
  const NebulaDBHelper = await db();

  // Map to store entity text to node ID
  const entityMap: Record<string, number> = {};

  // Save entities
  for (const entity of entities) {
    // Check if the entity already exists
    const existingNodes = await NebulaDBHelper.findMemoryNode(
      entity.text,
      entity.type as 'keyword' | 'entity' | 'message' | 'topic' | 'custom',
      userId
    );

    let nodeId: number;
    if (existingNodes.length > 0) {
      // Update the existing node
      const existingNode = existingNodes[0];
      nodeId = parseInt(existingNode.id);
      await NebulaDBHelper.updateMemoryNode(nodeId, {
        metadata: entity.metadata ? JSON.stringify(entity.metadata) : ''
      });
    } else {
      // Insert a new node
      const newNode = await NebulaDBHelper.createMemoryNode({
        label: entity.text,
        type: entity.type as 'keyword' | 'entity' | 'message' | 'topic' | 'custom',
        user_id: userId,
        metadata: entity.metadata ? JSON.stringify(entity.metadata) : ''
      });
      nodeId = parseInt(newNode.id);
    }

    // Store the node ID in the map
    entityMap[entity.text] = nodeId;
  }

  // Save relationships
  for (const relationship of relationships) {
    const sourceId = entityMap[relationship.source];
    const targetId = entityMap[relationship.target];

    if (!sourceId || !targetId) {
      console.warn('Missing node ID for relationship:', relationship);
      continue;
    }

    // Check if the relationship already exists
    const existingEdges = await NebulaDBHelper.findMemoryEdge(
      sourceId,
      targetId,
      relationship.relation as 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom'
    );

    if (existingEdges.length > 0) {
      // Update the existing edge with increased weight
      const existingEdge = existingEdges[0];
      const newWeight = Math.min(10, existingEdge.weight + 1);
      await existingEdge.patch({
        weight: newWeight,
        metadata: relationship.metadata ? JSON.stringify(relationship.metadata) : '',
        updated_at: new Date().toISOString()
      });
    } else {
      // Insert a new edge
      await NebulaDBHelper.createMemoryEdge({
        source_id: sourceId,
        target_id: targetId,
        relation: relationship.relation as 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom',
        weight: relationship.weight,
        metadata: relationship.metadata ? JSON.stringify(relationship.metadata) : ''
      });
    }
  }
}

/**
 * Process a chat message and update the memory graph
 * @param message The chat message to process
 * @param userId The user ID
 */
export async function processMessage(message: string, userId: number) {
  try {
    // Extract entities and relationships from the message
    const { entities, relationships } = await extractFromMessage(message, userId);
    
    // Save to the memory graph
    await saveToMemoryGraph(entities, relationships, userId);
    
    return { success: true };
  } catch (error) {
    console.error('Error processing message for memory graph:', error);
    return { success: false, error };
  }
}
