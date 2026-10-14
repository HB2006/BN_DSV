"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Undo2, Redo2, Gauge } from "lucide-react";
import type { HeapNode } from "./type";

import {
  insertHeap,
  deleteMin,
  searchHeap,
  getMin,
} from "./heap-operation";

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

type Operation =
  | "insert"
  | "delete-min"
  | "search"
  | "get-min"
  | "traverse"
  | "clear";

type HistoryEntry = {
  id: number;
  text: string;
  op: Operation;
  before: HeapNode[];
  after: HeapNode[];
  activeId: number | null;
  traversal: number[] | null;
  line: number | null;
};

type HistoryMeta = Omit<HistoryEntry, "id" | "text">;

type Step = { line: number | null; run: () => void };

const pseudocode: Record<
  Operation,
  {
    title: string;
    lines: string[];
    explanation: string[];
    complexity: string;
  }
> = {
  insert: {
    title: "Insert into Min-Heap",
    lines: [
      "// Insert a value into the min-heap",
      "heap.append(value)",
      "index = heap.size - 1",
      "while index > 0:",
      "    parent = floor((index - 1) / 2)",
      "    if heap[parent] <= heap[index]: break",
      "    swap(heap[parent], heap[index])",
      "    index = parent",
      "return",
    ],
    explanation: [
      "Add the new value at the end of the heap.",
      "Calculate its parent's index using floor((index - 1) / 2).",
      "Compare the new element with its parent.",
      "Swap if the parent is larger.",
      "Continue moving upward until the heap property is restored.",
    ],
    complexity: "O(log n)",
  },

  "delete-min": {
    title: "Delete Minimum",
    lines: [
      "// Remove the root of the min-heap",
      "if heap is empty: return error",
      "minValue = heap[0]",
      "heap[0] = heap[last]",
      "remove last element",
      "index = 0",
      "while index has children:",
      "    child = index of smaller child",
      "    if heap[index] <= heap[child]: break",
      "    swap(heap[index], heap[child])",
      "    index = child",
      "return minValue",
    ],
    explanation: [
      "The minimum is stored at the root, index 0.",
      "Save the minimum value.",
      "Move the last element to the root and remove its old position.",
      "Compare the element with its smaller child.",
      "Swap downward until the min-heap property is restored.",
    ],
    complexity: "O(log n)",
  },

  search: {
    title: "Search Heap",
    lines: [
      "// Find a value in the heap",
      "for index = 0 to heap.size - 1:",
      "    if heap[index] == target:",
      "        return index",
      "return -1",
    ],
    explanation: [
      "Start from the first array element.",
      "Compare each element with the target.",
      "Return the index if a match is found.",
      "Return -1 if the value is absent.",
      "A heap is not fully sorted, so every element may need checking.",
    ],
    complexity: "O(n)",
  },

  "get-min": {
    title: "Get Minimum",
    lines: [
      "// Read the minimum element",
      "if heap is empty: return error",
      "return heap[0]",
    ],
    explanation: [
      "Check whether the heap is empty.",
      "The minimum value is at the root of a min-heap.",
      "Return the root without modifying the heap.",
    ],
    complexity: "O(1)",
  },

  traverse: {
    title: "Level-Order Traversal",
    lines: [
      "// Visit the heap level by level",
      "for index = 0 to heap.size - 1:",
      "    visit(heap[index])",
      "return",
    ],
    explanation: [
      "Start at index 0, the root.",
      "Visit each element in array order.",
      "Array order corresponds to level-order traversal.",
      "Continue until all elements have been visited.",
    ],
    complexity: "O(n)",
  },

  clear: {
    title: "Clear Heap",
    lines: [
      "// Remove all elements",
      "heap = []",
      "return",
    ],
    explanation: [
      "Replace the heap array with an empty array.",
      "All heap elements are removed.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows = [
  {
    operation: "Insert",
    time: "O(log n)",
    why: "Move upward through the tree.",
  },
  {
    operation: "Delete Minimum",
    time: "O(log n)",
    why: "Move downward through the tree.",
  },
  {
    operation: "Search",
    time: "O(n)",
    why: "May inspect every element.",
  },
  {
    operation: "Get Minimum",
    time: "O(1)",
    why: "Read the root directly.",
  },
  {
    operation: "Level-Order Traversal",
    time: "O(n)",
    why: "Visit every element once.",
  },
  {
    operation: "Clear Heap",
    time: "O(1)",
    why: "Replace the array.",
  },
];

const primaryButton =
  "bg-[#D8A7B1] text-[#4D3039] hover:bg-[#C9919D] dark:bg-[#D8A7B1] dark:hover:bg-[#E2BAC2]";

const secondaryButton =
  "h-8 w-full justify-start border-0 bg-[#0F6B6D] px-2 text-xs text-white hover:bg-[#0B5557] dark:bg-[#0F6B6D] dark:text-white dark:hover:bg-[#0B5557]";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const MAX_HISTORY = 50;

export function HeapVisualizer() {
  const [heap, setHeap] = useState<HeapNode[]>([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
    { id: 4, value: 40 },
    { id: 5, value: 25 },
  ]);

  const [value, setValue] = useState("15");
  const [nextId, setNextId] = useState(6);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>("insert");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [message, setMessage] = useState(
    "Choose an operation to get started."
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [replayEntryId, setReplayEntryId] = useState<number | null>(null);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [randomCount, setRandomCount] = useState("7");
  const [minValue, setMinValue] = useState("1");
  const [maxValue, setMaxValue] = useState("100");
  const [zoom, setZoom] = useState(1);

  // Playback + undo/redo state
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1");
  const [undoStack, setUndoStack] = useState<HeapNode[][]>([]);
  const [redoStack, setRedoStack] = useState<HeapNode[][]>([]);

  const selectedCode = pseudocode[operation];

  // Latest-value refs so timer callbacks never see stale state
  const heapRef = useRef(heap);
  heapRef.current = heap;
  const nextIdRef = useRef(nextId);
  nextIdRef.current = nextId;
  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;

  // Replay machinery
  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<Step[] | null>(null);
  const frameIndexRef = useRef(0);
  const replayOriginalRef = useRef<HeapNode[] | null>(null);
  const historyIdRef = useRef(1);

  // New-node animation tracking
  const [newIds, setNewIds] = useState<number[]>([]);
  const prevIdsRef = useRef<Set<number>>(new Set(heap.map((n) => n.id)));

  // Detect any node that appeared (insert, redo, undo of delete, generate, replay)
  useEffect(() => {
    const prev = prevIdsRef.current;
    const ids = heap.map((n) => n.id);
    const added = ids.filter((id) => !prev.has(id));
    prevIdsRef.current = new Set(ids);

    if (added.length === 0) {
      setNewIds([]);
      return;
    }
    setNewIds(added);
    const t = setTimeout(() => setNewIds([]), 1600);
    return () => clearTimeout(t);
  }, [heap]);

  // Clear playback timer on unmount
  useEffect(() => {
    return () => {
      if (playbackTimer.current !== null) {
        clearTimeout(playbackTimer.current);
      }
    };
  }, []);

  function zoomIn() {
    setZoom((z) =>
      Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 10) / 10)
    );
  }

  function zoomOut() {
    setZoom((z) =>
      Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 10) / 10)
    );
  }

  function resetZoom() {
    setZoom(1);
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

  function updateHeap(nextHeap: HeapNode[]) {
    const current = heapRef.current;
    setUndoStack((old) => [...old, [...current]]);
    setRedoStack([]);
    heapRef.current = nextHeap;
    setHeap(nextHeap);
    setActiveNode(null);
    setTraversal(null);
  }

  /* ---------- HISTORY REPLAY ---------- */

  // Stops any replay and puts the real heap back
  function abortReplay() {
    if (playbackTimer.current !== null) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
    setIsPlaying(false);
    if (replayOriginalRef.current) {
      const original = replayOriginalRef.current;
      replayOriginalRef.current = null;
      heapRef.current = original;
      setHeap(original);
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

    const entries = history.slice().reverse(); // oldest first
    const original = heapRef.current;
    replayOriginalRef.current = original;

    const frames: Step[] = [];

    // 1. Rewind to the state before the first recorded operation
    frames.push({
      line: null,
      run: () => {
        const start = entries[0].before;
        heapRef.current = start;
        setHeap(start);
        setActiveNode(null);
        setTraversal(null);
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
          setActiveNode(entry.op === "delete-min" ? entry.activeId : null);
          setMessage(`Replaying: ${title}`);
        },
      });
      frames.push({
        line: entry.line,
        run: () => {
          heapRef.current = entry.after;
          setHeap(entry.after);
          setActiveNode(entry.op === "delete-min" ? null : entry.activeId);
          setTraversal(entry.traversal);
          setMessage(entry.text);
        },
      });
    });

    // 3. Put the real heap back (matters if you used Undo/Redo earlier)
    frames.push({
      line: null,
      run: () => {
        heapRef.current = original;
        setHeap(original);
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
    const current = heapRef.current;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((old) => [...old, [...current]]);
    setUndoStack((old) => old.slice(0, -1));
    heapRef.current = [...previous];
    setHeap([...previous]);
    setTraversal(null);
    setMessage("Undo successful.");
  }

  function handleRedo() {
    abortReplay();
    if (redoStack.length === 0) return;
    const current = heapRef.current;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((old) => [...old, [...current]]);
    setRedoStack((old) => old.slice(0, -1));
    heapRef.current = [...next];
    setHeap([...next]);
    setTraversal(null);
    setMessage("Redo successful.");
  }

  /* ---------- OPERATIONS ---------- */

  function readNumber(): number | null {
    if (value.trim() === "" || !Number.isFinite(Number(value))) {
      setMessage("Enter a valid number first.");
      return null;
    }

    return Number(value);
  }

  function insert() {
    const n = readNumber();
    if (n === null) return;

    abortReplay();
    const before = heapRef.current;
    const id = nextIdRef.current;
    const after = insertHeap(before, n, id);

    setOperation("insert");
    setActiveLine(6);
    updateHeap(after);
    setActiveNode(id);
    nextIdRef.current = id + 1;
    setNextId(id + 1);

    record(`Inserted ${n} into the min-heap.`, {
      op: "insert",
      before,
      after,
      activeId: id,
      traversal: null,
      line: 6,
    });
  }

  function removeMinimum() {
    abortReplay();
    const before = heapRef.current;

    setOperation("delete-min");
    setTraversal(null);

    if (before.length === 0) {
      setActiveLine(1);
      setActiveNode(null);
      setMessage("Cannot delete from an empty heap.");
      return;
    }

    const minValue = before[0].value;
    const minId = before[0].id;
    const after = deleteMin(before);

    setActiveLine(9);
    updateHeap(after);

    record(`Deleted the minimum value ${minValue}.`, {
      op: "delete-min",
      before,
      after,
      activeId: minId,
      traversal: null,
      line: 9,
    });
  }

  function search() {
    const n = readNumber();
    if (n === null) return;

    abortReplay();
    const before = heapRef.current;

    setOperation("search");
    setTraversal(null);

    const index = searchHeap(before, n);
    const line = index === -1 ? 4 : 2;
    const activeId = index === -1 ? null : before[index].id;

    setActiveLine(line);
    setActiveNode(activeId);

    record(
      index === -1
        ? `Value ${n} was not found.`
        : `Found ${n} at array index ${index}.`,
      {
        op: "search",
        before,
        after: before,
        activeId,
        traversal: null,
        line,
      }
    );
  }

  function peekMinimum() {
    abortReplay();
    const before = heapRef.current;

    setOperation("get-min");
    setTraversal(null);

    if (before.length === 0) {
      setActiveLine(1);
      setActiveNode(null);
      setMessage("The heap is empty. No minimum exists.");
      return;
    }

    setActiveLine(2);
    setActiveNode(before[0].id);

    record(`Minimum value: ${getMin(before)}.`, {
      op: "get-min",
      before,
      after: before,
      activeId: before[0].id,
      traversal: null,
      line: 2,
    });
  }

  function traverse() {
    abortReplay();
    const before = heapRef.current;

    setOperation("traverse");
    setActiveLine(2);
    setActiveNode(null);

    const values = before.map((node) => node.value);

    setTraversal(values);

    record(
      values.length
        ? `Traversed ${values.length} heap elements in level order.`
        : "The heap is empty.",
      {
        op: "traverse",
        before,
        after: before,
        activeId: null,
        traversal: values,
        line: 2,
      }
    );
  }

  function clearHeap() {
    abortReplay();
    const before = heapRef.current;
    const after: HeapNode[] = [];

    setOperation("clear");
    setActiveLine(1);
    updateHeap(after);

    record("Cleared the heap.", {
      op: "clear",
      before,
      after,
      activeId: null,
      traversal: null,
      line: 1,
    });
  }

  function generateRandom() {
    const count = Number(randomCount);
    const min = Number(minValue);
    const max = Number(maxValue);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 30 ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min > max
    ) {
      setMessage(
        "Use 1–30 nodes and valid integer minimum/maximum values."
      );
      return;
    }

    abortReplay();
    const before = heapRef.current;
    const startId = nextIdRef.current;

    const values = Array.from(
      { length: count },
      () => Math.floor(Math.random() * (max - min + 1)) + min
    );

    let generated: HeapNode[] = [];

    values.forEach((n, index) => {
      generated = insertHeap(generated, n, startId + index);
    });

    updateHeap(generated);
    nextIdRef.current = startId + count;
    setNextId(startId + count);
    setOperation("traverse");
    setActiveLine(null);

    record(`Generated a min-heap with ${count} random nodes.`, {
      op: "traverse",
      before,
      after: generated,
      activeId: null,
      traversal: null,
      line: null,
    });
  }

  const levels = Array.from(
    { length: heap.length ? Math.floor(Math.log2(heap.length)) + 1 : 0 },
    (_, level) => {
      const start = 2 ** level - 1;
      const end = Math.min(2 ** (level + 1) - 1, heap.length);

      return {
        level,
        nodes: heap.slice(start, end).map((node, offset) => ({
          node,
          index: start + offset,
        })),
      };
    }
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <style>{`
        @keyframes node-enter {
          0%   { opacity: 0; transform: translateY(-30px) scale(0.85); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes node-glow {
          0%   { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.55); }
          100% { box-shadow: 0 0 0 18px rgba(220, 38, 38, 0); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-new { animation: none !important; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F6B6D] sm:text-2xl">
            Min-Heap Visualizer
          </h1>
          <p className="text-xs text-[#0F6B6D]">
            Explore heap operations, array indices, pseudocode, and complexity.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          Binary Min-Heap
        </Badge>
      </header>

      {/* SIDEBAR + WORKSPACE */}
      <div className="grid grid-cols-1 items-start gap-4 px-4 pb-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* LEFT SIDEBAR */}
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
          {/* OPERATIONS */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border px-3 py-2">
              <CardTitle className="text-sm">Operations</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-3 py-3">
              <div className="space-y-1">
                <label htmlFor="heap-value" className="text-xs font-medium">
                  Node value
                </label>
                <Input
                  id="heap-value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Value"
                  className="h-8 bg-background px-2 text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <Button onClick={insert} className={secondaryButton}>
                  Insert
                </Button>
                <Button onClick={removeMinimum} className={secondaryButton}>
                  Delete Minimum
                </Button>
                <Button onClick={search} className={secondaryButton}>
                  Search
                </Button>
                <Button onClick={peekMinimum} className={secondaryButton}>
                  Get Minimum
                </Button>
                <Button onClick={traverse} className={secondaryButton}>
                  Level-Order Traversal
                </Button>
                <Button
                  onClick={clearHeap}
                  variant="outline"
                  className="h-7 w-full justify-start border-red-200 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950"
                >
                  Clear Heap
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RANDOM GENERATOR */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="px-3 pb-1 pt-3">
              <CardTitle className="text-sm">Random Nodes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-3 pb-3">
              <div className="space-y-1">
                <label htmlFor="heap-count" className="text-[11px] font-medium text-muted-foreground">
                  Number of nodes
                </label>
                <Input
                  id="heap-count"
                  type="number"
                  min="1"
                  max="30"
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  className="h-8 px-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 space-y-1">
                  <label htmlFor="heap-min" className="text-[11px] font-medium text-muted-foreground">
                    Minimum
                  </label>
                  <Input
                    id="heap-min"
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="h-8 px-2 text-xs"
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <label htmlFor="heap-max" className="text-[11px] font-medium text-muted-foreground">
                    Maximum
                  </label>
                  <Input
                    id="heap-max"
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="h-8 px-2 text-xs"
                  />
                </div>
              </div>

              <Button
                onClick={generateRandom}
                className={`h-8 w-full text-xs ${primaryButton}`}
              >
                Generate Heap
              </Button>
            </CardContent>
          </Card>

          {/* HISTORY */}
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

          {/* STATUS */}
          <Alert className="border-red-200 bg-red-50 px-3 py-2 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <AlertDescription className="text-[11px] leading-snug">
              <span className="font-semibold text-red-700 dark:text-red-300">
                Status:
              </span>{" "}
              {message}
            </AlertDescription>
          </Alert>
        </aside>

        {/* RIGHT WORKSPACE */}
        <section className="flex min-w-0 flex-col gap-4">
          {/* VISUALIZATION */}
          <Card className="min-w-0 border-border bg-card shadow-sm">
            <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <CardTitle className="text-base">
                  Visualization Playground
                </CardTitle>
                <CardDescription className="text-xs">
                  Explore the heap tree and its array representation.
                </CardDescription>
              </div>

              {/* ZOOM CONTROLS */}
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                  className="h-8 w-8 p-0 text-base"
                >
                  −
                </Button>

                <button
                  type="button"
                  onClick={resetZoom}
                  title="Reset zoom"
                  className="h-8 min-w-[3.5rem] rounded-md border border-border bg-muted/40 px-2 text-xs font-medium hover:bg-muted"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                  className="h-8 w-8 p-0 text-base"
                >
                  +
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

              {/* STATISTICS - NOT AFFECTED BY ZOOM */}
              <div className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/40 py-2 text-center">
                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Minimum</p>
                  <p className="break-words text-base font-bold">
                    {heap.length ? heap[0].value : "—"}
                  </p>
                </div>

                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Heap Size</p>
                  <p className="text-base font-bold">{heap.length}</p>
                </div>

                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Height</p>
                  <p className="text-base font-bold">
                    {heap.length ? Math.floor(Math.log2(heap.length)) : "—"}
                  </p>
                </div>
              </div>

              {/* TREE VIEWPORT */}
              <div className="h-[450px] overflow-auto rounded-xl border border-border bg-muted/20 p-4 sm:h-[550px]">
                {heap.length === 0 ? (
                  <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-950/50">
                      ∅
                    </div>
                    <p className="text-lg font-semibold">Your heap is empty</p>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                      Insert a value or generate a random heap to begin.
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-full min-w-max items-start justify-center">
                    {/* ZOOM APPLIES ONLY TO THE TREE */}
                    <div
                      className="origin-top"
                      style={{
                        zoom,
                      }}
                    >
                      <div className="flex min-w-max flex-col items-center gap-7 py-5">
                        {levels.map(({ level, nodes }) => {
                          const levelWidth = 2 ** level;

                          return (
                            <div
                              key={level}
                              className="flex items-start justify-center gap-5 sm:gap-10"
                              style={{
                                minWidth: `${Math.max(levelWidth * 5, 100)}rem`,
                              }}
                            >
                              {nodes.map(({ node, index }) => {
                                const highlighted = activeNode === node.id;
                                const isNew = newIds.includes(node.id);
                                const newOrder = newIds.indexOf(node.id);
                                const left = 2 * index + 1;
                                const right = 2 * index + 2;

                                return (
                                  <div
                                    key={node.id}
                                    className="flex w-20 shrink-0 flex-col items-center gap-2"
                                  >
                                    <div
                                      style={
                                        isNew
                                          ? {
                                              animation: `node-enter 600ms cubic-bezier(0.2, 0.8, 0.2, 1) ${
                                                newOrder * 120
                                              }ms both, node-glow 1200ms ease-out ${
                                                600 + newOrder * 120
                                              }ms`,
                                            }
                                          : undefined
                                      }
                                      className={`anim-new relative flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                        highlighted
                                          ? "scale-110 border-red-500 bg-red-50 text-red-950 shadow-lg shadow-red-500/10 dark:bg-red-950/50 dark:text-red-100"
                                          : index === 0
                                            ? "border-red-500 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100"
                                            : "border-border bg-card"
                                      }`}
                                    >
                                      {highlighted && (
                                        <span className="absolute -top-3 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                          ACTIVE
                                        </span>
                                      )}

                                      {isNew && (
                                        <span
                                          className="absolute -right-3 -top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-semibold text-white"
                                          style={{
                                            animation:
                                              "badge-pop 400ms ease-out both",
                                          }}
                                        >
                                          NEW
                                        </span>
                                      )}

                                      <span className="text-xl font-bold">
                                        {node.value}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        [{index}]
                                      </span>
                                    </div>

                                    <span className="text-[11px] text-muted-foreground">
                                      {index === 0 ? "ROOT" : `Index ${index}`}
                                    </span>

                                    <span className="max-w-28 text-center text-[10px] text-muted-foreground">
                                      {left < heap.length && right < heap.length
                                        ? `Children: ${heap[left].value}, ${heap[right].value}`
                                        : left < heap.length
                                          ? `Left: ${heap[left].value}`
                                          : right < heap.length
                                            ? `Right: ${heap[right].value}`
                                            : "Leaf"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ARRAY REPRESENTATION - NOT AFFECTED BY ZOOM */}
              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Heap Array</p>
                  <Badge variant="outline" className="text-[11px]">
                    {heap.length} elements
                  </Badge>
                </div>

                <div className="flex max-h-24 flex-wrap gap-1.5 overflow-auto">
                  {heap.length ? (
                    heap.map((node, index) => {
                      const isNew = newIds.includes(node.id);

                      return (
                        <div
                          key={node.id}
                          style={
                            isNew
                              ? {
                                  animation:
                                    "node-enter 500ms ease-out both, node-glow 1000ms ease-out 500ms",
                                }
                              : undefined
                          }
                          className={`anim-new min-w-12 rounded-md border px-2 py-1 text-center ${
                            activeNode === node.id
                              ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <p className="text-[9px] text-muted-foreground">
                            [{index}]
                          </p>
                          <p className="text-sm font-bold">{node.value}</p>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No elements
                    </span>
                  )}
                </div>

                {traversal !== null && (
                  <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
                    Level order:{" "}
                    {traversal.length ? traversal.join(" → ") : "Empty"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PSEUDOCODE + COMPLEXITY */}
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2">
            {/* PSEUDOCODE */}
            <Card className="flex min-w-0 flex-col border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">Pseudocode</CardTitle>
                  <Badge
                    variant="outline"
                    className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  >
                    {selectedCode.title}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 p-3 sm:p-4">
                <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 shadow-inner">
                  <div className="min-w-max space-y-0.5 font-mono">
                    {selectedCode.lines.map((line, index) => (
                      <div
                        key={`${operation}-${index}`}
                        className={`flex items-start gap-3 rounded px-2 py-1 transition-colors duration-200 ${
                          activeLine === index
                            ? "bg-[#D8A7B1]/25 text-[#F2DCE1] ring-1 ring-[#D8A7B1]/50"
                            : "hover:bg-[#D8A7B1]/10"
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
                                    line.includes("for ")
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

            {/* TIME COMPLEXITY */}
            <Card className="flex min-w-0 flex-col border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-3">
                <CardTitle className="text-base">Time Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Selected operation and all heap operations.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {selectedCode.title}
                    </p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {selectedCode.complexity}
                    </p>
                  </div>

                  <p className="max-w-[55%] text-right text-xs text-muted-foreground">
                    {selectedCode.complexity === "O(1)"
                      ? "Constant time: direct access or reset."
                      : selectedCode.complexity === "O(log n)"
                        ? "Logarithmic time: moves through heap levels."
                        : "Linear time: may inspect every element."}
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
                                row.time === "O(1)"
                                  ? "border-green-300 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                                  : row.time === "O(log n)"
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

                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-600" />
                    O(1): Constant
                  </span>
                  <span>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-600" />
                    O(log n): Logarithmic
                  </span>
                  <span>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-600" />
                    O(n): Linear
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}