"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './MemoryGraph.module.css';

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
  const initializedRef = useRef(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const containerIdRef = useRef<string>(`cy-${Math.random().toString(36).substring(2, 11)}`);

  const initGraph = useCallback(async () => {
    if (initializedRef.current) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (!containerRef.current) {
        return;
      }

      const cytoscape = await import('cytoscape');
      
      const elements = [
        ...nodes.map(node => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            weight: 50,
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

      const cy = cytoscape.default({
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
            style: { 'background-color': '#4CAF50' }
          },
          {
            selector: 'node.entity',
            style: { 'background-color': '#2196F3' }
          },
          {
            selector: 'node.message',
            style: { 'background-color': '#FF9800' }
          },
          {
            selector: 'node.topic',
            style: { 'background-color': '#9C27B0' }
          },
          {
            selector: 'node.custom',
            style: { 'background-color': '#607D8B' }
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

      cy.on('tap', 'node', (event: any) => {
        const nodeData = event.target.data();
        const originalNode = nodes.find(n => n.id === nodeData.id);
        if (originalNode && onNodeClick) {
          onNodeClick(originalNode);
        }
      });

      cy.on('tap', 'edge', (event: any) => {
        const edgeData = event.target.data();
        const originalEdge = edges.find(e => e.id === edgeData.id);
        if (originalEdge && onEdgeClick) {
          onEdgeClick(originalEdge);
        }
      });

      cyRef.current = cy;
      initializedRef.current = true;
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing cytoscape:', error);
      setIsLoading(false);
    }
  }, [nodes, edges, onNodeClick, onEdgeClick]);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      initGraph();
    }

    return () => {
      if (cyRef.current && !cyRef.current.destroyed) {
        try {
          cyRef.current.destroy();
        } catch (e) {}
      }
      cyRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (cyRef.current && !cyRef.current.destroyed()) {
      const cy = cyRef.current;
      
      cy.elements().remove();
      
      const newElements = [
        ...nodes.map(node => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            weight: 50,
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
      
      cy.add(newElements);
      cy.layout({ name: 'cose', fit: true, padding: 30 }).run();
    }
  }, [nodes, edges]);

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
