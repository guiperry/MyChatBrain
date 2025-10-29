"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import cytoscape from 'cytoscape';
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

interface MemoryGraph {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
}

const MemoryGraph: React.FC = () => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const [relatedNodes, setRelatedNodes] = useState<Array<MemoryNode & { similarity: number }>>([]);
  const [showAddNodeForm, setShowAddNodeForm] = useState(false);
  const [newNode, setNewNode] = useState<{
    label: string;
    type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom';
  }>({
    label: '',
    type: 'keyword',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Function to load the memory graph from the API
  const loadMemoryGraph = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/memory', {
        credentials: 'include'
      });

      if (response.status === 401) {
        console.log('Session expired, redirecting to login');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load memory graph: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        renderGraph(data.graph);
      } else {
        console.error('Failed to load memory graph:', data.error);
      }
    } catch (error) {
      console.error('Error loading memory graph:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to render the graph
  const renderGraph = (graph: MemoryGraph) => {
    if (!containerRef.current) return;

    // Define node colors based on type
    const nodeColors = {
      keyword: '#4caf50',
      entity: '#2196f3',
      message: '#ff9800',
      topic: '#9c27b0',
      custom: '#f44336',
    };

    // Define edge colors based on relation
    const edgeColors = {
      related_to: '#999',
      mentioned_in: '#666',
      part_of: '#333',
      temporal: '#000',
      custom: '#f44336',
    };

    // Convert the graph data to Cytoscape format
    const elements = [
      ...graph.nodes.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          metadata: node.metadata,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
        },
        classes: node.type,
      })),
      ...graph.edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          relation: edge.relation,
          weight: edge.weight,
          metadata: edge.metadata,
          createdAt: edge.createdAt,
          updatedAt: edge.updatedAt,
        },
        classes: edge.relation,
      })),
    ];

    // Initialize Cytoscape
    cyRef.current = cytoscape({
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
            'text-max-width': '80px',
            'text-wrap': 'wrap',
          },
        },
        {
          selector: 'node.keyword',
          style: {
            'background-color': nodeColors.keyword,
            'text-outline-color': nodeColors.keyword,
          },
        },
        {
          selector: 'node.entity',
          style: {
            'background-color': nodeColors.entity,
            'text-outline-color': nodeColors.entity,
          },
        },
        {
          selector: 'node.message',
          style: {
            'background-color': nodeColors.message,
            'text-outline-color': nodeColors.message,
          },
        },
        {
          selector: 'node.topic',
          style: {
            'background-color': nodeColors.topic,
            'text-outline-color': nodeColors.topic,
          },
        },
        {
          selector: 'node.custom',
          style: {
            'background-color': nodeColors.custom,
            'text-outline-color': nodeColors.custom,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#333',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 'data(weight)',
            'line-color': 'data(relation)',
            'target-arrow-color': 'data(relation)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7,
          },
        },
        {
          selector: 'edge.related_to',
          style: {
            'line-color': edgeColors.related_to,
            'target-arrow-color': edgeColors.related_to,
          },
        },
        {
          selector: 'edge.mentioned_in',
          style: {
            'line-color': edgeColors.mentioned_in,
            'target-arrow-color': edgeColors.mentioned_in,
          },
        },
        {
          selector: 'edge.part_of',
          style: {
            'line-color': edgeColors.part_of,
            'target-arrow-color': edgeColors.part_of,
          },
        },
        {
          selector: 'edge.temporal',
          style: {
            'line-color': edgeColors.temporal,
            'target-arrow-color': edgeColors.temporal,
          },
        },
        {
          selector: 'edge.custom',
          style: {
            'line-color': edgeColors.custom,
            'target-arrow-color': edgeColors.custom,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 'data(weight)',
            'line-color': '#333',
            'target-arrow-color': '#333',
            'opacity': 1,
          },
        },
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: () => 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: () => 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
      } as any,
    });

    // Add event listeners
    if (cyRef?.current) {
      cyRef.current.on('tap', 'node', async (event: any) => {
      const node = event.target.data();
      const selectedNode = {
        id: node.id,
        label: node.label,
        type: node.type,
        metadata: node.metadata,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      };

      setSelectedNode(selectedNode);

      // Find semantically related nodes
      try {
        const response = await fetch(`/api/memory/related?id=${node.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.relatedNodes) {
            setRelatedNodes(data.relatedNodes);
          } else {
            setRelatedNodes([]);
          }
        } else {
          setRelatedNodes([]);
        }
      } catch (error) {
        console.error('Error fetching related nodes:', error);
        setRelatedNodes([]);
      }
    });

      cyRef.current.on('tap', (event: any) => {
      if (event.target === cyRef.current) {
        setSelectedNode(null);
        setRelatedNodes([]);
      }
    });
    }
  };

  // Function to add a new node
  const addNode = async () => {
    try {
      if (!newNode.label) {
        alert('Please enter a label for the node');
        return;
      }

      setLoading(true);
      const response = await fetch('/api/memory', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label: newNode.label,
          type: newNode.type,
        }),
      });

      if (response.status === 401) {
        console.log('Session expired, redirecting to login');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to add node: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setShowAddNodeForm(false);
        setNewNode({ label: '', type: 'keyword' });
        loadMemoryGraph();
      } else {
        console.error('Failed to add node:', data.error);
        alert(`Failed to add node: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding node:', error);
      alert(`Error adding node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to delete a node
  const deleteNode = async () => {
    if (!selectedNode) return;

    if (!confirm(`Are you sure you want to delete the node "${selectedNode.label}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/memory/nodes?id=${selectedNode.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.status === 401) {
        console.log('Session expired, redirecting to login');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to delete node: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setSelectedNode(null);
        loadMemoryGraph();
      } else {
        console.error('Failed to delete node:', data.error);
        alert(`Failed to delete node: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting node:', error);
      alert(`Error deleting node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to search for nodes
  const searchNodes = async () => {
    if (!searchQuery) return;

    setLoading(true);

    try {
      // First try semantic search
      const response = await fetch(`/api/memory/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        console.log('Session expired, redirecting to login');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.nodes || data.nodes.length === 0) {
        // If semantic search returns no results, fall back to basic search
        if (cyRef.current) {
          // Reset all nodes and edges
          cyRef.current.elements().removeClass('highlighted');
          cyRef.current.elements().removeClass('faded');

          // Find nodes that match the search query
          const matchingNodes = cyRef.current.nodes().filter((node: any) => {
            const label = node.data('label').toLowerCase();
            return label.includes(searchQuery.toLowerCase());
          });

          if (matchingNodes.length === 0) {
            alert('No nodes found matching the search query');
            return;
          }

          // Highlight matching nodes and their connected edges
          matchingNodes.addClass('highlighted');
          matchingNodes.connectedEdges().addClass('highlighted');

          // Fade all other elements
          cyRef.current.elements().not('.highlighted').addClass('faded');

          // Center the view on the first matching node
          cyRef.current.fit(matchingNodes, 50);
        } else {
          alert('No nodes found matching the search query');
        }
      } else {
        // Use the semantic search results
        if (cyRef.current) {
          // Reset all nodes and edges
          cyRef.current.elements().removeClass('highlighted');
          cyRef.current.elements().removeClass('faded');

          // Get the node IDs from the search results
          const nodeIds = data.nodes.map((node: any) => node.id);

          // Find the matching nodes in the graph
          const matchingNodes = cyRef.current.nodes().filter((node: any) => {
            return nodeIds.includes(node.id());
          });

          if (matchingNodes.length === 0) {
            // If no matching nodes are found in the current graph, reload the graph
            await loadMemoryGraph();

            // Try again after reloading
            const newMatchingNodes = cyRef.current.nodes().filter((node: any) => {
              return nodeIds.includes(node.id());
            });

            if (newMatchingNodes.length === 0) {
              alert('No nodes found in the current graph. Try expanding your view.');
              return;
            }

            // Highlight matching nodes and their connected edges
            newMatchingNodes.addClass('highlighted');
            newMatchingNodes.connectedEdges().addClass('highlighted');

            // Fade all other elements
            cyRef.current.elements().not('.highlighted').addClass('faded');

            // Center the view on the matching nodes
            cyRef.current.fit(newMatchingNodes, 50);
          } else {
            // Highlight matching nodes and their connected edges
            matchingNodes.addClass('highlighted');
            matchingNodes.connectedEdges().addClass('highlighted');

            // Fade all other elements
            cyRef.current.elements().not('.highlighted').addClass('faded');

            // Center the view on the matching nodes
            cyRef.current.fit(matchingNodes, 50);
          }
        }
      }
    } catch (error) {
      console.error('Error searching nodes:', error);
      alert(`Error searching nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Fall back to basic search if the API fails
      if (cyRef.current) {
        // Reset all nodes and edges
        cyRef.current.elements().removeClass('highlighted');
        cyRef.current.elements().removeClass('faded');

        // Find nodes that match the search query
        const matchingNodes = cyRef.current.nodes().filter((node: any) => {
          const label = node.data('label').toLowerCase();
          return label.includes(searchQuery.toLowerCase());
        });

        if (matchingNodes.length === 0) {
          alert('No nodes found matching the search query');
          return;
        }

        // Highlight matching nodes and their connected edges
        matchingNodes.addClass('highlighted');
        matchingNodes.connectedEdges().addClass('highlighted');

        // Fade all other elements
        cyRef.current.elements().not('.highlighted').addClass('faded');

        // Center the view on the first matching node
        cyRef.current.fit(matchingNodes, 50);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to reset the view
  const resetView = () => {
    if (!cyRef.current) return;

    // Remove highlighting and fading
    cyRef.current.elements().removeClass('highlighted');
    cyRef.current.elements().removeClass('faded');

    // Reset the view
    cyRef.current.fit();
  };

  // Load the memory graph on component mount
  useEffect(() => {
    loadMemoryGraph();

    // Cleanup function
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div ref={containerRef} className={styles.graphContainer}></div>

      {/* Search controls */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchNodes()}
        />
        <button className={styles.searchButton} onClick={searchNodes}>
          Search
        </button>
      </div>

      {/* Graph controls */}
      <div className={styles.controls}>
        <button
          className={styles.controlButton}
          onClick={() => setShowAddNodeForm(true)}
          title="Add Node"
        >
          Add Node
        </button>
        <button
          className={styles.controlButton}
          onClick={resetView}
          title="Reset View"
        >
          Reset View
        </button>
        <button
          className={styles.controlButton}
          onClick={loadMemoryGraph}
          title="Refresh"
        >
          Refresh
        </button>
      </div>

      {/* Node details */}
      {selectedNode && (
        <div className={styles.nodeDetails}>
          <h3>{selectedNode.label}</h3>
          <p>Type: {selectedNode.type}</p>
          <p>Created: {new Date(selectedNode.createdAt).toLocaleString()}</p>

          {/* Related nodes */}
          {relatedNodes.length > 0 && (
            <div>
              <p>Semantically Related:</p>
              <ul>
                {relatedNodes.map(node => (
                  <li key={node.id}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (cyRef.current) {
                          const targetNode = cyRef.current.getElementById(node.id);
                          if (targetNode.length > 0) {
                            cyRef.current.center(targetNode);
                            cyRef.current.zoom({
                              level: 2,
                              position: targetNode.position()
                            });
                          }
                        }
                      }}
                    >
                      {node.label} ({Math.round(node.similarity * 100)}%)
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata */}
          {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
            <div>
              <p>Metadata:</p>
              <ul>
                {Object.entries(selectedNode.metadata).map(([key, value]) => (
                  <li key={key}>
                    {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            className={styles.controlButton}
            onClick={deleteNode}
            style={{ marginTop: '8px' }}
          >
            Delete Node
          </button>
        </div>
      )}

      {/* Add node form */}
      {showAddNodeForm && (
        <div className={styles.addNodeForm}>
          <h3>Add New Node</h3>
          <div className={styles.formGroup}>
            <label htmlFor="nodeLabel">Label</label>
            <input
              type="text"
              id="nodeLabel"
              value={newNode.label}
              onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="nodeType">Type</label>
            <select
              id="nodeType"
              value={newNode.type}
              onChange={(e) => setNewNode({ ...newNode, type: e.target.value as any })}
            >
              <option value="keyword">Keyword</option>
              <option value="entity">Entity</option>
              <option value="message">Message</option>
              <option value="topic">Topic</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <button
              className={styles.cancelButton}
              onClick={() => {
                setShowAddNodeForm(false);
                setNewNode({ label: '', type: 'keyword' });
              }}
            >
              Cancel
            </button>
            <button className={styles.saveButton} onClick={addNode}>
              Add Node
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.keyword}`}></div>
          <span>Keyword</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.entity}`}></div>
          <span>Entity</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.message}`}></div>
          <span>Message</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.topic}`}></div>
          <span>Topic</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.custom}`}></div>
          <span>Custom</span>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  );
};

export default MemoryGraph;
