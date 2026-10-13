"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Undo2, Redo2, Gauge } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

type CodeInfo = {
  title: string;
  lines: string[];
  explanation: string[];
  complexity: string;
};

type HistoryEntry = {
  id: number;
  text: string;
  op: GraphOperation;
  before: GraphData;
  after: GraphData;
  activeId: number | null;
  traversal: number[] | null;
  path?: number[] | null; // vertex ids in visit order (BFS / DFS only)
  line: number | null;
};

type HistoryMeta = Omit<HistoryEntry, "id" | "text">;

type Step = { line: number | null; run: () => void };

const pseudocode: Record<GraphOperation, CodeInfo> = {
  "add-vertex": {
    title: "Add Vertex",
    lines: [
      "newVertex = Vertex(value)",
      "if value already exists:",
      "    return error",
      "add newVertex to vertices",
      "return graph",
    ],
    explanation: [
      "Create a new vertex with the given value.",
      "Check whether a vertex with that value already exists.",
      "Stop if a duplicate is found.",
      "Add the vertex to the graph.",
      "Return the updated graph.",
    ],
    complexity: "O(V)",
  },

  "remove-vertex": {
    title: "Remove Vertex",
    lines: [
      "find vertex with value",
      "if vertex does not exist:",
      "    return error",
      "remove vertex",
      "remove all incident edges",
      "return graph",
    ],
    explanation: [
      "Find the vertex to remove.",
      "Check whether it exists.",
      "Stop if the vertex is absent.",
      "Remove the vertex from the graph.",
      "Remove every edge connected to that vertex.",
    ],
    complexity: "O(V + E)",
  },

  "add-edge": {
    title: "Add Edge",
    lines: [
      "find source vertex",
      "find target vertex",
      "if either vertex is missing:",
      "    return error",
      "if edge already exists:",
      "    return error",
      "add edge(source, target)",
      "return graph",
    ],
    explanation: [
      "Find the source vertex.",
      "Find the target vertex.",
      "Verify that both vertices exist.",
      "Stop if either vertex is missing.",
      "Prevent duplicate edges.",
      "Connect the two vertices.",
    ],
    complexity: "O(V + E)",
  },

  "remove-edge": {
    title: "Remove Edge",
    lines: [
      "find source and target",
      "find edge between them",
      "if edge does not exist:",
      "    return error",
      "remove edge",
      "return graph",
    ],
    explanation: [
      "Find both endpoint vertices.",
      "Check whether the edge exists.",
      "Stop if the edge is absent.",
      "Remove the edge from the graph.",
      "Return the updated graph.",
    ],
    complexity: "O(V + E)",
  },

  search: {
    title: "Search Vertex",
    lines: [
      "for each vertex in graph:",
      "    if vertex.value == target:",
      "        return vertex",
      "return not found",
    ],
    explanation: [
      "Start checking the vertices.",
      "Compare each vertex value with the target.",
      "Return the matching vertex.",
      "If no match exists, report that it was not found.",
    ],
    complexity: "O(V)",
  },

  bfs: {
    title: "Breadth-First Search",
    lines: [
      "create empty queue",
      "mark start as visited",
      "enqueue start",
      "while queue is not empty:",
      "    vertex = dequeue",
      "    visit(vertex)",
      "    for each unvisited neighbor:",
      "        mark neighbor visited",
      "        enqueue neighbor",
    ],
    explanation: [
      "Create a queue and mark the starting vertex visited.",
      "Add the starting vertex to the queue.",
      "Remove the next vertex from the front.",
      "Visit the removed vertex.",
      "Find its unvisited neighbors.",
      "Mark and enqueue each neighbor.",
      "Continue until the queue is empty.",
    ],
    complexity: "O(V + E)",
  },

  dfs: {
    title: "Depth-First Search",
    lines: [
      "DFS(vertex):",
      "    if vertex is visited:",
      "        return",
      "    mark vertex visited",
      "    visit(vertex)",
      "    for each neighbor:",
      "        DFS(neighbor)",
    ],
    explanation: [
      "Begin at the selected starting vertex.",
      "Stop if the vertex has already been visited.",
      "Mark the current vertex as visited.",
      "Add the vertex to the traversal output.",
      "Explore each unvisited neighbor recursively.",
      "Backtrack when no unvisited neighbors remain.",
    ],
    complexity: "O(V + E)",
  },

  clear: {
    title: "Clear Graph",
    lines: [
      "vertices = []",
      "edges = []",
      "return empty graph",
    ],
    explanation: [
      "Remove all vertices.",
      "Remove all edges.",
      "Return an empty graph.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows = [
  {
    operation: "Add Vertex",
    time: "O(V)",
    why: "Checks for a duplicate value.",
  },
  {
    operation: "Remove Vertex",
    time: "O(V + E)",
    why: "Finds the vertex and removes connected edges.",
  },
  {
    operation: "Add Edge",
    time: "O(V + E)",
    why: "Finds both vertices and checks existing edges.",
  },
  {
    operation: "Remove Edge",
    time: "O(V + E)",
    why: "Finds endpoints and removes the edge.",
  },
  {
    operation: "Search",
    time: "O(V)",
    why: "May inspect every vertex.",
  },
  {
    operation: "BFS",
    time: "O(V + E)",
    why: "Visits reachable vertices and edges.",
  },
  {
    operation: "DFS",
    time: "O(V + E)",
    why: "Visits reachable vertices and edges.",
  },
];

const primaryButton =
  "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500";

const secondaryButton =
  "h-7 w-full justify-start border border-border bg-card px-2 text-xs text-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300";

const WIDTH = 700;
const HEIGHT = 400;
const NODE_RADIUS = 23;
const MAX_HISTORY = 50;

// Pseudocode line that is highlighted each time a vertex is visited.
const VISIT_LINE = { bfs: 5, dfs: 4 } as const;

const initialGraph: GraphData = {
  nodes: [
    { id: 1, value: 1, x: 140, y: 100 },
    { id: 2, value: 2, x: 350, y: 75 },
    { id: 3, value: 3, x: 560, y: 120 },
    { id: 4, value: 4, x: 230, y: 290 },
    { id: 5, value: 5, x: 480, y: 290 },
  ],
  edges: [
    { source: 1, target: 2 },
    { source: 2, target: 3 },
    { source: 1, target: 4 },
    { source: 2, target: 4 },
    { source: 2, target: 5 },
    { source: 3, target: 5 },
    { source: 4, target: 5 },
  ],
};

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

// The edges the traversal actually used to discover each vertex.
// BFS: discovered by the earliest-visited neighbor.
// DFS: discovered by the most recently visited neighbor (the current stack top).
function traversalTreeEdges(
  graph: GraphData,
  ids: number[],
  order: "bfs" | "dfs"
): Set<string> {
  const keys = new Set<string>();
  const adjacent = (a: number, b: number) =>
    graph.edges.some(
      (e) =>
        (e.source === a && e.target === b) ||
        (e.source === b && e.target === a)
    );

  for (let i = 1; i < ids.length; i++) {
    const candidates = ids.slice(0, i).filter((u) => adjacent(u, ids[i]));
    if (candidates.length === 0) continue;
    const parent =
      order === "bfs" ? candidates[0] : candidates[candidates.length - 1];
    keys.add(edgeKey(parent, ids[i]));
  }

  return keys;
}

export function GraphVisualizer() {
  const [graph, setGraph] = useState<GraphData>(initialGraph);
  const [value, setValue] = useState("6");
  const [source, setSource] = useState("1");
  const [target, setTarget] = useState("3");
  const [nextId, setNextId] = useState(6);
  const [operation, setOperation] =
    useState<GraphOperation>("bfs");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [visitedIds, setVisitedIds] = useState<number[]>([]);
  const [message, setMessage] = useState(
    "Choose an operation to get started."
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [replayEntryId, setReplayEntryId] = useState<number | null>(null);
  const [randomCount, setRandomCount] = useState("7");
  const [directed, setDirected] = useState(false);

  // Playback + undo/redo state
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1");
  const [undoStack, setUndoStack] = useState<GraphData[]>([]);
  const [redoStack, setRedoStack] = useState<GraphData[]>([]);

  const selectedCode = pseudocode[operation];

  // Latest-value refs so timer callbacks never see stale state
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const nextIdRef = useRef(nextId);
  nextIdRef.current = nextId;
  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;

  // Replay machinery
  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const traverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<Step[] | null>(null);
  const frameIndexRef = useRef(0);
  const replayOriginalRef = useRef<GraphData | null>(null);
  const historyIdRef = useRef(1);

  // New-vertex animation tracking
  const [newIds, setNewIds] = useState<number[]>([]);
  const prevIdsRef = useRef<Set<number>>(
    new Set(initialGraph.nodes.map((n) => n.id))
  );

  const treeEdges = useMemo(
    () =>
      traversalTreeEdges(
        graph,
        visitedIds,
        operation === "dfs" ? "dfs" : "bfs"
      ),
    [graph, visitedIds, operation]
  );

  // Detect any vertex that appeared (add, redo, undo of remove, generate, replay)
  useEffect(() => {
    const prev = prevIdsRef.current;
    const ids = graph.nodes.map((n) => n.id);
    const added = ids.filter((id) => !prev.has(id));
    prevIdsRef.current = new Set(ids);

    if (added.length === 0) {
      setNewIds([]);
      return;
    }
    setNewIds(added);
    const t = setTimeout(() => setNewIds([]), 1600);
    return () => clearTimeout(t);
  }, [graph]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (playbackTimer.current !== null) {
        clearTimeout(playbackTimer.current);
      }
      if (traverseTimer.current !== null) {
        clearTimeout(traverseTimer.current);
      }
    };
  }, []);

  function stopTraversalAnim() {
    if (traverseTimer.current !== null) {
      clearTimeout(traverseTimer.current);
      traverseTimer.current = null;
    }
  }

  function record(text: string, meta?: HistoryMeta) {
    if (meta) {
      const entry: HistoryEntry = {
        id: historyIdRef.current++,
        text,
        ...meta,
      };
      setHistory((old) => [entry, ...old].slice(0, MAX_HISTORY));
    }
    setMessage(text);
  }

  function updateGraph(nextGraph: GraphData) {
    const current = graphRef.current;
    setUndoStack((old) => [...old, current]);
    setRedoStack([]);
    graphRef.current = nextGraph;
    setGraph(nextGraph);
    setActiveNode(null);
    setTraversal(null);
    setVisitedIds([]);
  }

  /* ---------- HISTORY REPLAY ---------- */

  // Stops any replay / traversal animation and puts the real graph back
  function abortReplay() {
    stopTraversalAnim();
    setVisitedIds([]);
    if (playbackTimer.current !== null) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
    setIsPlaying(false);
    if (replayOriginalRef.current) {
      const original = replayOriginalRef.current;
      replayOriginalRef.current = null;
      graphRef.current = original;
      setGraph(original);
    }
    framesRef.current = null;
    frameIndexRef.current = 0;
    setReplayEntryId(null);
    setActiveNode(null);
    setActiveLine(null);
  }

  function runFrames() {
    const tick = () => {
      const frames = framesRef.current;
      if (!frames) return;
      const i = frameIndexRef.current;
      if (i >= frames.length) {
        playbackTimer.current = null;
        framesRef.current = null;
        frameIndexRef.current = 0;
        setIsPlaying(false);
        return;
      }
      frameIndexRef.current = i + 1;
      setActiveLine(frames[i].line);
      frames[i].run();
      playbackTimer.current = setTimeout(
        tick,
        1000 / Number(speedRef.current)
      );
    };
    tick();
  }

  function handlePause() {
    if (playbackTimer.current !== null) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
    setIsPlaying(false);
  }

  function handlePlay() {
    if (isPlaying) return;

    // Resume a paused replay
    if (
      framesRef.current &&
      frameIndexRef.current < framesRef.current.length
    ) {
      setIsPlaying(true);
      runFrames();
      return;
    }

    if (history.length === 0) {
      setMessage(
        "No history to replay yet. Run a few operations, then press Play."
      );
      return;
    }

    stopTraversalAnim();
    setVisitedIds([]);
    const entries = history.slice().reverse(); // oldest first
    const original = graphRef.current;
    replayOriginalRef.current = original;

    const frames: Step[] = [];

    // 1. Rewind to the state before the first recorded operation
    frames.push({
      line: null,
      run: () => {
        const start = entries[0].before;
        graphRef.current = start;
        setGraph(start);
        setActiveNode(null);
        setTraversal(null);
        setVisitedIds([]);
        setReplayEntryId(null);
        setMessage("Replay started from the initial state.");
      },
    });

    // 2. Two frames per recorded operation: announce, then apply
    entries.forEach((entry) => {
      const title = pseudocode[entry.op].title;
      frames.push({
        line: 0,
        run: () => {
          setOperation(entry.op);
          setReplayEntryId(entry.id);
          setTraversal(null);
          setVisitedIds([]);
          setActiveNode(entry.op === "remove-vertex" ? entry.activeId : null);
          setMessage(`Replaying: ${title}`);
        },
      });
      frames.push({
        line: entry.line,
        run: () => {
          graphRef.current = entry.after;
          setGraph(entry.after);
          setActiveNode(entry.op === "remove-vertex" ? null : entry.activeId);
          setTraversal(entry.traversal);
          setVisitedIds(entry.path ?? []);
          setMessage(entry.text);
        },
      });
    });

    // 3. Put the real graph back (matters if you used Undo/Redo earlier)
    frames.push({
      line: null,
      run: () => {
        graphRef.current = original;
        setGraph(original);
        replayOriginalRef.current = null;
        setReplayEntryId(null);
        setActiveNode(null);
        setMessage("Replay finished.");
      },
    });

    framesRef.current = frames;
    frameIndexRef.current = 0;
    setIsPlaying(true);
    runFrames();
  }

  /* ---------- UNDO / REDO ---------- */

  function handleUndo() {
    abortReplay();
    if (undoStack.length === 0) return;
    const current = graphRef.current;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((old) => [...old, current]);
    setUndoStack((old) => old.slice(0, -1));
    graphRef.current = previous;
    setGraph(previous);
    setTraversal(null);
    setMessage("Undo successful.");
  }

  function handleRedo() {
    abortReplay();
    if (redoStack.length === 0) return;
    const current = graphRef.current;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((old) => [...old, current]);
    setRedoStack((old) => old.slice(0, -1));
    graphRef.current = next;
    setGraph(next);
    setTraversal(null);
    setMessage("Redo successful.");
  }

  /* ---------- OPERATIONS ---------- */

  function readValue(): number | null {
    if (value.trim() === "" || !Number.isFinite(Number(value))) {
      setMessage("Enter a valid vertex value first.");
      return null;
    }

    return Number(value);
  }

  function readEndpoints(): [number, number] | null {
    if (
      source.trim() === "" ||
      target.trim() === "" ||
      !Number.isFinite(Number(source)) ||
      !Number.isFinite(Number(target))
    ) {
      setMessage("Enter valid source and target values.");
      return null;
    }

    return [Number(source), Number(target)];
  }

  function handleAddVertex() {
    const n = readValue();
    if (n === null) return;

    abortReplay();
    const before = graphRef.current;
    const id = nextIdRef.current;

    try {
      const angle = before.nodes.length * 2.399963;
      const radius = 125;
      const x = Math.max(
        40,
        Math.min(WIDTH - 40, WIDTH / 2 + Math.cos(angle) * radius)
      );
      const y = Math.max(
        40,
        Math.min(HEIGHT - 40, HEIGHT / 2 + Math.sin(angle) * radius)
      );

      const updated = addVertex(before, n, id, x, y);

      setOperation("add-vertex");
      setActiveLine(3);
      updateGraph(updated);
      setActiveNode(id);
      nextIdRef.current = id + 1;
      setNextId(id + 1);

      record(`Added vertex ${n}.`, {
        op: "add-vertex",
        before,
        after: updated,
        activeId: id,
        traversal: null,
        line: 3,
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add vertex."
      );
    }
  }

  function handleRemoveVertex() {
    const n = readValue();
    if (n === null) return;

    abortReplay();
    const before = graphRef.current;

    try {
      const node = before.nodes.find((item) => item.value === n);
      const updated = removeVertex(before, n);

      setOperation("remove-vertex");
      setActiveLine(4);
      updateGraph(updated);

      record(`Removed vertex ${n} and its connected edges.`, {
        op: "remove-vertex",
        before,
        after: updated,
        activeId: node?.id ?? null,
        traversal: null,
        line: 4,
      });
      setSource((old) => (Number(old) === n ? "" : old));
      setTarget((old) => (Number(old) === n ? "" : old));
    } catch (error) {
      setOperation("remove-vertex");
      setActiveLine(1);
      setMessage(
        error instanceof Error ? error.message : "Could not remove vertex."
      );
    }
  }

  function handleAddEdge() {
    const endpoints = readEndpoints();
    if (!endpoints) return;

    abortReplay();
    const before = graphRef.current;
    const [from, to] = endpoints;

    try {
      const updated = addEdge(before, from, to);

      if (directed) {
        // In directed mode, the edge is interpreted as source -> target.
        // The renderer displays the arrowhead for the selected direction.
      }

      setOperation("add-edge");
      setActiveLine(6);
      updateGraph(updated);

      record(`Added edge ${from} ${directed ? "→" : "↔"} ${to}.`, {
        op: "add-edge",
        before,
        after: updated,
        activeId: null,
        traversal: null,
        line: 6,
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add edge."
      );
    }
  }

  function handleRemoveEdge() {
    const endpoints = readEndpoints();
    if (!endpoints) return;

    abortReplay();
    const before = graphRef.current;
    const [from, to] = endpoints;

    try {
      const updated = removeEdge(before, from, to);

      setOperation("remove-edge");
      setActiveLine(4);
      updateGraph(updated);

      record(`Removed edge between ${from} and ${to}.`, {
        op: "remove-edge",
        before,
        after: updated,
        activeId: null,
        traversal: null,
        line: 4,
      });
    } catch (error) {
      setOperation("remove-edge");
      setActiveLine(2);
      setMessage(
        error instanceof Error ? error.message : "Could not remove edge."
      );
    }
  }

  function handleSearch() {
    const n = readValue();
    if (n === null) return;

    abortReplay();
    const before = graphRef.current;

    setOperation("search");
    setTraversal(null);

    const found = searchVertex(before, n);
    const line = found ? 2 : 3;

    setActiveNode(found ? found.id : null);
    setActiveLine(line);

    record(found ? `Found vertex ${n}.` : `Vertex ${n} was not found.`, {
      op: "search",
      before,
      after: before,
      activeId: found ? found.id : null,
      traversal: null,
      line,
    });
  }

  // Walks the traversal one vertex at a time, lighting up the path as it goes.
  function runTraversal(
    op: "bfs" | "dfs",
    startValue: number,
    values: number[],
    before: GraphData
  ) {
    const ids = values
      .map((v) => before.nodes.find((node) => node.value === v)?.id)
      .filter((id): id is number => id !== undefined);
    const visitLine = VISIT_LINE[op];
    const label = op === "bfs" ? "BFS" : "DFS";

    const finalText = values.length
      ? `${label} from ${startValue}: ${values.join(" → ")}.`
      : "No vertices were traversed.";

    setOperation(op);
    setActiveNode(null);

    // Recorded up front so it appears in History; replay shows the full path.
    record(finalText, {
      op,
      before,
      after: before,
      activeId: null,
      traversal: values,
      path: ids,
      line: ids.length ? visitLine : null,
    });

    if (ids.length === 0) {
      setTraversal([]);
      setActiveLine(null);
      return;
    }

    setTraversal([]);
    let step = 0;

    const tick = () => {
      setActiveLine(visitLine);
      setActiveNode(ids[step]);
      setVisitedIds(ids.slice(0, step + 1));
      setTraversal(values.slice(0, step + 1));
      setMessage(
        `${label}: visiting ${values[step]} (${step + 1} of ${values.length})`
      );
      step++;

      if (step < ids.length) {
        traverseTimer.current = setTimeout(
          tick,
          800 / Number(speedRef.current)
        );
      } else {
        traverseTimer.current = setTimeout(() => {
          traverseTimer.current = null;
          setActiveNode(null);
          setActiveLine(null);
          setMessage(finalText);
        }, 800 / Number(speedRef.current));
      }
    };

    tick();
  }

  function handleBFS() {
    const endpoints = readEndpoints();
    if (!endpoints) return;

    abortReplay();
    const before = graphRef.current;
    const startValue = endpoints[0];

    setTraversal(null);

    try {
      const result = bfs(before, startValue);
      runTraversal("bfs", startValue, result, before);
    } catch (error) {
      setOperation("bfs");
      setActiveNode(null);
      setMessage(
        error instanceof Error ? error.message : "BFS failed."
      );
      setTraversal(null);
    }
  }

  function handleDFS() {
    const endpoints = readEndpoints();
    if (!endpoints) return;

    abortReplay();
    const before = graphRef.current;
    const startValue = endpoints[0];

    setTraversal(null);

    try {
      const result = dfs(before, startValue);
      runTraversal("dfs", startValue, result, before);
    } catch (error) {
      setOperation("dfs");
      setActiveNode(null);
      setMessage(
        error instanceof Error ? error.message : "DFS failed."
      );
      setTraversal(null);
    }
  }

  function handleClear() {
    abortReplay();
    const before = graphRef.current;
    const after = clearGraph();

    setOperation("clear");
    setActiveLine(0);
    updateGraph(after);

    record("Cleared the graph.", {
      op: "clear",
      before,
      after,
      activeId: null,
      traversal: null,
      line: 0,
    });
  }

  function generateRandomGraph() {
    const count = Number(randomCount);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 15
    ) {
      setMessage("Choose between 1 and 15 vertices.");
      return;
    }

    abortReplay();
    const before = graphRef.current;
    const startId = nextIdRef.current;

    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const radiusX = Math.min(245, 70 + count * 13);
    const radiusY = Math.min(135, 50 + count * 6);

    const nodes = Array.from({ length: count }, (_, index) => {
      const angle = (2 * Math.PI * index) / count - Math.PI / 2;

      return {
        id: startId + index,
        value: index + 1,
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      };
    });

    const edges: GraphData["edges"] = [];

    // Ensure all generated vertices are connected in a chain.
    for (let i = 0; i < count - 1; i++) {
      edges.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
      });
    }

    // Add a few additional non-duplicate edges.
    for (let i = 0; i < count; i++) {
      const j = i + 2;

      if (j < count && Math.random() > 0.45) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
        });
      }
    }

    const after: GraphData = { nodes, edges };

    updateGraph(after);
    nextIdRef.current = startId + count;
    setNextId(startId + count);
    setOperation("bfs");
    setActiveLine(null);

    record(`Generated a graph with ${count} vertices.`, {
      op: "bfs",
      before,
      after,
      activeId: null,
      traversal: null,
      line: null,
    });
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <style>{`
        @keyframes node-fade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes ring-expand {
          0%   { r: 23px; opacity: 0.75; }
          100% { r: 46px; opacity: 0; }
        }
        @keyframes badge-pop {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        .graph-new   { animation: node-fade 500ms ease-out both; }
        .graph-ring  { animation: ring-expand 1200ms ease-out 300ms both; }
        .graph-badge { animation: badge-pop 400ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .graph-new, .graph-ring, .graph-badge { animation: none !important; }
        }
      `}</style>

      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Graph Visualizer
          </h1>
          <p className="text-xs text-muted-foreground">
            Explore vertices, edges, BFS, DFS, and graph complexity.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          Undirected Graph
        </Badge>
      </header>

      <div className="grid grid-cols-1 items-start gap-3 px-4 pb-4 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-3 lg:max-h-[calc(100vh-1.5rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border px-3 py-2">
              <CardTitle className="text-sm">Operations</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-3 py-3">
              <div className="space-y-1">
                <label htmlFor="graph-value" className="text-xs font-medium">
                  Vertex value
                </label>
                <Input
                  id="graph-value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Vertex value"
                  className="h-7 bg-background px-2 text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <Button
                  onClick={handleAddVertex}
                  variant="outline"
                  className={secondaryButton}
                >
                  Add Vertex
                </Button>
                <Button
                  onClick={handleRemoveVertex}
                  variant="outline"
                  className={secondaryButton}
                >
                  Remove Vertex
                </Button>
                <Button
                  onClick={handleSearch}
                  variant="outline"
                  className={secondaryButton}
                >
                  Search Vertex
                </Button>
              </div>

              <div className="border-t border-border pt-2">
                <p className="mb-2 text-xs font-semibold">Edge Operations</p>

                <div className="space-y-1">
                  <label
                    htmlFor="graph-source"
                    className="text-[11px] text-muted-foreground"
                  >
                    Source vertex
                  </label>
                  <Input
                    id="graph-source"
                    type="number"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="h-7 bg-background px-2 text-xs"
                  />

                  <label
                    htmlFor="graph-target"
                    className="text-[11px] text-muted-foreground"
                  >
                    Target vertex
                  </label>
                  <Input
                    id="graph-target"
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="h-7 bg-background px-2 text-xs"
                  />
                </div>

                <div className="mt-2 space-y-1">
                  <Button
                    onClick={handleAddEdge}
                    variant="outline"
                    className={secondaryButton}
                  >
                    Add Edge
                  </Button>
                  <Button
                    onClick={handleRemoveEdge}
                    variant="outline"
                    className={secondaryButton}
                  >
                    Remove Edge
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-2">
                <p className="mb-2 text-xs font-semibold">Traversal</p>
                <p className="mb-1 text-[11px] text-muted-foreground">
                  BFS and DFS start at the source vertex.
                </p>

                <div className="space-y-1">
                  <Button
                    onClick={handleBFS}
                    variant="outline"
                    className={secondaryButton}
                  >
                    Breadth-First Search
                  </Button>
                  <Button
                    onClick={handleDFS}
                    variant="outline"
                    className={secondaryButton}
                  >
                    Depth-First Search
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleClear}
                variant="outline"
                className="h-7 w-full justify-start border-red-200 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                Clear Graph
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="px-3 pb-1 pt-3">
              <CardTitle className="text-sm">Random Graph</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-3 pb-3">
              <div className="space-y-1">
                <label
                  htmlFor="graph-count"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Number of vertices (1–15)
                </label>
                <Input
                  id="graph-count"
                  type="number"
                  min="1"
                  max="15"
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  className="h-7 px-2 text-xs"
                />
              </div>

              <Button
                onClick={generateRandomGraph}
                className={`h-7 w-full text-xs ${primaryButton}`}
              >
                Generate Graph
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 pt-3">
              <div>
                <CardTitle className="text-sm">History</CardTitle>
                <CardDescription className="text-[11px]">
                  Press Play to replay
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  abortReplay();
                  setHistory([]);
                }}
                className="h-6 px-2 text-[11px] text-muted-foreground"
              >
                Clear
              </Button>
            </CardHeader>

            <CardContent className="px-3 pb-3">
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Recent operations appear here.
                </p>
              ) : (
                <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className={`flex gap-1.5 rounded px-1 text-[11px] leading-snug transition-colors ${
                        replayEntryId === item.id
                          ? "bg-red-50 font-medium text-red-800 dark:bg-red-950/40 dark:text-red-200"
                          : ""
                      }`}
                    >
                      <span className="font-bold text-red-600">↳</span>
                      <span className="min-w-0 break-words">{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Alert className="border-red-200 bg-red-50 px-3 py-2 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <AlertDescription className="text-[11px] leading-snug">
              <span className="font-semibold text-red-700 dark:text-red-300">
                Status:{" "}
              </span>
              {message}
            </AlertDescription>
          </Alert>
        </aside>

        <section className="flex min-w-0 flex-col gap-3">
          <Card className="min-w-0 overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3 space-y-0 border-b border-border px-3 py-3 sm:px-4">
              <div className="min-w-0">
                <CardTitle className="text-base">
                  Visualization Playground
                </CardTitle>
                <CardDescription className="text-xs">
                  Vertices represent nodes; lines represent edges.
                </CardDescription>
              </div>

              <Badge variant="outline" className="text-xs">
                {graph.nodes.length} vertices · {graph.edges.length} edges
              </Badge>
            </CardHeader>

            <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
              {/* PLAYBACK CONTROLS */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" /> Play
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePause}
                    disabled={!isPlaying}
                    className="gap-2"
                  >
                    <Pause className="h-4 w-4" /> Pause
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="gap-2"
                  >
                    <Undo2 className="h-4 w-4" /> Undo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="gap-2"
                  >
                    <Redo2 className="h-4 w-4" /> Redo
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="animation-speed" className="text-sm">
                    Speed
                  </label>
                  <select
                    id="animation-speed"
                    value={animationSpeed}
                    onChange={(event) => setAnimationSpeed(event.target.value)}
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="0.5">0.5×</option>
                    <option value="1">1×</option>
                    <option value="2">2×</option>
                    <option value="4">4×</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/40 py-2 text-center">
                <div className="px-1">
                  <p className="text-[11px] text-muted-foreground">Vertices</p>
                  <p className="text-base font-bold">{graph.nodes.length}</p>
                </div>

                <div className="px-1">
                  <p className="text-[11px] text-muted-foreground">Edges</p>
                  <p className="text-base font-bold">{graph.edges.length}</p>
                </div>

                <div className="px-1">
                  <p className="text-[11px] text-muted-foreground">Type</p>
                  <p className="text-base font-bold">Undirected</p>
                </div>
              </div>

              <div className="w-full overflow-auto rounded-xl border border-border bg-muted/20">
                {graph.nodes.length === 0 ? (
                  <div className="flex min-h-[350px] flex-col items-center justify-center p-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-950/50">
                      ∅
                    </div>

                    <p className="text-lg font-semibold">
                      Your graph is empty
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Add a vertex or generate a random graph to begin.
                    </p>
                  </div>
                ) : (
                  <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    className="block h-auto min-w-[520px] w-full"
                    role="img"
                    aria-label="Graph visualization showing vertices and edges"
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
                          fill="#dc2626"
                        />
                      </marker>
                    </defs>

                    {graph.edges.map((edge, index) => {
                      const from = graph.nodes.find(
                        (node) => node.id === edge.source
                      );
                      const to = graph.nodes.find(
                        (node) => node.id === edge.target
                      );

                      if (!from || !to) return null;

                      const dx = to.x - from.x;
                      const dy = to.y - from.y;
                      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                      const startX =
                        from.x + (dx / distance) * NODE_RADIUS;
                      const startY =
                        from.y + (dy / distance) * NODE_RADIUS;
                      const endX =
                        to.x - (dx / distance) * NODE_RADIUS;
                      const endY =
                        to.y - (dy / distance) * NODE_RADIUS;

                      // Edge the traversal actually walked along
                      const onPath = treeEdges.has(
                        edgeKey(edge.source, edge.target)
                      );
                      // Edge between two visited vertices that was not used
                      const betweenVisited =
                        !onPath &&
                        visitedIds.includes(edge.source) &&
                        visitedIds.includes(edge.target);

                      return (
                        <g key={`${edge.source}-${edge.target}-${index}`}>
                          <line
                            x1={startX}
                            y1={startY}
                            x2={endX}
                            y2={endY}
                            stroke={
                              onPath
                                ? "#dc2626"
                                : betweenVisited
                                  ? "#fca5a5"
                                  : "#94a3b8"
                            }
                            strokeWidth={
                              onPath ? 4.5 : betweenVisited ? 2.5 : 2
                            }
                            strokeLinecap="round"
                            style={{
                              transition: "stroke 300ms, stroke-width 300ms",
                            }}
                          />

                          {edge.weight !== undefined && edge.weight !== 1 && (
                            <text
                              x={(from.x + to.x) / 2}
                              y={(from.y + to.y) / 2 - 7}
                              textAnchor="middle"
                              className="fill-foreground text-xs"
                            >
                              {edge.weight}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {graph.nodes.map((node) => {
                      const highlighted = activeNode === node.id;
                      const visitIndex = visitedIds.indexOf(node.id);
                      const visited = visitIndex !== -1;
                      const isNew = newIds.includes(node.id);

                      return (
                        <g
                          key={node.id}
                          className={isNew ? "graph-new" : undefined}
                        >
                          {isNew && (
                            <circle
                              className="graph-ring"
                              cx={node.x}
                              cy={node.y}
                              r={NODE_RADIUS}
                              fill="none"
                              stroke="#dc2626"
                              strokeWidth="3"
                            />
                          )}

                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={NODE_RADIUS}
                            fill={
                              highlighted
                                ? "#dc2626"
                                : visited
                                  ? "#fee2e2"
                                  : "var(--graph-node-fill, #ffffff)"
                            }
                            stroke={
                              highlighted || visited
                                ? "#dc2626"
                                : "#64748b"
                            }
                            strokeWidth={highlighted ? 4 : 2}
                            style={{
                              transition: "fill 300ms, stroke 300ms",
                            }}
                          />

                          <text
                            x={node.x}
                            y={node.y + 5}
                            textAnchor="middle"
                            fontSize="15"
                            fontWeight="700"
                            fill={highlighted ? "#ffffff" : "#1e293b"}
                          >
                            {node.value}
                          </text>

                          {highlighted && (
                            <text
                              x={node.x}
                              y={node.y - NODE_RADIUS - 9}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="700"
                              fill="#dc2626"
                            >
                              ACTIVE
                            </text>
                          )}

                          {visited && (
                            <g>
                              <circle
                                cx={node.x - 17}
                                cy={node.y + 17}
                                r="9"
                                fill="#0f172a"
                              />
                              <text
                                x={node.x - 17}
                                y={node.y + 20.5}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="700"
                                fill="#ffffff"
                              >
                                {visitIndex + 1}
                              </text>
                            </g>
                          )}

                          {isNew && (
                            <text
                              className="graph-badge"
                              x={node.x}
                              y={node.y + NODE_RADIUS + 15}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="700"
                              fill="#059669"
                            >
                              NEW
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Traversal Output</p>

                  <Badge variant="outline" className="text-[11px]">
                    {traversal?.length ?? 0} vertices
                  </Badge>
                </div>

                <p className="max-h-20 overflow-auto break-words rounded-md border border-border bg-muted/40 px-2 py-1.5 font-mono text-xs">
                  {traversal !== null
                    ? traversal.length
                      ? traversal.join(" → ")
                      : "No vertices visited"
                    : "Run BFS or DFS to see the traversal order."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid min-w-0 grid-cols-1 items-start gap-3 md:grid-cols-2">
            <Card className="min-w-0 border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">Pseudocode</CardTitle>

                  <Badge
                    variant="outline"
                    className="max-w-[65%] truncate border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  >
                    {selectedCode.title}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 p-3">
                <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 shadow-inner">
                  <div className="min-w-max space-y-0.5 font-mono">
                    {selectedCode.lines.map((line, index) => (
                      <div
                        key={`${operation}-${index}`}
                        className={`flex items-start gap-3 rounded px-2 py-1 transition-colors duration-200 ${
                          activeLine === index
                            ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/50"
                            : "hover:bg-slate-800/70"
                        }`}
                      >
                        <span className="w-5 shrink-0 select-none text-right text-slate-500">
                          {activeLine === index ? "▶" : index + 1}
                        </span>

                        <span
                          className={
                            line.trim().startsWith("//")
                              ? "text-emerald-300"
                              : line.includes("return")
                                ? "text-pink-300"
                                : line.includes("if ") ||
                                    line.includes("while ") ||
                                    line.includes("for ") ||
                                    line.includes("DFS(")
                                  ? "text-amber-200"
                                  : "text-sky-100"
                          }
                        >
                          {line || " "}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
                    How it works
                  </h3>

                  <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed">
                    {selectedCode.explanation.map((step, index) => (
                      <li key={`${operation}-step-${index}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <CardTitle className="text-base">Time Complexity</CardTitle>

                <CardDescription className="text-xs">
                  Selected operation and common graph operations.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 p-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {selectedCode.title}
                    </p>

                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {selectedCode.complexity}
                    </p>
                  </div>

                  <p className="max-w-[55%] text-right text-xs text-muted-foreground">
                    {selectedCode.complexity === "O(1)"
                      ? "Constant time."
                      : "May inspect vertices or edges."}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="border-b border-border p-2">
                          Operation
                        </th>
                        <th className="border-b border-border p-2">Time</th>
                        <th className="border-b border-border p-2">Why?</th>
                      </tr>
                    </thead>

                    <tbody>
                      {complexityRows.map((row) => (
                        <tr
                          key={row.operation}
                          className="transition-colors hover:bg-muted/40"
                        >
                          <td className="border-b border-border p-2 font-medium">
                            {row.operation}
                          </td>

                          <td className="border-b border-border p-2">
                            <Badge
                              variant="outline"
                              className={
                                row.time === "O(V)"
                                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                              }
                            >
                              {row.time}
                            </Badge>
                          </td>

                          <td className="border-b border-border p-2 text-muted-foreground">
                            {row.why}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Here, <strong>V</strong> is the number of vertices and{" "}
                  <strong>E</strong> is the number of edges. BFS and DFS
                  take O(V + E) using an adjacency-list representation,
                  when each vertex and edge is processed at most once.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}