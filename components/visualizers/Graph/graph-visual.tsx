"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Undo2,
  Redo2,
  RotateCcw,
  Shuffle,
  Plus,
  Trash2,
  Search,
  Gauge,
} from "lucide-react";

import type { GraphData, GraphOperation } from "./type";
import {
  addVertex,
  removeVertex,
  addEdge,
  removeEdge,
  searchVertex,
  clearGraph,
} from "./graph-operation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

type GraphSnapshot = {
  graph: GraphData;
  activeNode: number | null;
  activeLine: number;
  traversal: number[];
  message: string;
};

type CodeInfo = {
  title: string;
  description: string;
  steps: string[];
  code: string[];
  complexity: string;
};

/** One step of a BFS / DFS trace. */
type TraceStep = {
  node: number; // vertex value being visited
  from: number | null; // vertex value we arrived from (null for the start)
  line: number; // pseudocode line to highlight
};

/* ---------- SHARED STYLE TOKENS (match the Stack / Queue pages) ---------- */

// Card: soft teal border, rounded-2xl
const cardCls = "rounded-2xl border-[#BFD8D8] bg-card shadow-none";

// Inner boxes (stats, how-it-works, traversal, etc.)
const innerBox = "rounded-xl border border-[#BFD8D8]";

// Operation buttons: teal fill, tan/orange border, bold white text
const opButton =
  "h-8 w-full rounded-lg border border-[#E0A96D] bg-secondary text-xs font-semibold text-white hover:bg-secondary/90";

// Playback buttons: coral fill, teal border (disabled state fades via opacity)
const coralButton =
  "gap-2 rounded-lg border border-[#0F6B6D] bg-[#F08080] font-semibold text-white hover:bg-[#E56B6B] hover:text-white disabled:opacity-50 dark:bg-[#F08080] dark:hover:bg-[#E56B6B]";

// Zoom buttons: outlined teal, cream background
const zoomButton =
  "h-8 rounded-lg border border-[#0F6B6D] bg-background px-0 text-[#0F6B6D] hover:bg-background/80";

const inputCls = "h-9 rounded-lg border-[#BFD8D8] bg-background text-sm";

const INITIAL_GRAPH: GraphData = {
  nodes: [
    { id: 1, value: 1, x: 250, y: 65 },
    { id: 2, value: 2, x: 110, y: 145 },
    { id: 3, value: 3, x: 390, y: 145 },
    { id: 4, value: 4, x: 150, y: 265 },
    { id: 5, value: 5, x: 350, y: 265 },
  ],
  edges: [
    { source: 1, target: 2, weight: 1 },
    { source: 1, target: 3, weight: 1 },
    { source: 2, target: 3, weight: 1 },
    { source: 2, target: 4, weight: 1 },
    { source: 3, target: 5, weight: 1 },
    { source: 4, target: 5, weight: 1 },
    { source: 3, target: 4, weight: 1 },
  ],
};

const CODE_INFO: Record<string, CodeInfo> = {
  "add-vertex": {
    title: "Add Vertex",
    description: "Add a new vertex to the graph.",
    steps: [
      "Check whether the vertex already exists.",
      "Create a new vertex with the given value.",
      "Add it to the graph's vertex list.",
      "The graph now contains the new vertex.",
    ],
    code: [
      "function addVertex(graph, value):",
      "    if vertex already exists:",
      "        return graph",
      "    create a new vertex",
      "    add vertex to graph",
      "    return graph",
    ],
    complexity: "O(V)",
  },
  "remove-vertex": {
    title: "Remove Vertex",
    description: "Remove a vertex and all its connected edges.",
    steps: [
      "Find the vertex to remove.",
      "Remove the vertex from the graph.",
      "Remove every edge connected to it.",
      "Return the updated graph.",
    ],
    code: [
      "function removeVertex(graph, value):",
      "    find the vertex",
      "    remove the vertex",
      "    remove connected edges",
      "    return graph",
    ],
    complexity: "O(V + E)",
  },
  "add-edge": {
    title: "Add Edge",
    description: "Connect two existing vertices.",
    steps: [
      "Find the source vertex.",
      "Find the target vertex.",
      "Create an edge between them.",
      "Add the edge to the graph.",
    ],
    code: [
      "function addEdge(graph, source, target):",
      "    find source vertex",
      "    find target vertex",
      "    create an edge",
      "    add edge to graph",
      "    return graph",
    ],
    complexity: "O(V + E)",
  },
  "remove-edge": {
    title: "Remove Edge",
    description: "Remove the connection between two vertices.",
    steps: [
      "Find the edge connecting the two vertices.",
      "Remove it from the edge list.",
      "Both vertices stay in the graph.",
    ],
    code: [
      "function removeEdge(graph, source, target):",
      "    find the connecting edge",
      "    remove the edge",
      "    return graph",
    ],
    complexity: "O(E)",
  },
  search: {
    title: "Search Vertex",
    description: "Find a vertex with the given value.",
    steps: [
      "Visit each vertex in the graph.",
      "Compare its value with the target.",
      "Return the vertex when a match is found.",
      "Report not found if no vertex matches.",
    ],
    code: [
      "function searchVertex(graph, value):",
      "    for each vertex in graph:",
      "        if vertex.value == value:",
      "            return vertex",
      "    return not found",
    ],
    complexity: "O(V)",
  },
  bfs: {
    title: "Breadth-First Search",
    description: "Explore vertices level by level using a queue.",
    steps: [
      "Mark the starting vertex as visited and enqueue it.",
      "Dequeue the front vertex and visit it.",
      "Mark and enqueue each unvisited neighbor.",
      "Repeat until the queue is empty.",
    ],
    code: [
      "function BFS(start):",
      "    create an empty queue",
      "    mark start as visited",
      "    enqueue start",
      "    while queue is not empty:",
      "        vertex = dequeue",
      "        visit vertex",
      "        for each unvisited neighbor:",
      "            mark neighbor as visited",
      "            enqueue neighbor",
    ],
    complexity: "O(V + E)",
  },
  dfs: {
    title: "Depth-First Search",
    description: "Explore as far as possible before backtracking.",
    steps: [
      "Mark the current vertex as visited and visit it.",
      "Pick an unvisited neighbor.",
      "Recursively explore it as deep as possible.",
      "Backtrack when no unvisited neighbors remain.",
    ],
    code: [
      "function DFS(vertex):",
      "    mark vertex as visited",
      "    visit vertex",
      "    for each unvisited neighbor:",
      "        DFS(neighbor)",
    ],
    complexity: "O(V + E)",
  },
  clear: {
    title: "Clear Graph",
    description: "Remove all vertices and edges.",
    steps: [
      "Create an empty graph.",
      "All vertices are removed.",
      "All edges are removed.",
      "Return the empty graph.",
    ],
    code: [
      "function clearGraph():",
      "    create an empty graph",
      "    remove all vertices",
      "    remove all edges",
      "    return empty graph",
    ],
    complexity: "O(V + E)",
  },
};

const complexityRows = [
  { key: "add-vertex", title: "Add Vertex", time: "O(V)" },
  { key: "remove-vertex", title: "Remove Vertex", time: "O(V + E)" },
  { key: "add-edge", title: "Add Edge", time: "O(V + E)" },
  { key: "remove-edge", title: "Remove Edge", time: "O(E)" },
  { key: "search", title: "Search Vertex", time: "O(V)" },
  { key: "bfs", title: "BFS", time: "O(V + E)" },
  { key: "dfs", title: "DFS", time: "O(V + E)" },
  { key: "clear", title: "Clear Graph", time: "O(V + E)" },
];

const MAX_HISTORY = 50;

// Drawing area (matches the SVG viewBox 0 0 500 330) and node radius
const CANVAS_CENTER = { x: 250, y: 165 };
const MIN_NODE_GAP = 75;

const cloneGraph = (graph: GraphData): GraphData => ({
  nodes: graph.nodes.map((node) => ({ ...node })),
  edges: graph.edges.map((edge) => ({ ...edge })),
});

/**
 * Pick a spot for a new vertex that does not sit on top of an existing one.
 * Prefers the free spot closest to the middle of the canvas; if the canvas is
 * crowded it falls back to the spot farthest from every other vertex.
 */
const findFreePosition = (nodes: GraphData["nodes"]) => {
  if (nodes.length === 0) return { ...CANVAS_CENTER };

  let roomy: { x: number; y: number } | null = null;
  let roomyDistance = Infinity;
  let fallback = { ...CANVAS_CENTER };
  let fallbackGap = -1;

  for (let x = 45; x <= 455; x += 10) {
    for (let y = 45; y <= 285; y += 10) {
      let nearest = Infinity;

      for (const node of nodes) {
        nearest = Math.min(nearest, Math.hypot(node.x - x, node.y - y));
      }

      if (nearest > fallbackGap) {
        fallbackGap = nearest;
        fallback = { x, y };
      }

      if (nearest >= MIN_NODE_GAP) {
        const toCenter = Math.hypot(
          x - CANVAS_CENTER.x,
          y - CANVAS_CENTER.y
        );

        if (toCenter < roomyDistance) {
          roomyDistance = toCenter;
          roomy = { x, y };
        }
      }
    }
  }

  return roomy ?? fallback;
};

/**
 * Build the exact step-by-step trace of a BFS or DFS.
 * - Neighbors are visited in ascending order so the result is predictable.
 * - Undirected: edges work both ways. Directed: edges follow source -> target.
 * - Every step records which vertex we came from, so the edge that was
 *   actually used can be highlighted (not every edge between visited nodes).
 */
const buildTrace = (
  graph: GraphData,
  startValue: number,
  type: "bfs" | "dfs",
  directed: boolean
): TraceStep[] => {
  const valueById = new Map<number, number>();
  graph.nodes.forEach((node) => valueById.set(node.id, node.value));

  const adjacency = new Map<number, number[]>();
  graph.nodes.forEach((node) => adjacency.set(node.value, []));

  graph.edges.forEach((edge) => {
    const from = valueById.get(edge.source);
    const to = valueById.get(edge.target);

    if (from === undefined || to === undefined) return;

    adjacency.get(from)?.push(to);
    if (!directed) adjacency.get(to)?.push(from);
  });

  adjacency.forEach((list) => list.sort((a, b) => a - b));

  const steps: TraceStep[] = [];
  const visited = new Set<number>();

  if (type === "bfs") {
    // pseudocode line 6 = "visit vertex"
    const queue: { node: number; from: number | null }[] = [
      { node: startValue, from: null },
    ];
    visited.add(startValue);

    while (queue.length > 0) {
      const current = queue.shift()!;
      steps.push({ node: current.node, from: current.from, line: 6 });

      for (const neighbor of adjacency.get(current.node) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ node: neighbor, from: current.node });
        }
      }
    }
  } else {
    // pseudocode line 2 = "visit vertex"
    const visit = (node: number, from: number | null) => {
      visited.add(node);
      steps.push({ node, from, line: 2 });

      for (const neighbor of adjacency.get(node) ?? []) {
        if (!visited.has(neighbor)) visit(neighbor, node);
      }
    };

    visit(startValue, null);
  }

  return steps;
};

export default function GraphVisualizer() {
  const [graph, setGraph] = useState<GraphData>(() =>
    cloneGraph(INITIAL_GRAPH)
  );

  const [value, setValue] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [startVertex, setStartVertex] = useState("");
  const [nextId, setNextId] = useState(6);
  const [operation, setOperation] =
    useState<GraphOperation>("add-vertex");

  const [activeLine, setActiveLine] = useState(-1);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [traversal, setTraversal] = useState<number[]>([]);
  // tracedFrom[i] = vertex we arrived from when visiting traversal[i]
  const [tracedFrom, setTracedFrom] = useState<(number | null)[]>([]);
  const [message, setMessage] = useState(
    "Choose an operation to get started."
  );

  const [history, setHistory] = useState<string[]>([]);
  const [randomCount, setRandomCount] = useState("6");
  const [directed, setDirected] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1000");
  const [undoStack, setUndoStack] = useState<GraphSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<GraphSnapshot[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const graphRef = useRef(graph);
  const traversalRef = useRef(traversal);
  const parentsRef = useRef<(number | null)[]>([]);
  const linesRef = useRef<number[]>([]);
  const playbackIndexRef = useRef(playbackIndex);
  // last BFS / DFS that was run, so Play can replay it even after the graph changed
  const lastRunRef = useRef<{ type: "bfs" | "dfs"; start: number } | null>(
    null
  );
  const [canReplay, setCanReplay] = useState(false);

  useEffect(() => {
    graphRef.current = graph;
  }, [graph]);

  useEffect(() => {
    traversalRef.current = traversal;
  }, [traversal]);

  useEffect(() => {
    playbackIndexRef.current = playbackIndex;
  }, [playbackIndex]);

  const stopPlayback = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const takeSnapshot = useCallback((): GraphSnapshot => {
    return {
      graph: cloneGraph(graphRef.current),
      activeNode,
      activeLine,
      traversal: [...traversalRef.current],
      message,
    };
  }, [activeLine, activeNode, message]);

  const saveUndo = useCallback(() => {
    setUndoStack((previous) =>
      [
        ...previous,
        {
          graph: cloneGraph(graphRef.current),
          activeNode,
          activeLine,
          traversal: [...traversalRef.current],
          message,
        },
      ].slice(-MAX_HISTORY)
    );

    setRedoStack([]);
  }, [activeLine, activeNode, message]);

  const restoreSnapshot = useCallback((snapshot: GraphSnapshot) => {
    const restoredGraph = cloneGraph(snapshot.graph);

    setGraph(restoredGraph);
    graphRef.current = restoredGraph;

    // A restored graph never has a traversal running on it.
    setActiveNode(null);
    setActiveLine(-1);

    setTraversal([]);
    traversalRef.current = [];
    setTracedFrom([]);
    parentsRef.current = [];
    linesRef.current = [];

    setPlaybackIndex(-1);
    playbackIndexRef.current = -1;

    setMessage(snapshot.message);
  }, []);

  const handleUndo = useCallback(() => {
    stopPlayback();

    if (undoStack.length === 0) {
      setMessage("Nothing to undo.");
      return;
    }

    const previous = undoStack[undoStack.length - 1];

    setRedoStack((items) => [...items, takeSnapshot()]);
    setUndoStack((items) => items.slice(0, -1));

    restoreSnapshot(previous);
    setMessage("Undo successful.");
  }, [stopPlayback, undoStack, takeSnapshot, restoreSnapshot]);

  const handleRedo = useCallback(() => {
    stopPlayback();

    if (redoStack.length === 0) {
      setMessage("Nothing to redo.");
      return;
    }

    const next = redoStack[redoStack.length - 1];

    setUndoStack((items) => [...items, takeSnapshot()]);
    setRedoStack((items) => items.slice(0, -1));

    restoreSnapshot(next);
    setMessage("Redo successful.");
  }, [stopPlayback, redoStack, takeSnapshot, restoreSnapshot]);

  const recordHistory = (description: string) => {
    setHistory((previous) =>
      [description, ...previous].slice(0, MAX_HISTORY)
    );
  };

  const resetTraversal = () => {
    stopPlayback();

    setActiveLine(-1);
    setActiveNode(null);
    setTraversal([]);
    traversalRef.current = [];
    setTracedFrom([]);
    parentsRef.current = [];
    linesRef.current = [];

    setPlaybackIndex(-1);
    playbackIndexRef.current = -1;
  };

  const handleAddVertex = () => {
    const number = Number(value);

    if (value.trim() === "" || !Number.isFinite(number)) {
      setMessage("Enter a valid number for the vertex.");
      return;
    }

    if (graph.nodes.some((node) => node.value === number)) {
      setMessage(`Vertex ${number} already exists.`);
      return;
    }

    saveUndo();
    resetTraversal();

    // Place the new vertex in free space so it never covers an existing one.
    const { x, y } = findFreePosition(graph.nodes);

    const updatedGraph = addVertex(
      cloneGraph(graph),
      number,
      nextId,
      x,
      y
    );

    setGraph(updatedGraph);
    graphRef.current = updatedGraph;

    setNextId((id) => id + 1);
    setValue("");
    setOperation("add-vertex");
    setActiveLine(4);
    setMessage(`Vertex ${number} added successfully.`);
    recordHistory(`Added vertex ${number}`);
  };

  const handleRemoveVertex = () => {
    const number = Number(value);

    if (value.trim() === "" || !Number.isFinite(number)) {
      setMessage("Enter the vertex value to remove.");
      return;
    }

    if (!graph.nodes.some((node) => node.value === number)) {
      setMessage(`Vertex ${number} was not found.`);
      return;
    }

    saveUndo();
    resetTraversal();

    const updatedGraph = removeVertex(cloneGraph(graph), number);

    setGraph(updatedGraph);
    graphRef.current = updatedGraph;

    setValue("");
    setOperation("remove-vertex");
    setActiveLine(3);
    setMessage(`Vertex ${number} and its connected edges were removed.`);
    recordHistory(`Removed vertex ${number}`);
  };

  const handleAddEdge = () => {
    const sourceValue = Number(source);
    const targetValue = Number(target);

    if (
      source.trim() === "" ||
      target.trim() === "" ||
      !Number.isFinite(sourceValue) ||
      !Number.isFinite(targetValue)
    ) {
      setMessage("Enter valid source and target vertex values.");
      return;
    }

    if (sourceValue === targetValue) {
      setMessage("Choose two different vertices.");
      return;
    }

    const sourceNode = graph.nodes.find(
      (node) => node.value === sourceValue
    );
    const targetNode = graph.nodes.find(
      (node) => node.value === targetValue
    );

    if (!sourceNode || !targetNode) {
      setMessage("Both vertices must exist before adding an edge.");
      return;
    }

    const edgeExists = graph.edges.some(
      (edge) =>
        (edge.source === sourceNode.id &&
          edge.target === targetNode.id) ||
        (!directed &&
          edge.source === targetNode.id &&
          edge.target === sourceNode.id)
    );

    if (edgeExists) {
      setMessage("An edge between these vertices already exists.");
      return;
    }

    saveUndo();
    resetTraversal();

    const updatedGraph = addEdge(
      cloneGraph(graph),
      sourceValue,
      targetValue
    );

    setGraph(updatedGraph);
    graphRef.current = updatedGraph;

    setSource("");
    setTarget("");
    setOperation("add-edge");
    setActiveLine(4);
    setMessage(`Edge ${sourceValue} → ${targetValue} added successfully.`);
    recordHistory(`Added edge ${sourceValue} → ${targetValue}`);
  };

  const handleRemoveEdge = () => {
    const sourceValue = Number(source);
    const targetValue = Number(target);

    if (
      source.trim() === "" ||
      target.trim() === "" ||
      !Number.isFinite(sourceValue) ||
      !Number.isFinite(targetValue)
    ) {
      setMessage("Enter valid source and target vertex values.");
      return;
    }

    const sourceNode = graph.nodes.find(
      (node) => node.value === sourceValue
    );
    const targetNode = graph.nodes.find(
      (node) => node.value === targetValue
    );

    if (!sourceNode || !targetNode) {
      setMessage("Both vertices must exist.");
      return;
    }

    const edgeExists = graph.edges.some(
      (edge) =>
        (edge.source === sourceNode.id &&
          edge.target === targetNode.id) ||
        (edge.source === targetNode.id &&
          edge.target === sourceNode.id)
    );

    if (!edgeExists) {
      setMessage("No edge exists between these vertices.");
      return;
    }

    saveUndo();
    resetTraversal();

    const updatedGraph = removeEdge(
      cloneGraph(graph),
      sourceValue,
      targetValue
    );

    setGraph(updatedGraph);
    graphRef.current = updatedGraph;

    setSource("");
    setTarget("");
    setOperation("remove-edge");
    setActiveLine(2);
    setMessage(`Edge between ${sourceValue} and ${targetValue} removed.`);
    recordHistory(`Removed edge ${sourceValue} — ${targetValue}`);
  };

  const handleSearch = () => {
    const number = Number(value);

    if (value.trim() === "" || !Number.isFinite(number)) {
      setMessage("Enter a valid vertex value to search.");
      return;
    }

    resetTraversal();
    setOperation("search");

    const found = searchVertex(graph, number);

    if (found) {
      setActiveNode(found.value);
      setActiveLine(3);
      setMessage(`Vertex ${number} was found.`);
      recordHistory(`Searched for vertex ${number}: found`);
    } else {
      setActiveNode(null);
      setActiveLine(4);
      setMessage(`Vertex ${number} was not found.`);
      recordHistory(`Searched for vertex ${number}: not found`);
    }
  };

  /* ---------- TRAVERSAL PLAYBACK ---------- */

  // Show one step of the current trace (node, pseudocode line, message).
  const showStep = useCallback((index: number) => {
    const steps = traversalRef.current;

    if (index < 0 || index >= steps.length) return;

    playbackIndexRef.current = index;
    setPlaybackIndex(index);
    setActiveNode(steps[index]);
    setActiveLine(linesRef.current[index] ?? 0);

    const from = parentsRef.current[index];

    setMessage(
      from === null || from === undefined
        ? `Starting at vertex ${steps[index]} (1/${steps.length}).`
        : `Visiting vertex ${steps[index]} from ${from} (${index + 1}/${steps.length}).`
    );
  }, []);

  // (Re)start the timer that walks through the trace.
  const startTimer = useCallback(
    (speedMs: number) => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsPlaying(true);

      timerRef.current = setInterval(() => {
        const steps = traversalRef.current;
        const current = playbackIndexRef.current;

        if (steps.length === 0 || current >= steps.length - 1) {
          stopPlayback();
          return;
        }

        const next = current + 1;
        showStep(next);

        if (next >= steps.length - 1) {
          stopPlayback();
          setMessage(`Traversal complete: ${steps.join(" → ")}.`);
        }
      }, speedMs);
    },
    [showStep, stopPlayback]
  );

  // Build the trace on the CURRENT graph, load it, and show step 1.
  // Returns the number of steps (0 if the start vertex does not exist).
  const loadTrace = (type: "bfs" | "dfs", startValue: number): number => {
    if (!graph.nodes.some((node) => node.value === startValue)) {
      setMessage(`Starting vertex ${startValue} does not exist.`);
      return 0;
    }

    stopPlayback();

    const trace = buildTrace(graph, startValue, type, directed);

    const values = trace.map((step) => step.node);
    const parents = trace.map((step) => step.from);
    const lines = trace.map((step) => step.line);

    setOperation(type);

    setTraversal(values);
    traversalRef.current = values;
    setTracedFrom(parents);
    parentsRef.current = parents;
    linesRef.current = lines;

    lastRunRef.current = { type, start: startValue };
    setCanReplay(true);

    showStep(0);

    if (values.length === 1) {
      setMessage(
        `${type.toUpperCase()} from vertex ${startValue}: no connected vertices to visit.`
      );
    }

    return values.length;
  };

  // BFS / DFS: only the start vertex is needed — the trace plays by itself.
  const startTraversal = (type: "bfs" | "dfs") => {
    const startValue = Number(startVertex);

    if (startVertex.trim() === "" || !Number.isFinite(startValue)) {
      setMessage("Enter a starting vertex.");
      return;
    }

    const count = loadTrace(type, startValue);

    if (count === 0) return;

    recordHistory(`${type.toUpperCase()} traversal from ${startValue}`);

    if (count > 1) startTimer(Number(animationSpeed));
  };

  const handleClear = () => {
    saveUndo();
    resetTraversal();

    const updatedGraph = clearGraph();

    setGraph(updatedGraph);
    graphRef.current = updatedGraph;

    setOperation("clear");
    setActiveLine(2);
    setMessage("Graph cleared.");
    recordHistory("Cleared graph");
  };

  const handleRandomGraph = () => {
    const count = Number(randomCount);

    if (!Number.isInteger(count) || count < 2 || count > 12) {
      setMessage("Choose between 2 and 12 vertices.");
      return;
    }

    saveUndo();
    resetTraversal();

    const nodes = Array.from({ length: count }, (_, index) => {
      const angle = (2 * Math.PI * index) / count - Math.PI / 2;

      return {
        id: index + 1,
        value: index + 1,
        x: 250 + 170 * Math.cos(angle),
        y: 165 + 115 * Math.sin(angle),
      };
    });

    const edges: GraphData["edges"] = [];

    for (let i = 0; i < count; i++) {
      const next = (i + 1) % count;

      edges.push({
        source: nodes[i].id,
        target: nodes[next].id,
        weight: 1,
      });

      for (let j = i + 2; j < count; j++) {
        if (Math.random() < 0.2) {
          edges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            weight: 1,
          });
        }
      }
    }

    const updatedGraph: GraphData = { nodes, edges };

    setGraph(updatedGraph);
    graphRef.current = updatedGraph;

    setNextId(count + 1);
    setOperation("add-vertex");
    setMessage(`Generated a random graph with ${count} vertices.`);
    recordHistory(`Generated random graph with ${count} vertices`);
  };

  // Play / Restart only REPLAY the last traversal.
  const handlePlay = () => {
    if (timerRef.current !== null) return;

    // Nothing on screen (for example the graph was edited since the last run):
    // replay the last BFS / DFS from history on the current graph.
    if (traversalRef.current.length === 0) {
      const last = lastRunRef.current;

      if (!last) {
        setMessage("Run BFS or DFS first, then use Play to replay it.");
        return;
      }

      const count = loadTrace(last.type, last.start);

      if (count > 1) startTimer(Number(animationSpeed));

      return;
    }

    const steps = traversalRef.current;

    // replay from the start if the last run already finished
    if (playbackIndexRef.current >= steps.length - 1) {
      showStep(0);
    }

    if (steps.length === 1) return;

    startTimer(Number(animationSpeed));
  };

  const handleRestartPlayback = () => {
    stopPlayback();

    if (traversalRef.current.length === 0) {
      setMessage("Run BFS or DFS first.");
      return;
    }

    showStep(0);
    setMessage("Traversal restarted.");
  };

  const handleSpeedChange = (speed: string) => {
    const wasPlaying = timerRef.current !== null;

    setAnimationSpeed(speed);

    // keep playing at the new speed
    if (wasPlaying) startTimer(Number(speed));
  };

  const handleZoomIn = () => {
    setZoom((current) =>
      Math.min(1.8, Math.round((current + 0.1) * 10) / 10)
    );
  };

  const handleZoomOut = () => {
    setZoom((current) =>
      Math.max(0.5, Math.round((current - 0.1) * 10) / 10)
    );
  };

  const info = CODE_INFO[operation] ?? CODE_INFO["add-vertex"];

  const getNodeById = (id: number) =>
    graph.nodes.find((node) => node.id === id);

  /**
   * Is this edge part of the traversal path shown so far?
   * Only edges actually used to reach a vertex are lit — not every edge that
   * happens to join two visited vertices. "current" = the edge just used.
   */
  const edgeState = (
    sourceId: number,
    targetId: number
  ): "current" | "visited" | null => {
    const sourceNode = getNodeById(sourceId);
    const targetNode = getNodeById(targetId);

    if (!sourceNode || !targetNode || playbackIndex < 0) return null;

    let result: "current" | "visited" | null = null;

    for (let i = 0; i <= playbackIndex && i < traversal.length; i++) {
      const from = tracedFrom[i];

      if (from === null || from === undefined) continue;

      const to = traversal[i];

      const matches =
        (from === sourceNode.value && to === targetNode.value) ||
        (!directed &&
          from === targetNode.value &&
          to === sourceNode.value);

      if (matches) result = i === playbackIndex ? "current" : "visited";
    }

    return result;
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <style>{`
        /* Dark, always-visible scrollbars (sidebar + complexity list) */
        .vis-scroll { scrollbar-width: thin; scrollbar-color: #3f4a4f transparent; }
        .vis-scroll::-webkit-scrollbar { width: 12px; height: 12px; }
        .vis-scroll::-webkit-scrollbar-track { background: transparent; }
        .vis-scroll::-webkit-scrollbar-thumb {
          background: #3f4a4f;
          border-radius: 999px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F6B6D] dark:text-[#FFAB91]">
              Graph Visualizer
            </h1>
            <p className="text-xs text-[#0F6B6D] dark:text-white">
              Build graphs and explore BFS and DFS step by step.
            </p>
          </div>

          <Badge
            variant="outline"
            className="rounded-full border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-50"
          >
            Graph · BFS / DFS
          </Badge>
        </header>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 items-start gap-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* LEFT SIDEBAR */}
          <aside className="vis-scroll min-w-0 space-y-3 lg:sticky lg:top-3 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-scroll lg:pr-1">
            {/* OPERATIONS */}
            <Card className={cardCls}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">
                  Operations
                </CardTitle>
                <CardDescription className="text-xs">
                  Modify your graph
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 p-4 pt-1">
                <div className="space-y-1">
                  <label
                    htmlFor="graph-value"
                    className="text-xs font-medium"
                  >
                    Vertex value
                  </label>

                  <Input
                    id="graph-value"
                    type="number"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleAddVertex();
                    }}
                    placeholder="Enter value"
                    className={inputCls}
                  />
                </div>

                <Button onClick={handleAddVertex} className={opButton}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Vertex
                </Button>

                <Button onClick={handleRemoveVertex} className={opButton}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Remove Vertex
                </Button>

                <Button onClick={handleSearch} className={opButton}>
                  <Search className="mr-1 h-3.5 w-3.5" />
                  Search Vertex
                </Button>

                {/* Edge operations */}
                <div className="space-y-2 border-t border-[#BFD8D8] pt-3">
                  <p className="text-xs font-medium">Edge Operations</p>

                  <Input
                    type="number"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    placeholder="Source vertex"
                    aria-label="Source vertex"
                    className={inputCls}
                  />

                  <Input
                    type="number"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="Target vertex"
                    aria-label="Target vertex"
                    className={inputCls}
                  />

                  <Button onClick={handleAddEdge} className={opButton}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Edge
                  </Button>

                  <Button onClick={handleRemoveEdge} className={opButton}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove Edge
                  </Button>

                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={directed}
                      onChange={(event) => {
                        setDirected(event.target.checked);
                        resetTraversal();
                        setMessage(
                          event.target.checked
                            ? "Directed mode: BFS and DFS follow edges from source to target."
                            : "Undirected mode: edges work in both directions."
                        );
                      }}
                      className="h-3.5 w-3.5 accent-[#0F6B6D]"
                    />
                    Directed graph
                  </label>

                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    The directed toggle changes the arrows and the direction
                    BFS and DFS follow.
                  </p>
                </div>

                {/* Traversal */}
                <div className="space-y-2 border-t border-[#BFD8D8] pt-3">
                  <p className="text-xs font-medium">Graph Traversal</p>

                  <Input
                    type="number"
                    value={startVertex}
                    onChange={(event) => setStartVertex(event.target.value)}
                    placeholder="Start vertex"
                    aria-label="Start vertex"
                    className={inputCls}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => startTraversal("bfs")}
                      className={opButton}
                    >
                      Run BFS
                    </Button>

                    <Button
                      onClick={() => startTraversal("dfs")}
                      className={opButton}
                    >
                      Run DFS
                    </Button>
                  </div>

                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    Enter the start vertex and run. The traversal plays by
                    itself; use the controls above the graph to replay it.
                  </p>
                </div>

                {/* Random graph */}
                <div className="space-y-2 border-t border-[#BFD8D8] pt-3">
                  <p className="text-xs font-medium">Random Graph</p>

                  <Input
                    type="number"
                    min={2}
                    max={12}
                    value={randomCount}
                    onChange={(event) => setRandomCount(event.target.value)}
                    className={inputCls}
                    placeholder="Vertices (2–12)"
                  />

                  <Button onClick={handleRandomGraph} className={opButton}>
                    <Shuffle className="mr-1 h-3.5 w-3.5" />
                    Generate Graph
                  </Button>
                </div>

                <Button onClick={handleClear} className={opButton}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Clear Graph
                </Button>
              </CardContent>
            </Card>

            {/* HISTORY */}
            <Card className={cardCls}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">History</CardTitle>
                  <CardDescription className="text-xs">
                    Recent graph operations
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistory([])}
                  className="h-6 px-2 text-xs text-muted-foreground"
                >
                  Clear
                </Button>
              </CardHeader>

              <CardContent className="p-4 pt-1">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Operations will appear here.
                  </p>
                ) : (
                  <div className="vis-scroll max-h-56 space-y-2 overflow-y-auto pr-1">
                    {history.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="border-l-2 border-red-200 pl-2 text-xs text-muted-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* STATUS */}
            <Alert className="rounded-xl border-red-100 bg-red-50/60">
              <AlertDescription className="text-xs leading-relaxed text-red-900">
                {message}
              </AlertDescription>
            </Alert>
          </aside>

          {/* RIGHT CONTENT */}
          <section className="flex min-w-0 flex-col gap-4">
            {/* VISUALIZATION */}
            <Card className={`${cardCls} min-w-0 overflow-hidden`}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-[#BFD8D8] p-4">
                <div>
                  <CardTitle className="text-base font-medium">
                    Learn, Play and Create
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Watch vertices and edges change as you perform operations.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className={`${zoomButton} w-8`}
                    aria-label="Zoom out"
                  >
                    −
                  </Button>

                  <span className="min-w-12 text-center text-xs text-muted-foreground">
                    {Math.round(zoom * 100)}%
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 1.8}
                    className={`${zoomButton} w-8`}
                    aria-label="Zoom in"
                  >
                    +
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(1)}
                    className={`${zoomButton} px-2 text-xs`}
                  >
                    Reset
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 p-4">
                {/* PLAYBACK CONTROLS (replay of the last traversal) */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BFD8D8] bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePlay}
                      disabled={
                        isPlaying || (traversal.length === 0 && !canReplay)
                      }
                      className={coralButton}
                    >
                      <Play className="h-4 w-4" />
                      Play
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={stopPlayback}
                      disabled={!isPlaying}
                      className={coralButton}
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRestartPlayback}
                      disabled={traversal.length === 0}
                      className={coralButton}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restart
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUndo}
                      disabled={undoStack.length === 0}
                      className={coralButton}
                    >
                      <Undo2 className="h-4 w-4" />
                      Undo
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className={coralButton}
                    >
                      <Redo2 className="h-4 w-4" />
                      Redo
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />

                    <label htmlFor="graph-animation-speed" className="text-sm">
                      Speed
                    </label>

                    <select
                      id="graph-animation-speed"
                      value={animationSpeed}
                      onChange={(event) =>
                        handleSpeedChange(event.target.value)
                      }
                      className="h-9 rounded-lg border border-[#BFD8D8] bg-background px-3 text-sm"
                    >
                      <option value="2000">0.5×</option>
                      <option value="1000">1×</option>
                      <option value="500">2×</option>
                      <option value="200">4×</option>
                    </select>
                  </div>
                </div>

                {/* STATISTICS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Vertices
                    </p>
                    <p className="text-xl font-medium">{graph.nodes.length}</p>
                  </div>

                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Edges
                    </p>
                    <p className="text-xl font-medium">{graph.edges.length}</p>
                  </div>

                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Complexity
                    </p>
                    <p className="truncate text-xl font-medium">
                      {info.complexity}
                    </p>
                  </div>
                </div>

                {/* GRAPH STRUCTURE */}
                <div
                  className={`${innerBox} flex min-w-0 flex-col overflow-hidden bg-card`}
                >
                  <div className="flex items-center justify-between border-b border-[#BFD8D8] px-3 py-2">
                    <span className="text-xs font-medium">Graph Structure</span>

                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px]"
                    >
                      {directed ? "DIRECTED" : "UNDIRECTED"}
                    </Badge>
                  </div>

                  <div className="vis-scroll flex min-h-[360px] items-center justify-center overflow-auto p-3 sm:p-4">
                    {graph.nodes.length === 0 ? (
                      <div className="m-auto py-8 text-center">
                        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 text-2xl text-muted-foreground">
                          ∅
                        </div>

                        <p className="text-sm font-medium">Graph is empty</p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Add a vertex to begin.
                        </p>
                      </div>
                    ) : (
                      <div
                        className="m-auto min-w-0 transition-transform"
                        style={{ zoom }}
                      >
                        <svg
                          viewBox="0 0 500 330"
                          role="img"
                          aria-label="Graph visualization"
                          className="h-auto max-h-[560px] w-full min-w-[300px]"
                        >
                          <defs>
                            {/* arrow for directed mode */}
                            <marker
                              id="graph-arrow"
                              markerWidth="8"
                              markerHeight="8"
                              refX="6"
                              refY="3"
                              orient="auto"
                            >
                              <path
                                d="M0,0 L0,6 L6,3 z"
                                fill="currentColor"
                              />
                            </marker>

                            {/* node body: light, airy gradient */}
                            <radialGradient
                              id="graph-node-fill"
                              cx="35%"
                              cy="30%"
                              r="80%"
                            >
                              <stop offset="0%" stopColor="#FFFFFF" />
                              <stop offset="100%" stopColor="#DCEEEE" />
                            </radialGradient>

                            {/* soft node shadow */}
                            <filter
                              id="graph-shadow"
                              x="-40%"
                              y="-40%"
                              width="180%"
                              height="190%"
                            >
                              <feDropShadow
                                dx="0"
                                dy="2.5"
                                stdDeviation="2.5"
                                floodColor="currentColor"
                                floodOpacity="0.25"
                              />
                            </filter>

                            {/* soft glow for the active node */}
                            <filter
                              id="graph-glow"
                              x="-80%"
                              y="-80%"
                              width="260%"
                              height="260%"
                            >
                              <feGaussianBlur stdDeviation="5" />
                            </filter>
                          </defs>

                          {/* EDGES: gently curved on the outer rim, straight through the middle */}
                          {(() => {
                            const cx =
                              graph.nodes.reduce((sum, n) => sum + n.x, 0) /
                              Math.max(graph.nodes.length, 1);
                            const cy =
                              graph.nodes.reduce((sum, n) => sum + n.y, 0) /
                              Math.max(graph.nodes.length, 1);

                            return graph.edges.map((edge, index) => {
                              const sourceNode = getNodeById(edge.source);
                              const targetNode = getNodeById(edge.target);

                              if (!sourceNode || !targetNode) return null;

                              const state = edgeState(
                                edge.source,
                                edge.target
                              );

                              const dx = targetNode.x - sourceNode.x;
                              const dy = targetNode.y - sourceNode.y;
                              const length = Math.sqrt(dx * dx + dy * dy) || 1;

                              // midpoint and its distance from the graph centre
                              const mx = (sourceNode.x + targetNode.x) / 2;
                              const my = (sourceNode.y + targetNode.y) / 2;
                              const fromCentre = Math.hypot(mx - cx, my - cy);

                              // unit normal, flipped so it points away from the centre
                              let nx = -dy / length;
                              let ny = dx / length;
                              if (nx * (mx - cx) + ny * (my - cy) < 0) {
                                nx = -nx;
                                ny = -ny;
                              }

                              // outer edges bulge outward, central edges stay straight
                              const rim = Math.min(
                                Math.max((fromCentre - 60) / 100, 0),
                                1
                              );
                              const bend = Math.min(length * 0.14, 24) * rim;

                              const qx = mx + nx * bend * 2; // quadratic control point
                              const qy = my + ny * bend * 2;

                              // trim both ends so lines stop at the node edge (radius 23)
                              const sLen =
                                Math.hypot(qx - sourceNode.x, qy - sourceNode.y) ||
                                1;
                              const tLen =
                                Math.hypot(qx - targetNode.x, qy - targetNode.y) ||
                                1;

                              const x1 = sourceNode.x + ((qx - sourceNode.x) / sLen) * 23;
                              const y1 = sourceNode.y + ((qy - sourceNode.y) / sLen) * 23;
                              const x2 = targetNode.x + ((qx - targetNode.x) / tLen) * 23;
                              const y2 = targetNode.y + ((qy - targetNode.y) / tLen) * 23;

                              return (
                                <g key={`${edge.source}-${edge.target}-${index}`}>
                                  <path
                                    d={`M ${x1} ${y1} Q ${qx} ${qy} ${x2} ${y2}`}
                                    fill="none"
                                    stroke={state ? "#dc2626" : "currentColor"}
                                    strokeWidth={
                                      state === "current"
                                        ? 4.5
                                        : state === "visited"
                                          ? 3.2
                                          : 1.8
                                    }
                                    strokeLinecap="round"
                                    opacity={
                                      state === "current"
                                        ? 1
                                        : state === "visited"
                                          ? 0.85
                                          : 0.45
                                    }
                                    markerEnd={
                                      directed ? "url(#graph-arrow)" : undefined
                                    }
                                  />
                                </g>
                              );
                            });
                          })()}

                          {/* NODES */}
                          {graph.nodes.map((node) => {
                            const isActive = activeNode === node.value;
                            const traversalIndex = traversal.indexOf(
                              node.value
                            );

                            const isVisited =
                              traversalIndex !== -1 &&
                              traversalIndex <= playbackIndex;

                            return (
                              <g key={node.id}>
                                {/* soft halo behind the active node */}
                                {isActive && (
                                  <>
                                    <circle
                                      cx={node.x}
                                      cy={node.y}
                                      r={32}
                                      fill="#dc2626"
                                      opacity={0.25}
                                      filter="url(#graph-glow)"
                                    />
                                    <circle
                                      cx={node.x}
                                      cy={node.y}
                                      r={29}
                                      fill="#dc2626"
                                      opacity={0.18}
                                    />
                                  </>
                                )}

                                {/* main body */}
                                <circle
                                  cx={node.x}
                                  cy={node.y}
                                  r={23}
                                  fill={
                                    isActive
                                      ? "#dc2626"
                                      : isVisited
                                        ? "#fee2e2"
                                        : "url(#graph-node-fill)"
                                  }
                                  stroke={
                                    isActive
                                      ? "#b91c1c"
                                      : isVisited
                                        ? "#f87171"
                                        : "#0F6B6D"
                                  }
                                  strokeWidth={isActive ? 3 : 2}
                                  filter="url(#graph-shadow)"
                                />

                                {/* vertex number */}
                                <text
                                  x={node.x}
                                  y={node.y}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fontSize="15"
                                  fontWeight="700"
                                  fill={
                                    isActive
                                      ? "#ffffff"
                                      : isVisited
                                        ? "#7f1d1d"
                                        : "#0F6B6D"
                                  }
                                  style={{
                                    pointerEvents: "none",
                                    userSelect: "none",
                                  }}
                                >
                                  {node.value}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* TRAVERSAL OUTPUT */}
                <div className={`${innerBox} bg-card p-3`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold">
                      Traversal / Operation Output
                    </span>

                    <Badge
                      variant="outline"
                      className="rounded-full font-mono text-[10px]"
                    >
                      {operation === "bfs"
                        ? "BFS"
                        : operation === "dfs"
                          ? "DFS"
                          : info.complexity}
                    </Badge>
                  </div>

                  {traversal.length > 0 ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {traversal.map((nodeValue, index) => (
                          <span
                            key={`${nodeValue}-${index}`}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={`rounded-md px-2 py-1 font-mono text-xs font-medium ${
                                index === playbackIndex
                                  ? "bg-red-600 text-white"
                                  : index < playbackIndex
                                    ? "bg-red-100 text-red-800"
                                    : "border border-[#BFD8D8] bg-background"
                              }`}
                            >
                              {nodeValue}
                            </span>

                            {index < traversal.length - 1 && (
                              <span className="text-xs text-muted-foreground">
                                →
                              </span>
                            )}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-red-600 transition-all duration-300"
                          style={{
                            width: `${
                              ((playbackIndex + 1) / traversal.length) * 100
                            }%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Step {Math.max(playbackIndex + 1, 1)} of{" "}
                        {traversal.length}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PSEUDOCODE + TIME COMPLEXITY */}
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-2">
              {/* PSEUDOCODE */}
              <Card
                className={`${cardCls} flex min-w-0 flex-col overflow-hidden`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium">
                      Pseudocode
                    </CardTitle>

                    <Badge
                      variant="outline"
                      className="max-w-[65%] truncate rounded-full border-[#BFD8D8] text-xs"
                    >
                      {info.title}
                    </Badge>
                  </div>

                  <CardDescription className="text-xs">
                    Follow the selected operation step by step.
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 p-4 pt-1">
                  <div className="vis-scroll max-h-[260px] overflow-auto rounded-xl bg-[#020617] p-4 font-mono text-xs text-slate-100">
                    {info.code.map((line, index) => (
                      <div
                        key={`${operation}-${index}`}
                        className={`flex min-w-max gap-3 rounded px-2 py-1 ${
                          activeLine === index
                            ? "bg-red-500/25 text-red-200 ring-1 ring-red-400/40"
                            : ""
                        }`}
                      >
                        <span className="w-5 shrink-0 select-none text-right text-slate-500">
                          {index + 1}
                        </span>

                        <span
                          className={`whitespace-pre ${
                            line.trim().startsWith("//")
                              ? "italic text-sky-400/70"
                              : ""
                          }`}
                        >
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className={`${innerBox} bg-muted/30 p-4`}>
                    <p className="mb-2 text-xs font-medium">How it works</p>
                    <ol className="list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                      {info.steps.map((step, index) => (
                        <li key={`${operation}-step-${index}`}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* TIME COMPLEXITY */}
              <Card
                className={`${cardCls} flex min-w-0 flex-col overflow-hidden md:max-h-[560px]`}
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Time Complexity
                  </CardTitle>

                  <CardDescription className="text-xs">
                    Performance of graph operations and algorithms
                  </CardDescription>
                </CardHeader>

                <CardContent className="vis-scroll flex-1 overflow-y-scroll p-4 pt-1">
                  <div className="space-y-3">
                    {complexityRows.map((item) => {
                      const isActive = item.key === operation;

                      return (
                        <div
                          key={item.key}
                          className={`rounded-lg border p-3 transition-colors ${
                            isActive
                              ? "border-red-300 bg-red-50/70 dark:border-[#FFAB91]/60 dark:bg-[#FFAB91]/10"
                              : "bg-card"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium">{item.title}</p>

                            <Badge
                               className={`font-mono text-[10px] ${
                                isActive
                                  ? "border-red-300 text-[#FBB917] dark:border-[#FFAB91] dark:text-[#000000]"
                                  : ""
                              }`}
                            >
                              {item.time}
                            </Badge>
                          </div>

                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {CODE_INFO[item.key].description}
                          </p>
                        </div>
                      );
                    })}

                    <div className={`${innerBox} bg-muted/30 p-4`}>
                      <p className="text-xs font-medium">Space Complexity</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        An adjacency-list graph requires O(V + E) space, where
                        V is the number of vertices and E is the number of
                        edges. BFS and DFS use up to O(V) additional space for
                        visited vertices and traversal data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}