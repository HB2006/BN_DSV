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
  GitBranch,
  ArrowRight,
  Gauge,
} from "lucide-react";

import type { GraphData, GraphOperation } from "./type";
import {
  addVertex,
  removeVertex,
  addEdge,
  removeEdge,
  searchVertex,
  bfs,
  dfs,
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
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

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
  code: string[];
  complexity: string;
};

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

const primaryButton =
  "bg-[#D8A7B1] text-[#4D3039] hover:bg-[#C9919D] dark:bg-[#D8A7B1] dark:hover:bg-[#E2BAC2]";

const cloneGraph = (graph: GraphData): GraphData => ({
  nodes: graph.nodes.map((node) => ({ ...node })),
  edges: graph.edges.map((edge) => ({ ...edge })),
});

export default function GraphVisualizer() {
  const [graph, setGraph] = useState<GraphData>(() =>
    cloneGraph(INITIAL_GRAPH)
  );

  const [value, setValue] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [nextId, setNextId] = useState(6);
  const [operation, setOperation] =
    useState<GraphOperation>("add-vertex");

  const [activeLine, setActiveLine] = useState(-1);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [traversal, setTraversal] = useState<number[]>([]);
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
  const playbackIndexRef = useRef(playbackIndex);

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
    setUndoStack((previous) => [
      ...previous,
      {
        graph: cloneGraph(graphRef.current),
        activeNode,
        activeLine,
        traversal: [...traversalRef.current],
        message,
      },
    ]);
    setRedoStack([]);
  }, [activeLine, activeNode, message]);

  const restoreSnapshot = useCallback((snapshot: GraphSnapshot) => {
    const restoredGraph = cloneGraph(snapshot.graph);

    setGraph(restoredGraph);
    graphRef.current = restoredGraph;

    setActiveNode(snapshot.activeNode);
    setActiveLine(snapshot.activeLine);
    setTraversal([...snapshot.traversal]);
    traversalRef.current = [...snapshot.traversal];
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

    const angle = (nextId * 2 * Math.PI) / Math.max(nextId, 6);
    const x = 250 + 170 * Math.cos(angle);
    const y = 165 + 115 * Math.sin(angle);

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

  const startTraversal = (type: "bfs" | "dfs") => {
    const startValue = Number(value);

    if (value.trim() === "" || !Number.isFinite(startValue)) {
      setMessage("Enter a starting vertex value.");
      return;
    }

    const startNode = graph.nodes.find(
      (node) => node.value === startValue
    );

    if (!startNode) {
      setMessage(`Starting vertex ${startValue} does not exist.`);
      return;
    }

    stopPlayback();

    setOperation(type);
    setActiveNode(null);
    setActiveLine(0);
    setTraversal([]);
    traversalRef.current = [];
    setPlaybackIndex(-1);
    playbackIndexRef.current = -1;

    const result =
      type === "bfs" ? bfs(graph, startValue) : dfs(graph, startValue);

    const validResult = result.filter((nodeValue) =>
      graph.nodes.some((node) => node.value === nodeValue)
    );

    if (validResult.length === 0) {
      setMessage("No traversal steps were generated.");
      return;
    }

    setTraversal(validResult);
    traversalRef.current = validResult;

    setPlaybackIndex(0);
    playbackIndexRef.current = 0;

    setActiveNode(validResult[0]);
    setActiveLine(type === "bfs" ? 4 : 2);
    setMessage(`${type.toUpperCase()} traversal started from vertex ${startValue}.`);

    recordHistory(`${type.toUpperCase()} traversal from ${startValue}`);
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

  const stepForward = useCallback(() => {
    const steps = traversalRef.current;
    const current = playbackIndexRef.current;

    if (steps.length === 0 || current >= steps.length - 1) {
      stopPlayback();
      return;
    }

    const next = current + 1;

    playbackIndexRef.current = next;
    setPlaybackIndex(next);
    setActiveNode(steps[next]);
    setActiveLine(operation === "bfs" ? 4 : 2);
    setMessage(`Visiting vertex ${steps[next]} (${next + 1}/${steps.length}).`);

    if (next >= steps.length - 1) {
      stopPlayback();
      setMessage(`Traversal complete: ${steps.join(" → ")}.`);
    }
  }, [operation, stopPlayback]);

  const stepBackward = () => {
    stopPlayback();

    const steps = traversalRef.current;
    const current = playbackIndexRef.current;

    if (steps.length === 0 || current <= 0) {
      setMessage("Already at the first traversal step.");
      return;
    }

    const previous = current - 1;

    playbackIndexRef.current = previous;
    setPlaybackIndex(previous);
    setActiveNode(steps[previous]);
    setActiveLine(operation === "bfs" ? 4 : 2);
    setMessage(`Returned to vertex ${steps[previous]}.`);
  };

  const handlePlay = () => {
    if (traversalRef.current.length === 0) {
      setMessage("Run BFS or DFS first to create traversal steps.");
      return;
    }

    if (playbackIndexRef.current >= traversalRef.current.length - 1) {
      playbackIndexRef.current = 0;
      setPlaybackIndex(0);
      setActiveNode(traversalRef.current[0]);
    }

    stopPlayback();
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      const steps = traversalRef.current;
      const current = playbackIndexRef.current;

      if (current >= steps.length - 1) {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setIsPlaying(false);
        setMessage(`Traversal complete: ${steps.join(" → ")}.`);
        return;
      }

      const next = current + 1;

      playbackIndexRef.current = next;
      setPlaybackIndex(next);
      setActiveNode(steps[next]);
      setActiveLine(operation === "bfs" ? 4 : 2);
      setMessage(`Visiting vertex ${steps[next]} (${next + 1}/${steps.length}).`);

      if (next >= steps.length - 1) {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setIsPlaying(false);
        setMessage(`Traversal complete: ${steps.join(" → ")}.`);
      }
    }, Number(animationSpeed));
  };

  const handleRestartPlayback = () => {
    stopPlayback();

    if (traversalRef.current.length === 0) {
      setMessage("Run BFS or DFS first.");
      return;
    }

    playbackIndexRef.current = 0;
    setPlaybackIndex(0);
    setActiveNode(traversalRef.current[0]);
    setActiveLine(operation === "bfs" ? 4 : 2);
    setMessage("Traversal restarted.");
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

  const edgeIsHighlighted = (sourceId: number, targetId: number) => {
    const sourceNode = getNodeById(sourceId);
    const targetNode = getNodeById(targetId);

    if (!sourceNode || !targetNode) return false;

    const sourceVisited = traversal.indexOf(sourceNode.value);
    const targetVisited = traversal.indexOf(targetNode.value);

    return (
      sourceVisited >= 0 &&
      targetVisited >= 0 &&
      sourceVisited <= playbackIndex &&
      targetVisited <= playbackIndex
    );
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Graph Visualizer
          </h1>
          <p className="text-sm text-muted-foreground">
            Build graphs and explore BFS and DFS step by step.
          </p>
        </div>

        <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          Graph · BFS / DFS
        </Badge>
      </header>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 items-start gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* LEFT SIDEBAR */}
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-3 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto lg:pr-1">
          {/* OPERATIONS */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Operations</CardTitle>
              <CardDescription className="text-xs">
                Modify your graph
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 p-3 pt-1">
              <div className="space-y-1">
                <label htmlFor="graph-value" className="text-xs font-medium">
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
                  className="h-8 text-sm"
                />
              </div>

              <Button
                onClick={handleAddVertex}
                className={`h-8 w-full text-xs ${primaryButton}`}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Vertex
              </Button>

              <Button
                variant="outline"
                onClick={handleRemoveVertex}
                className="h-8 w-full text-xs"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Remove Vertex
              </Button>

              <Button
                variant="outline"
                onClick={handleSearch}
                className="h-8 w-full text-xs"
              >
                <Search className="mr-1 h-3.5 w-3.5" />
                Search Vertex
              </Button>

              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold">Edge Operations</p>

                <Input
                  type="number"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="Source vertex"
                  className="h-8 text-sm"
                />

                <Input
                  type="number"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder="Target vertex"
                  className="h-8 text-sm"
                />

                <Button
                  onClick={handleAddEdge}
                  className={`h-8 w-full text-xs ${primaryButton}`}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Edge
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRemoveEdge}
                  className="h-8 w-full text-xs"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Remove Edge
                </Button>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={directed}
                    onChange={(event) => setDirected(event.target.checked)}
                    className="h-3.5 w-3.5"
                  />
                  Directed graph
                </label>

                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Direction changes the displayed arrows. Traversal follows
                  the behavior implemented in graph-operation.
                </p>
              </div>

              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold">Graph Traversal</p>
                <p className="text-[10px] text-muted-foreground">
                  Enter the starting vertex above.
                </p>

                <Button
                  onClick={() => startTraversal("bfs")}
                  className={`h-8 w-full text-xs ${primaryButton}`}
                >
                  Run BFS
                </Button>

                <Button
                  variant="outline"
                  onClick={() => startTraversal("dfs")}
                  className="h-8 w-full text-xs"
                >
                  Run DFS
                </Button>
              </div>

              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold">Random Graph</p>

                <Input
                  type="number"
                  min={2}
                  max={12}
                  value={randomCount}
                  onChange={(event) => setRandomCount(event.target.value)}
                  className="h-8 text-sm"
                  placeholder="Vertices (2–12)"
                />

                <Button
                  variant="outline"
                  onClick={handleRandomGraph}
                  className="h-8 w-full text-xs"
                >
                  <Shuffle className="mr-1 h-3.5 w-3.5" />
                  Generate Graph
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleClear}
                className="h-8 w-full border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Clear Graph
              </Button>
            </CardContent>
          </Card>

          {/* UNDO / REDO */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Undo / Redo</CardTitle>
              <CardDescription className="text-xs">
                Restore a previous graph state
              </CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-2 p-3 pt-1">
              <Button
                variant="outline"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="h-8 text-xs"
              >
                <Undo2 className="mr-1 h-3.5 w-3.5" />
                Undo
              </Button>

              <Button
                variant="outline"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="h-8 text-xs"
              >
                <Redo2 className="mr-1 h-3.5 w-3.5" />
                Redo
              </Button>
            </CardContent>
          </Card>

          {/* HISTORY */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
              <div>
                <CardTitle className="text-sm">History</CardTitle>
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

            <CardContent className="p-3 pt-1">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Operations will appear here.
                </p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
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
          <Alert className="border-red-100 bg-red-50/60">
            <AlertDescription className="text-xs leading-relaxed text-red-900">
              {message}
            </AlertDescription>
          </Alert>
        </aside>

        {/* RIGHT CONTENT */}
        <section className="flex min-w-0 flex-col gap-3">
          {/* VISUALIZATION PLAYGROUND */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b p-3 sm:p-4">
              <div>
                <CardTitle className="text-base">
                  Visualization Playground
                </CardTitle>
                <CardDescription className="text-xs">
                  Watch vertices and edges change as you perform operations.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="h-8 w-8 px-0"
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
                  className="h-8 w-8 px-0"
                  aria-label="Zoom in"
                >
                  +
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(1)}
                  className="h-8 px-2 text-xs"
                >
                  Reset
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
              {/* PLAYBACK CONTROLS */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={isPlaying ? stopPlayback : handlePlay}
                    disabled={traversal.length === 0}
                    className={`h-8 gap-2 text-xs ${primaryButton}`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        Play
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={stepBackward}
                    disabled={traversal.length === 0 || playbackIndex <= 0}
                    className="h-8 gap-1 text-xs"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Previous
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={stepForward}
                    disabled={
                      traversal.length === 0 ||
                      playbackIndex >= traversal.length - 1
                    }
                    className="h-8 gap-1 text-xs"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Next
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRestartPlayback}
                    disabled={traversal.length === 0}
                    className="h-8 gap-1 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <label
                    htmlFor="graph-animation-speed"
                    className="text-xs"
                  >
                    Speed
                  </label>

                  <select
                    id="graph-animation-speed"
                    value={animationSpeed}
                    onChange={(event) => {
                      const wasPlaying = isPlaying;
                      stopPlayback();
                      setAnimationSpeed(event.target.value);

                      if (wasPlaying) {
                        // The user can resume using Play.
                        setMessage("Speed updated. Press Play to resume.");
                      }
                    }}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="2000">0.5×</option>
                    <option value="1000">1×</option>
                    <option value="500">2×</option>
                    <option value="200">4×</option>
                  </select>
                </div>
              </div>

              {/* STATISTICS */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Vertices
                  </p>
                  <p className="text-lg font-semibold">
                    {graph.nodes.length}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Edges
                  </p>
                  <p className="text-lg font-semibold">
                    {graph.edges.length}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Complexity
                  </p>
                  <p className="truncate text-lg font-semibold">
                    {info.complexity}
                  </p>
                </div>
              </div>

              {/* GRAPH STRUCTURE */}
              <div className="flex flex-col overflow-hidden rounded-lg border bg-muted/10">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-medium">
                    Graph Structure
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {directed ? "DIRECTED" : "UNDIRECTED"}
                  </Badge>
                </div>

                <div className="flex min-h-[360px] items-center justify-center overflow-auto p-3 sm:p-4">
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
                        </defs>

                        {graph.edges.map((edge, index) => {
                          const sourceNode = getNodeById(edge.source);
                          const targetNode = getNodeById(edge.target);

                          if (!sourceNode || !targetNode) return null;

                          const highlighted = edgeIsHighlighted(
                            edge.source,
                            edge.target
                          );

                          const dx = targetNode.x - sourceNode.x;
                          const dy = targetNode.y - sourceNode.y;
                          const length = Math.sqrt(dx * dx + dy * dy) || 1;
                          const offsetX = (dx / length) * 23;
                          const offsetY = (dy / length) * 23;

                          const x1 = sourceNode.x + offsetX;
                          const y1 = sourceNode.y + offsetY;
                          const x2 = targetNode.x - offsetX;
                          const y2 = targetNode.y - offsetY;

                          return (
                            <g key={`${edge.source}-${edge.target}-${index}`}>
                              <line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={
                                  highlighted ? "#16a34a" : "currentColor"
                                }
                                strokeWidth={highlighted ? 3.5 : 1.8}
                                opacity={highlighted ? 1 : 0.45}
                                markerEnd={
                                  directed ? "url(#graph-arrow)" : undefined
                                }
                              />

                              {edge.weight !== undefined && (
                                <text
                                  x={(x1 + x2) / 2}
                                  y={(y1 + y2) / 2 - 6}
                                  textAnchor="middle"
                                  className="fill-muted-foreground text-[11px]"
                                >
                                  {edge.weight}
                                </text>
                              )}
                            </g>
                          );
                        })}

                        {graph.nodes.map((node) => {
                          const isActive = activeNode === node.value;
                          const traversalIndex = traversal.indexOf(node.value);
                          const isVisited =
                            traversalIndex !== -1 &&
                            traversalIndex <= playbackIndex;

                          return (
                            <g key={node.id}>
                              {isActive && (
                                <circle
                                  cx={node.x}
                                  cy={node.y}
                                  r={29}
                                  fill="#16a34a"
                                  opacity={0.15}
                                />
                              )}

                              <circle
                                cx={node.x}
                                cy={node.y}
                                r={23}
                                fill={
                                  isActive
                                    ? "#16a34a"
                                    : isVisited
                                      ? "#86efac"
                                      : "var(--background)"
                                }
                                stroke={
                                  isActive
                                    ? "#15803d"
                                    : isVisited
                                      ? "#16a34a"
                                      : "currentColor"
                                }
                                strokeWidth={isActive ? 3.5 : 1.8}
                              />

                              <text
                                x={node.x}
                                y={node.y + 5}
                                textAnchor="middle"
                                fontSize="14"
                                fontWeight="600"
                                fill={
                                  isActive
                                    ? "#ffffff"
                                    : isVisited
                                      ? "#14532d"
                                      : "currentColor"
                                }
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
              <div className="rounded-lg border bg-muted/10 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    Traversal Output
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {operation === "bfs"
                      ? "BFS"
                      : operation === "dfs"
                        ? "DFS"
                        : "Graph"}
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
                                  : "border bg-background"
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
                        className="h-full rounded-full bg-[#D8A7B1] transition-all duration-300"
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
                    Run BFS or DFS to display the traversal sequence.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PSEUDOCODE + TIME COMPLEXITY */}
          <div className="grid min-w-0 grid-cols-1 items-start gap-3 md:grid-cols-2">
            {/* PSEUDOCODE */}
            <Card className="flex min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm">Pseudocode</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {info.title}
                  </Badge>
                </div>

                <CardDescription className="text-xs">
                  Follow the selected operation step by step.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 p-3 pt-1 sm:p-4 sm:pt-1">
                <div className="max-h-[260px] overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100">
                  {info.code.map((line, index) => (
                    <div
                      key={`${operation}-${index}`}
                      className={`flex min-w-max gap-3 rounded px-2 py-1 ${
                        activeLine === index
                          ? "bg-[#D8A7B1]/25 text-[#F2DCE1] ring-1 ring-[#D8A7B1]/50"
                          : ""
                      }`}
                    >
                      <span className="w-5 shrink-0 select-none text-right text-slate-500">
                        {index + 1}
                      </span>

                      <span
                        className={
                          line.trim().startsWith("//")
                            ? "text-slate-500 italic"
                            : ""
                        }
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-semibold">
                    How it works
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {info.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* TIME COMPLEXITY */}
            <Card className="flex min-w-0 flex-col overflow-hidden md:max-h-[560px]">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm">Time Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Performance of graph operations and algorithms.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto p-3 pt-1 sm:p-4 sm:pt-1">
                <div className="space-y-2">
                  {complexityRows.map((item) => {
                    const isActive = item.key === operation;

                    return (
                      <div
                        key={item.key}
                        className={`rounded-lg border p-3 transition-colors ${
                          isActive
                            ? "border-red-300 bg-red-50/70"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            {item.title}
                          </p>

                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] ${
                              isActive
                                ? "border-red-300 text-red-700"
                                : ""
                            }`}
                          >
                            {item.time}
                          </Badge>
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {CODE_INFO[item.key].description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-semibold">Space Complexity</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    An adjacency-list graph requires O(V + E) space, where V
                    is the number of vertices and E is the number of edges.
                    BFS and DFS use up to O(V) additional space for visited
                    vertices and traversal data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}