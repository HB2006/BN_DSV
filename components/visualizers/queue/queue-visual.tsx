
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Undo2, Redo2, Gauge } from "lucide-react";
import type { ListNode } from "./type";
import { enqueue } from "./queue-operation";

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
  | "enqueue"
  | "dequeue"
  | "peek"
  | "search"
  | "traverse"
  | "clear";

type NodeKey = string | number;

type HistoryEntry = {
  id: number;
  text: string;
  op: Operation;
  before: ListNode[];
  after: ListNode[];
  activeId: NodeKey | null;
  traversal: string[] | null;
  line: number;
};

type HistoryMeta = Omit<HistoryEntry, "id" | "text">;
type Step = { line: number | null; run: () => void };

const coralButton =
  "bg-[#F08080] text-white hover:bg-[#E56B6B] dark:bg-[#F08080] dark:hover:bg-[#E56B6B]";

const pseudocode: Record<
  Operation,
  {
    title: string;
    lines: string[];
    explanation: string;
    complexity: string;
  }
> = {
  enqueue: {
    title: "Enqueue",
    lines: [
      "// Add an element to the rear",
      "function enqueue(queue, value):",
      "    newNode = createNode(value)",
      "    if queue is empty:",
      "        front = newNode",
      "    else:",
      "        rear.next = newNode",
      "    rear = newNode",
      "    size = size + 1",
      "    return queue",
    ],
    explanation:
      "Enqueue adds a new element at the rear of the queue. The front remains unchanged unless the queue was empty.",
    complexity: "O(1)",
  },
  dequeue: {
    title: "Dequeue",
    lines: [
      "// Remove the front element",
      "function dequeue(queue):",
      "    if queue is empty:",
      '        return "Queue is empty"',
      "    removed = front.value",
      "    front = front.next",
      "    size = size - 1",
      "    if front is null:",
      "        rear = null",
      "    return removed",
    ],
    explanation:
      "Dequeue removes the front element, following FIFO (First In, First Out).",
    complexity: "O(1)",
  },
  peek: {
    title: "Peek",
    lines: [
      "// Read the front element",
      "function peek(queue):",
      "    if queue is empty:",
      '        return "Queue is empty"',
      "    return front.value",
    ],
    explanation:
      "Peek reads the front element without removing it. The queue remains unchanged.",
    complexity: "O(1)",
  },
  search: {
    title: "Search",
    lines: [
      "// Find a value in the queue",
      "function search(queue, target):",
      "    current = front",
      "    index = 0",
      "    while current is not null:",
      "        if current.value == target:",
      "            return index",
      "        current = current.next",
      "        index = index + 1",
      "    return -1",
    ],
    explanation:
      "Search visits each node from front to rear. It returns the zero-based position or -1 if the target is not found.",
    complexity: "O(n)",
  },
  traverse: {
    title: "Traverse",
    lines: [
      "// Visit every element from front to rear",
      "function traverse(queue):",
      "    current = front",
      "    while current is not null:",
      "        visit(current.value)",
      "        current = current.next",
      "    return",
    ],
    explanation:
      "Traversal visits every queue element in FIFO order, from the front to the rear.",
    complexity: "O(n)",
  },
  clear: {
    title: "Clear Queue",
    lines: [
      "// Remove all elements",
      "function clearQueue(queue):",
      "    front = null",
      "    rear = null",
      "    size = 0",
      "    return queue",
    ],
    explanation:
      "Clearing removes all elements and leaves the queue empty.",
    complexity: "O(1)",
  },
};

const complexityRows = [
  {
    operation: "Enqueue",
    key: "enqueue",
    time: "O(1)",
    why: "Add a node at the rear.",
  },
  {
    operation: "Dequeue",
    key: "dequeue",
    time: "O(1)",
    why: "Remove the front element.",
  },
  {
    operation: "Peek",
    key: "peek",
    time: "O(1)",
    why: "Read the front element directly.",
  },
  {
    operation: "Search",
    key: "search",
    time: "O(n)",
    why: "The target may be anywhere in the queue.",
  },
  {
    operation: "Traverse",
    key: "traverse",
    time: "O(n)",
    why: "Visit every node once.",
  },
  {
    operation: "Clear Queue",
    key: "clear",
    time: "O(1)",
    why: "Reset the queue to an empty state.",
  },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;
const MAX_HISTORY = 50;

function getNodeValue(node: ListNode): string {
  const item = node as ListNode & { data?: number | string };
  return String(item.value ?? item.data ?? "");
}

function getNodeId(node: ListNode, index: number): NodeKey {
  const item = node as ListNode & { id?: string | number };
  return item.id ?? `${getNodeValue(node)}-${index}`;
}

export default function QueueVisualizer() {
  const [queue, setQueue] = useState<ListNode[]>([]);
  const [nextId, setNextId] = useState(1);

  const [inputValue, setInputValue] = useState("40");
  const [searchValue, setSearchValue] = useState("");
  const [message, setMessage] = useState(
    "Choose an operation to get started."
  );
  const [operation, setOperation] = useState<Operation>("enqueue");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [highlightedId, setHighlightedId] = useState<NodeKey | null>(null);
  const [traversal, setTraversal] = useState<string[] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [replayEntryId, setReplayEntryId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  const [randomCount, setRandomCount] = useState("5");
  const [randomMin, setRandomMin] = useState("1");
  const [randomMax, setRandomMax] = useState("99");

  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1");
  const [undoStack, setUndoStack] = useState<ListNode[][]>([]);
  const [redoStack, setRedoStack] = useState<ListNode[][]>([]);
  const [newIds, setNewIds] = useState<NodeKey[]>([]);

  const queueRef = useRef(queue);
  queueRef.current = queue;

  const nextIdRef = useRef(nextId);
  nextIdRef.current = nextId;

  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;

  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<Step[] | null>(null);
  const frameIndexRef = useRef(0);
  const replayOriginalRef = useRef<ListNode[] | null>(null);
  const historyIdRef = useRef(1);
  const prevIdsRef = useRef<Set<NodeKey>>(new Set());

  const selectedCode = pseudocode[operation];

  useEffect(() => {
    const prev = prevIdsRef.current;
    const ids = queue.map((node, i) => getNodeId(node, i));
    const added = ids.filter((id) => !prev.has(id));

    prevIdsRef.current = new Set(ids);

    if (added.length === 0) {
      setNewIds([]);
      return;
    }

    setNewIds(added);
    const timer = setTimeout(() => setNewIds([]), 1600);

    return () => clearTimeout(timer);
  }, [queue]);

  useEffect(() => {
    return () => {
      if (playbackTimer.current !== null) {
        clearTimeout(playbackTimer.current);
      }
    };
  }, []);

  function recordHistory(text: string, meta?: HistoryMeta) {
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

  function updateQueue(nextQueue: ListNode[]) {
    const current = queueRef.current;

    setUndoStack((old) => [...old, [...current]]);
    setRedoStack([]);
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    setHighlightedId(null);
    setTraversal(null);
  }

  /* ---------- HISTORY REPLAY ---------- */

  function abortReplay() {
    if (playbackTimer.current !== null) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }

    setIsPlaying(false);

    if (replayOriginalRef.current) {
      const original = replayOriginalRef.current;
      replayOriginalRef.current = null;
      queueRef.current = original;
      setQueue(original);
    }

    framesRef.current = null;
    frameIndexRef.current = 0;
    setReplayEntryId(null);
    setHighlightedId(null);
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

    const entries = history.slice().reverse();
    const original = queueRef.current;
    replayOriginalRef.current = original;

    const frames: Step[] = [];

    frames.push({
      line: null,
      run: () => {
        const start = entries[0].before;
        queueRef.current = start;
        setQueue(start);
        setHighlightedId(null);
        setTraversal(null);
        setReplayEntryId(null);
        setMessage("Replay started from the initial state.");
      },
    });

    entries.forEach((entry) => {
      const title = pseudocode[entry.op].title;

      frames.push({
        line: 1,
        run: () => {
          setOperation(entry.op);
          setReplayEntryId(entry.id);
          setTraversal(null);
          setHighlightedId(
            entry.op === "dequeue" ? entry.activeId : null
          );
          setMessage(`Replaying: ${title}`);
        },
      });

      frames.push({
        line: entry.line,
        run: () => {
          queueRef.current = entry.after;
          setQueue(entry.after);
          setHighlightedId(
            entry.op === "dequeue" ? null : entry.activeId
          );
          setTraversal(entry.traversal);
          setMessage(entry.text);
        },
      });
    });

    frames.push({
      line: null,
      run: () => {
        queueRef.current = original;
        setQueue(original);
        replayOriginalRef.current = null;
        setReplayEntryId(null);
        setHighlightedId(null);
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

    const current = queueRef.current;
    const previous = undoStack[undoStack.length - 1];

    setRedoStack((old) => [...old, [...current]]);
    setUndoStack((old) => old.slice(0, -1));

    queueRef.current = [...previous];
    setQueue([...previous]);
    setTraversal(null);
    setHighlightedId(null);
    setMessage("Undo successful.");
  }

  function handleRedo() {
    abortReplay();

    if (redoStack.length === 0) return;

    const current = queueRef.current;
    const next = redoStack[redoStack.length - 1];

    setUndoStack((old) => [...old, [...current]]);
    setRedoStack((old) => old.slice(0, -1));

    queueRef.current = [...next];
    setQueue([...next]);
    setTraversal(null);
    setHighlightedId(null);
    setMessage("Redo successful.");
  }

  /* ---------- QUEUE OPERATIONS ---------- */

  function handleEnqueue() {
    if (inputValue.trim() === "") {
      setMessage("Please enter a value to enqueue.");
      return;
    }

    const value = Number(inputValue);

    if (!Number.isFinite(value)) {
      setMessage("Please enter a valid number.");
      return;
    }

    abortReplay();

    const before = queueRef.current;
    const id = nextIdRef.current;
    const after = enqueue(before, value, id);
    const newNodeId = getNodeId(after[after.length - 1], after.length - 1);

    setOperation("enqueue");
    setActiveLine(6);
    updateQueue(after);
    setHighlightedId(newNodeId);

    nextIdRef.current = id + 1;
    setNextId(id + 1);
    setInputValue("");

    recordHistory(`Enqueued ${value} at the rear.`, {
      op: "enqueue",
      before,
      after,
      activeId: newNodeId,
      traversal: null,
      line: 6,
    });
  }

  function handleDequeue() {
    abortReplay();

    const before = queueRef.current;
    setOperation("dequeue");
    setTraversal(null);

    if (before.length === 0) {
      setHighlightedId(null);
      setActiveLine(2);
      setMessage("Cannot dequeue from an empty queue.");
      return;
    }

    const removed = before[0];
    const removedValue = getNodeValue(removed);
    const after = before.slice(1);

    setActiveLine(5);
    updateQueue(after);

    recordHistory(`Dequeued ${removedValue} from the front.`, {
      op: "dequeue",
      before,
      after,
      activeId: getNodeId(removed, 0),
      traversal: null,
      line: 5,
    });
  }

  function handlePeek() {
    abortReplay();

    const q = queueRef.current;
    setOperation("peek");
    setTraversal(null);

    if (q.length === 0) {
      setHighlightedId(null);
      setActiveLine(2);
      setMessage("The queue is empty. There is no front element.");
      return;
    }

    const frontValue = getNodeValue(q[0]);
    const frontId = getNodeId(q[0], 0);

    setHighlightedId(frontId);
    setActiveLine(4);

    recordHistory(
      `Front element: ${frontValue}. The queue remains unchanged.`,
      {
        op: "peek",
        before: q,
        after: q,
        activeId: frontId,
        traversal: null,
        line: 4,
      }
    );
  }

  function handleSearch() {
    if (searchValue.trim() === "") {
      setMessage("Enter a value to search for.");
      return;
    }

    const target = Number(searchValue);

    if (!Number.isFinite(target)) {
      setMessage("Please enter a valid number to search for.");
      return;
    }

    abortReplay();

    const q = queueRef.current;
    setOperation("search");
    setTraversal(null);

    const foundIndex = q.findIndex(
      (node) => getNodeValue(node) === String(target)
    );

    const found = foundIndex !== -1;
    const line = found ? 6 : 9;
    const activeId = found
      ? getNodeId(q[foundIndex], foundIndex)
      : null;

    const text = found
      ? `Found ${target} at position ${foundIndex}.`
      : `Value ${target} was not found in the queue.`;

    setHighlightedId(activeId);
    setActiveLine(line);

    recordHistory(text, {
      op: "search",
      before: q,
      after: q,
      activeId,
      traversal: null,
      line,
    });
  }

  function handleTraverse() {
    abortReplay();

    const q = queueRef.current;
    setOperation("traverse");
    setActiveLine(4);
    setHighlightedId(null);

    const values = q.map((node) => getNodeValue(node));
    setTraversal(values);

    recordHistory(
      values.length > 0
        ? `Traversed ${values.length} element(s), from front to rear.`
        : "Traversed an empty queue.",
      {
        op: "traverse",
        before: q,
        after: q,
        activeId: null,
        traversal: values,
        line: 4,
      }
    );
  }

  function handleClear() {
    abortReplay();

    const before = queueRef.current;
    const after: ListNode[] = [];

    setOperation("clear");
    setActiveLine(1);
    updateQueue(after);

    recordHistory("Cleared the queue.", {
      op: "clear",
      before,
      after,
      activeId: null,
      traversal: null,
      line: 1,
    });
  }

  function handleGenerate() {
    const count = Number(randomCount);
    const min = Number(randomMin);
    const max = Number(randomMax);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 20 ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min > max
    ) {
      setMessage(
        "Enter a count from 1–20 and valid integer minimum and maximum values."
      );
      return;
    }

    abortReplay();

    const before = queueRef.current;
    let generatedQueue: ListNode[] = [];
    let id = nextIdRef.current;

    for (let i = 0; i < count; i++) {
      const value = Math.floor(Math.random() * (max - min + 1)) + min;
      generatedQueue = enqueue(generatedQueue, value, id);
      id++;
    }

    updateQueue(generatedQueue);

    nextIdRef.current = id;
    setNextId(id);
    setOperation("traverse");
    setActiveLine(null);

    const values = generatedQueue.map((node) => getNodeValue(node));
    setTraversal(values);

    recordHistory(`Generated a queue with ${count} elements.`, {
      op: "traverse",
      before,
      after: generatedQueue,
      activeId: null,
      traversal: values,
      line: 4,
    });
  }

  function handleZoomIn() {
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.round((current + ZOOM_STEP) * 10) / 10)
    );
  }

  function handleZoomOut() {
    setZoom((current) =>
      Math.max(MIN_ZOOM, Math.round((current - ZOOM_STEP) * 10) / 10)
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <style>{`
        @keyframes node-enter {
          0%   { opacity: 0; transform: translateX(70px) scale(0.9); }
          60%  { opacity: 1; transform: translateX(-6px) scale(1.03); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
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

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F6B6D] dark:text-[#FFAB91] sm:text-2xl">
            Queue Visualizer
          </h1>
          <p className="text-xs text-[#0F6B6D] dark:text-white">
            Explore FIFO operations through an interactive queue.
          </p>
        </div>

        <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          FIFO · Queue
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
                Modify your queue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 p-3 pt-1">
              <div className="space-y-1">
                <label htmlFor="queue-value" className="text-xs font-medium">
                  Element value
                </label>
                <Input
                  id="queue-value"
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEnqueue();
                  }}
                  placeholder="Enter value"
                  className="h-8 text-sm"
                />
              </div>

              <Button
                onClick={handleEnqueue}
                className="h-8 w-full bg-secondary text-xs text-white hover:bg-secondary/90"
              >
                + Enqueue
              </Button>

              <Button
                onClick={handleDequeue}
                className="h-8 w-full bg-secondary text-xs text-white hover:bg-secondary/90"
              >
                − Dequeue
              </Button>

              <Button
                onClick={handlePeek}
                className="h-8 w-full bg-secondary text-xs text-white hover:bg-secondary/90"
              >
                Peek Front
              </Button>

              <Button
                onClick={handleSearch}
                className="h-8 w-full bg-secondary text-xs text-white hover:bg-secondary/90"
              >
                Search Value
              </Button>

              <Button
                onClick={handleTraverse}
                className="h-8 w-full bg-secondary text-xs text-white hover:bg-secondary/90"
              >
                Traverse Queue
              </Button>

              <Button
                onClick={handleClear}
                className="h-8 w-full bg-secondary text-xs text-white hover:bg-secondary/90"
              >
                Clear Queue
              </Button>
            </CardContent>
          </Card>

          {/* RANDOM QUEUE */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Random Queue</CardTitle>
              <CardDescription className="text-xs">
                Generate sample values
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 p-3 pt-1">
              <div className="space-y-1">
                <label htmlFor="queue-count" className="text-xs font-medium">
                  Element count
                </label>
                <Input
                  id="queue-count"
                  type="number"
                  min={1}
                  max={20}
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label htmlFor="queue-min" className="text-xs font-medium">
                    Minimum
                  </label>
                  <Input
                    id="queue-min"
                    type="number"
                    value={randomMin}
                    onChange={(e) => setRandomMin(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="queue-max" className="text-xs font-medium">
                    Maximum
                  </label>
                  <Input
                    id="queue-max"
                    type="number"
                    value={randomMax}
                    onChange={(e) => setRandomMax(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                variant="outline"
                className="h-8 w-full text-xs"
              >
                Generate Queue
              </Button>
            </CardContent>
          </Card>

          {/* HISTORY */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
              <div>
                <CardTitle className="text-sm">History</CardTitle>
                <CardDescription className="text-xs">
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
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`border-l-2 pl-2 text-xs transition-colors ${
                        replayEntryId === item.id
                          ? "border-red-600 bg-red-50 font-medium text-red-800"
                          : "border-red-200 text-muted-foreground"
                      }`}
                    >
                      {item.text}
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
                  Learn, Play and Create
                </CardTitle>
                <CardDescription className="text-xs">
                  Watch elements move from the front to the rear of the queue.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= MIN_ZOOM}
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
                  disabled={zoom >= MAX_ZOOM}
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
                    variant="outline"
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className={`gap-2 ${coralButton}`}
                  >
                    <Play className="h-4 w-4" />
                    Play
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePause}
                    disabled={!isPlaying}
                    className={`gap-2 ${coralButton}`}
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className={`gap-2 ${coralButton}`}
                  >
                    <Undo2 className="h-4 w-4" />
                    Undo
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className={`gap-2 ${coralButton}`}
                  >
                    <Redo2 className="h-4 w-4" />
                    Redo
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

              {/* STATISTICS */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Front
                  </p>
                  <p className="truncate text-lg font-semibold">
                    {queue.length > 0 ? getNodeValue(queue[0]) : "—"}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Queue Size
                  </p>
                  <p className="text-lg font-semibold">{queue.length}</p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Rear
                  </p>
                  <p className="truncate text-lg font-semibold">
                    {queue.length > 0
                      ? getNodeValue(queue[queue.length - 1])
                      : "—"}
                  </p>
                </div>
              </div>

              {/* QUEUE DIAGRAM */}
              <div className="flex min-h-[500px] min-w-0 flex-col overflow-hidden rounded-lg border bg-muted/10">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-medium">Queue Structure</span>
                  <Badge variant="outline" className="text-[10px]">
                    FIFO
                  </Badge>
                </div>

                <div className="relative flex min-h-[450px] min-w-0 flex-1 overflow-auto p-6">
                  {queue.length === 0 ? (
                    <div className="m-auto text-center">
                      <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 text-2xl text-muted-foreground">
                        ∅
                      </div>
                      <p className="text-sm font-medium">Queue is empty</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Enqueue a value to add the first element.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="m-auto flex min-w-max items-center gap-3 px-3 py-8 transition-transform"
                      style={{
                        zoom,
                        minHeight: "300px",
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Badge className="bg-red-600 text-white hover:bg-red-600">
                          FRONT
                        </Badge>
                        <div className="text-xl text-red-600">↓</div>
                      </div>

                      {queue.map((node, index) => {
                        const value = getNodeValue(node);
                        const nodeId = getNodeId(node, index);
                        const isHighlighted = highlightedId === nodeId;
                        const isFront = index === 0;
                        const isRear = index === queue.length - 1;
                        const isNew = newIds.includes(nodeId);
                        const newOrder = newIds.indexOf(nodeId);

                        return (
                          <div
                            key={nodeId}
                            className="flex shrink-0 items-center gap-3"
                          >
                            <div className="flex flex-col items-center gap-2">
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
                                className={`anim-new relative flex h-14 min-w-36 shrink-0 items-center justify-between gap-5 border-2 px-4 transition-colors ${
                                  isHighlighted
                                    ? "z-10 border-red-600 bg-red-100 text-red-900 ring-2 ring-red-300"
                                    : isFront
                                      ? "border-red-400 bg-red-50 text-red-800"
                                      : "border-border bg-card text-foreground"
                                }`}
                              >
                                <span className="text-[10px] text-muted-foreground">
                                  #{index}
                                </span>

                                <span className="text-lg font-bold">
                                  {value}
                                </span>

                                {isNew && (
                                  <span
                                    className="absolute -left-2 -top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-semibold text-white"
                                    style={{
                                      animation: "badge-pop 400ms ease-out both",
                                    }}
                                  >
                                    NEW
                                  </span>
                                )}

                                {isHighlighted && (
                                  <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                    ACTIVE
                                  </span>
                                )}
                              </div>

                              {isFront && (
                                <Badge className="bg-red-600 text-white hover:bg-red-600">
                                  FRONT
                                </Badge>
                              )}

                              {isRear && (
                                <Badge variant="outline" className="text-[10px]">
                                  REAR
                                </Badge>
                              )}
                            </div>

                            {index < queue.length - 1 && (
                              <div className="flex flex-col items-center">
                                <span className="text-xl text-muted-foreground">
                                  →
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  next
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="outline">REAR</Badge>
                        <div className="text-xl text-muted-foreground">↑</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* QUEUE REPRESENTATION */}
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold">
                    Queue Representation
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    Front → Rear
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {queue.length === 0 ? (
                    <span className="text-xs text-muted-foreground">[]</span>
                  ) : (
                    queue.map((node, index) => {
                      const nodeId = getNodeId(node, index);

                      return (
                        <div
                          key={`${nodeId}-array`}
                          style={
                            newIds.includes(nodeId)
                              ? {
                                  animation:
                                    "node-enter 500ms ease-out both, node-glow 1000ms ease-out 500ms",
                                }
                              : undefined
                          }
                          className={`anim-new rounded-md border px-3 py-1.5 font-mono text-xs ${
                            highlightedId === nodeId
                              ? "border-red-400 bg-red-50 font-semibold text-red-700"
                              : "bg-muted/20"
                          }`}
                        >
                          {getNodeValue(node)}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* TRAVERSAL OUTPUT */}
              <div className="rounded-lg border bg-muted/10 p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    Traversal / Operation Output
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedCode.complexity}
                  </Badge>
                </div>

                {traversal !== null ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {traversal.length > 0 ? (
                      traversal.map((value, index) => (
                        <span
                          key={`${value}-${index}-traversal`}
                          className="flex items-center gap-2"
                        >
                          <span className="rounded-md bg-red-100 px-2 py-1 font-mono text-xs font-medium text-red-800">
                            {value}
                          </span>

                          {index < traversal.length - 1 && (
                            <span className="text-xs text-muted-foreground">
                              →
                            </span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        The queue is empty.
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* BOTTOM ROW: PSEUDOCODE + COMPLEXITY */}
          <div className="grid min-w-0 grid-cols-1 items-start gap-3 md:grid-cols-2">
            {/* PSEUDOCODE */}
            <Card className="flex min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm">Pseudocode</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {selectedCode.title}
                  </Badge>
                </div>

                <CardDescription className="text-xs">
                  Follow the selected operation step by step.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 p-3 pt-1 sm:p-4 sm:pt-1">
                <div className="max-h-[260px] overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100">
                  {selectedCode.lines.map((line, index) => (
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
                  <p className="mb-2 text-xs font-semibold">How it works</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {selectedCode.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* TIME COMPLEXITY */}
            <Card className="flex min-w-0 flex-col overflow-hidden md:max-h-[560px]">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm">Time Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Performance of Queue Operations
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto p-3 pt-1 sm:p-4 sm:pt-1">
                <div className="space-y-2">
                  {complexityRows.map((item) => {
                    const isActive = item.key === operation;

                    return (
                      <div
                        key={item.operation}
                        className={`rounded-lg border p-3 transition-colors ${
                          isActive
                            ? "border-red-300 bg-red-50/70 dark:border-[#FFAB91]/60 dark:bg-[#FFAB91]/10"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            {item.operation}
                          </p>

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

                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {item.why}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-semibold">Space Complexity</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    A queue containing n elements requires O(n) space.
                    Enqueue and dequeue take O(1) time per operation.
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
