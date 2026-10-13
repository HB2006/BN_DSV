export interface GraphNode {
    id: number;
    value: number;
    x: number;
    y: number;
  }
  
  export interface GraphEdge {
    source: number;
    target: number;
    weight?: number;
  }
  
  export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
  }
  
  export type GraphOperation =
    | "add-vertex"
    | "remove-vertex"
    | "add-edge"
    | "remove-edge"
    | "search"
    | "bfs"
    | "dfs"
    | "clear";