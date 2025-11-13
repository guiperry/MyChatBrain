"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MemoryGraph.module.css';

// Define the node and edge types
interface MemoryNode {
  id: string;
  label: string;
  type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface MemoryEdge {
  id: string;
  source: string;
  target: string;
  relation: 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom';
  weight: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface MemoryGraphProps {
  nodes?: MemoryNode[];
  edges?: MemoryEdge[];
  onNodeClick?: (node: MemoryNode) => void;
  onEdgeClick?: (edge: MemoryEdge) => void;
}

const MemoryGraph: React.FC<MemoryGraphProps> = ({
  nodes = [],
  edges = [],
  onNodeClick,
  onEdgeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let cytoscapeInstance: any = null;

    const initializeCytoscape = async () => {
      try {
        setIsLoading(true);
        
        // Check if container exists and component is still mounted
        if (!containerRef.current || !isMounted) {
          return;
        }
        
        // Dynamically import cytoscape
        const cytoscape = await import('cytoscape');
        
        // Convert nodes and edges to cytoscape format
        const elements = [
          ...nodes.map(node => ({
            data: {
              id: node.id,
              label: node.label,
              type: node.type,
              weight: 50, // Default weight
            },
            classes: node.type,
          })),
          ...edges.map(edge => ({
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              relation: edge.relation,
              weight: edge.weight,
            },
            classes: edge.relation,
          })),
        ];

        // Check again if container exists and component is still mounted
        if (!containerRef.current || !isMounted) {
          return;
        }

        // Initialize cytoscape
        cytoscapeInstance = cytoscape.default({
          container: containerRef.current,
          elements,
          style: [
            {
              selector: 'node',
              style: {
                'background-color': 'data(type)',
                'label': 'data(label)',
                'color': '#fff',
                'text-outline-color': 'data(type)',
                'text-outline-width': 2,
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 12,
                'width': 30,
                'height': 30,
              }
            },
            {
              selector: 'edge',
              style: {
                'width': 'mapData(weight, 0, 100, 1, 5)',
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
              }
            },
            {
              selector: 'node.keyword',
              style: {
                'background-color': '#4CAF50',
              }
            },
            {
              selector: 'node.entity',
              style: {
                'background-color': '#2196F3',
              }
            },
            {
              selector: 'node.message',
              style: {
                'background-color': '#FF9800',
              }
            },
            {
              selector: 'node.topic',
              style: {
                'background-color': '#9C27B0',
              }
            },
            {
              selector: 'node.custom',
              style: {
                'background-color': '#607D8B',
              }
            }
          ],
          layout: {
            name: 'cose',
            idealEdgeLength: 100,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            nodeRepulsion: 400000,
            edgeElasticity: 100,
            nestingFactor: 5,
            gravity: 80,
            numIter: 1000,
            initialTemp: 200,
            coolingFactor: 0.95,
            minTemp: 1.0
          }
        });

        // Store instance reference
        cyRef.current = cytoscapeInstance;

        // Add event listeners
        cytoscapeInstance.on('tap', 'node', (event: any) => {
          const node = event.target;
          const nodeData = node.data();
          const originalNode = nodes.find(n => n.id === nodeData.id);
          if (originalNode && onNodeClick) {
            onNodeClick(originalNode);
          }
        });

        cytoscapeInstance.on('tap', 'edge', (event: any) => {
          const edge = event.target;
          const edgeData = edge.data();
          const originalEdge = edges.find(e => e.id === edgeData.id);
          if (originalEdge && onEdgeClick) {
            onEdgeClick(originalEdge);
          }
        });

      } catch (error) {
        console.error('Error initializing cytoscape:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeCytoscape();

    // Cleanup
    return () => {
      isMounted = false;
      if (cytoscapeInstance) {
        try {
          cytoscapeInstance.destroy();
        } catch (error) {
          // Ignore errors during cleanup as they're usually harmless
          console.warn('Error during cytoscape cleanup:', error);
        }
      }
      cyRef.current = null;
    };
  }, [nodes, edges, onNodeClick, onEdgeClick]);

  const handleRefresh = () => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      try {
        cyRef.current.layout({
          name: 'cose',
          idealEdgeLength: 100,
          nodeOverlap: 20,
          refresh: 20,
          fit: true,
          padding: 30,
          randomize: true,
          componentSpacing: 100,
          nodeRepulsion: 400000,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0
        }).run();
      } catch (error) {
        console.warn('Error refreshing cytoscape layout:', error);
      }
    }
  };

  const handleFit = () => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      try {
        cyRef.current.fit();
      } catch (error) {
        console.warn('Error fitting cytoscape view:', error);
      }
    }
  };

  const handleReset = () => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      try {
        cyRef.current.reset();
        cyRef.current.fit();
      } catch (error) {
        console.warn('Error resetting cytoscape view:', error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button onClick={handleRefresh} className={styles.toolbarButton}>
          Refresh Layout
        </button>
        <button onClick={handleFit} className={styles.toolbarButton}>
          Fit to View
        </button>
        <button onClick={handleReset} className={styles.toolbarButton}>
          Reset View
        </button>
      </div>
      
      <div 
        ref={containerRef} 
        className={styles.graphContainer}
        style={{ opacity: isLoading ? 0.5 : 1 }}
      >
        {isLoading && (
          <div className={styles.loading}>
            Loading memory graph...
          </div>
        )}
      </div>
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.keyword}`}></div>
          <span>Keywords</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.entity}`}></div>
          <span>Entities</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.message}`}></div>
          <span>Messages</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.topic}`}></div>
          <span>Topics</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.custom}`}></div>
          <span>Custom</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryGraph;
