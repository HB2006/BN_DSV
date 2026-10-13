import type { GraphData, GraphNode, GraphEdge } from "./type";

export function addVertex(
  graph: GraphData,
  value: number,
  id: number,
  x?: number,
  y?: number
): GraphData {
  if (graph.nodes.some((node) => node.value === value)) {
    throw new Error(`Vertex ${value} already exists.`);
  }

  const nodeX = x ?? 150 + Math.random() * 400;
  const nodeY = y ?? 100 + Math.random() * 250;

  const newNode: GraphNode = {
    id,
    value,
    x: nodeX,
    y: nodeY,
  };

  return {
    nodes: [...graph.nodes, newNode],
    edges: [...graph.edges],
  };
}

export function removeVertex(
  graph: GraphData,
  value: number
): GraphData {
  const node = graph.nodes.find((item) => item.value === value);

  if (!node) {
    throw new Error(`Vertex ${value} was not found.`);
  }

  return {
    nodes: graph.nodes.filter((item) => item.id !== node.id),
    edges: graph.edges.filter(
      (edge) => edge.source !== node.id && edge.target !== node.id
    ),
  };
}

export function addEdge(
  graph: GraphData,
  sourceValue: number,
  targetValue: number,
  weight = 1
): GraphData {
  const source = graph.nodes.find(
    (node) => node.value === sourceValue
  );
  const target = graph.nodes.find(
    (node) => node.value === targetValue
  );

  if (!source) {
    throw new Error(`Vertex ${sourceValue} was not found.`);
  }

  if (!target) {
    throw new Error(`Vertex ${targetValue} was not found.`);
  }

  if (source.id === target.id) {
    throw new Error("Self-loops are not allowed.");
  }

  const edgeExists = graph.edges.some(
    (edge) =>
      (edge.source === source.id && edge.target === target.id) ||
      (edge.source === target.id && edge.target === source.id)
  );

  if (edgeExists) {
    throw new Error("An edge between these vertices already exists.");
  }

  const newEdge: GraphEdge = {
    source: source.id,
    target: target.id,
    weight,
  };

  return {
    nodes: [...graph.nodes],
    edges: [...graph.edges, newEdge],
  };
}

export function removeEdge(
  graph: GraphData,
  sourceValue: number,
  targetValue: number
): GraphData {
  const source = graph.nodes.find(
    (node) => node.value === sourceValue
  );
  const target = graph.nodes.find(
    (node) => node.value === targetValue
  );

  if (!source || !target) {
    throw new Error("One or both vertices were not found.");
  }

  const edgeExists = graph.edges.some(
    (edge) =>
      (edge.source === source.id && edge.target === target.id) ||
      (edge.source === target.id && edge.target === source.id)
  );

  if (!edgeExists) {
    throw new Error(
      `No edge exists between ${sourceValue} and ${targetValue}.`
    );
  }

  return {
    nodes: [...graph.nodes],
    edges: graph.edges.filter(
      (edge) =>
        !(
          (edge.source === source.id && edge.target === target.id) ||
          (edge.source === target.id && edge.target === source.id)
        )
    ),
  };
}

export function searchVertex(
  graph: GraphData,
  value: number
): GraphNode | undefined {
  return graph.nodes.find((node) => node.value === value);
}

export function bfs(
  graph: GraphData,
  startValue: number
): number[] {
  const start = graph.nodes.find(
    (node) => node.value === startValue
  );

  if (!start) {
    throw new Error(`Starting vertex ${startValue} was not found.`);
  }

  const visited = new Set<number>([start.id]);
  const queue: number[] = [start.id];
  const result: number[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentNode = graph.nodes.find(
      (node) => node.id === currentId
    );

    if (currentNode) {
      result.push(currentNode.value);
    }

    const neighbors = getNeighbors(graph, currentId);

    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }

  return result;
}

export function dfs(
  graph: GraphData,
  startValue: number
): number[] {
  const start = graph.nodes.find(
    (node) => node.value === startValue
  );

  if (!start) {
    throw new Error(`Starting vertex ${startValue} was not found.`);
  }

  const visited = new Set<number>();
  const result: number[] = [];

  function visit(nodeId: number) {
    if (visited.has(nodeId)) return;

    visited.add(nodeId);

    const node = graph.nodes.find((item) => item.id === nodeId);

    if (node) {
      result.push(node.value);
    }

    const neighbors = getNeighbors(graph, nodeId);

    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        visit(neighborId);
      }
    }
  }

  visit(start.id);

  return result;
}

export function getNeighbors(
  graph: GraphData,
  nodeId: number
): number[] {
  const neighbors: number[] = [];

  for (const edge of graph.edges) {
    if (edge.source === nodeId) {
      neighbors.push(edge.target);
    } else if (edge.target === nodeId) {
      neighbors.push(edge.source);
    }
  }

  return neighbors.sort((a, b) => {
    const valueA =
      graph.nodes.find((node) => node.id === a)?.value ?? a;
    const valueB =
      graph.nodes.find((node) => node.id === b)?.value ?? b;

    return valueA - valueB;
  });
}

export function clearGraph(): GraphData {
  return {
    nodes: [],
    edges: [],
  };
}