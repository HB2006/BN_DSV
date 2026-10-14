"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Undo2, Redo2, Gauge } from "lucide-react";
import type { StackNode } from "./type";
import {
  push,
  pop,
  peekStack,
  searchStack,
  clearStack,
} from "./stack-operation";
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

type Operation = "push" | "pop" | "peek" | "search" | "traverse" | "clear";

type HistoryEntry = {
  id: number;
  text: string;
  op: Operation;
  before: StackNode[];
  after: StackNode[];
  activeId: number | null;
  traversal: number[] | null;
  line: number;
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
  push: {
    title: "Push",
    lines: [
      "// Add an element to the top",
      "newNode = Node(value)",
      "stack[top + 1] = newNode",
      "top = top + 1",
      "return",
    ],
    explanation: [
      "Create a new node containing the value.",
      "Place the node above the current top element.",
      "Update the top position.",
      "The new element is now at the top.",
    ],
    complexity: "O(1)",
  },
  pop: {
    title: "Pop",
    lines: [
      "// Remove the top element",
      "if stack is empty:",
      "    return error",
      "value = stack[top]",
      "remove stack[top]",
      "top = top - 1",
      "return value",
    ],
    explanation: [
      "Check whether the stack is empty.",
      "Read the value at the top.",
      "Remove the top element.",
      "Update the top position.",
      "Return the removed value.",
    ],
    complexity: "O(1)",
  },
  peek: {
    title: "Peek",
    lines: [
      "// View the top element",
      "if stack is empty:",
      "    return error",
      "return stack[top]",
    ],
    explanation: [
      "Check whether the stack is empty.",
      "Access the top element.",
      "Return its value without removing it.",
    ],
    complexity: "O(1)",
  },
  search: {
    title: "Search",
    lines: [
      "// Find a value in the stack",
      "for index = top down to 0:",
      "    if stack[index].value == value:",
      "        return index",
      "return -1",
    ],
    explanation: [
      "Start searching from the top.",
      "Compare each element with the target value.",
      "Return the index when a match is found.",
      "Return -1 if the value is absent.",
    ],
    complexity: "O(n)",
  },
  traverse: {
    title: "Traverse",
    lines: [
      "// Visit elements from top to bottom",
      "for index = top down to 0:",
      "    visit(stack[index].value)",
      "return",
    ],
    explanation: [
      "Start at the top of the stack.",
      "Visit the current element.",
      "Move down one position.",
      "Stop after visiting the bottom element.",
    ],
    complexity: "O(n)",
  },
  clear: {
    title: "Clear Stack",
    lines: [
      "// Remove all elements",
      "stack = []",
      "top = -1",
      "return",
    ],
    explanation: [
      "Remove all elements from the stack.",
      "Reset the top position to -1.",
      "The stack is now empty.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows = [
  { operation: "Push", key: "push", time: "O(1)", why: "Add an element to the top." },
  { operation: "Pop", key: "pop", time: "O(1)", why: "Remove the top element." },
  { operation: "Peek", key: "peek", time: "O(1)", why: "Read the top element." },
  { operation: "Search", key: "search", time: "O(n)", why: "May inspect every element." },
  { operation: "Traverse", key: "traverse", time: "O(n)", why: "Visit every element once." },
  { operation: "Clear Stack", key: "clear", time: "O(1)", why: "Replace the stack with an empty array." },
];

const coralButton =
  "bg-[#F08080] text-white hover:bg-[#E56B6B] dark:bg-[#F08080] dark:hover:bg-[#E56B6B]";

const MAX_HISTORY = 50;

export function StackVisualizer() {
  const [stack, setStack] = useState<StackNode[]>([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1");
  const [undoStack, setUndoStack] = useState<StackNode[][]>([]);
  const [redoStack, setRedoStack] = useState<StackNode[][]>([]);
  const [value, setValue] = useState("40");
  const [nextId, setNextId] = useState(4);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>("push");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [message, setMessage] = useState("Choose an operation to get started.");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [replayEntryId, setReplayEntryId] = useState<number | null>(null);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [zoom, setZoom] = useState(1);
  const [randomCount, setRandomCount] = useState("5");
  const [randomMin, setRandomMin] = useState("1");
  const [randomMax, setRandomMax] = useState("99");

  // Latest-value refs so timer callbacks never see stale state
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const nextIdRef = useRef(nextId);
  nextIdRef.current = nextId;
  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;

  // Replay machinery
  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<Step[] | null>(null);
  const frameIndexRef = useRef(0);
  const replayOriginalRef = useRef<StackNode[] | null>(null);
  const historyIdRef = useRef(1);

  // New-node animation tracking
  const [newIds, setNewIds] = useState<number[]>([]);
  const prevIdsRef = useRef<Set<number>>(new Set(stack.map((n) => n.id)));

  const selectedCode = pseudocode[operation];

  // Detect any node that appeared (push, redo, undo of pop, generate, replay)
  useEffect(() => {
    const prev = prevIdsRef.current;
    const added = stack.filter((n) => !prev.has(n.id)).map((n) => n.id);
    prevIdsRef.current = new Set(stack.map((n) => n.id));

    if (added.length === 0) {
      setNewIds([]);
      return;
    }
    setNewIds(added);
    const t = setTimeout(() => setNewIds([]), 1600);
    return () => clearTimeout(t);
  }, [stack]);

  // Clear playback timer on unmount
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

  function readNumber(): number | null {
    if (value.trim() === "" || !Number.isFinite(Number(value))) {
      setMessage("Enter a valid number first.");
      return null;
    }
    return Number(value);
  }

  function updateStack(nextStack: StackNode[]) {
    const current = stackRef.current;
    setUndoStack((old) => [...old, [...current]]);
    setRedoStack([]);
    stackRef.current = nextStack;
    setStack(nextStack);
    setActiveNode(null);
    setTraversal(null);
  }

  /* ---------- HISTORY REPLAY ---------- */

  // Stops any replay and puts the real stack back
  function abortReplay() {
    if (playbackTimer.current !== null) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
    setIsPlaying(false);
    if (replayOriginalRef.current) {
      const original = replayOriginalRef.current;
      replayOriginalRef.current = null;
      stackRef.current = original;
      setStack(original);
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
    const original = stackRef.current;
    replayOriginalRef.current = original;

    const frames: Step[] = [];

    // 1. Rewind to the state before the first recorded operation
    frames.push({
      line: null,
      run: () => {
        const start = entries[0].before;
        stackRef.current = start;
        setStack(start);
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
        line: 1,
        run: () => {
          setOperation(entry.op);
          setReplayEntryId(entry.id);
          setTraversal(null);
          setActiveNode(entry.op === "pop" ? entry.activeId : null);
          setMessage(`Replaying: ${title}`);
        },
      });
      frames.push({
        line: entry.line,
        run: () => {
          stackRef.current = entry.after;
          setStack(entry.after);
          setActiveNode(entry.op === "pop" ? null : entry.activeId);
          setTraversal(entry.traversal);
          setMessage(entry.text);
        },
      });
    });

    // 3. Put the real stack back (matters if you used Undo/Redo earlier)
    frames.push({
      line: null,
      run: () => {
        stackRef.current = original;
        setStack(original);
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
    const current = stackRef.current;
    const previousStack = undoStack[undoStack.length - 1];
    setRedoStack((old) => [...old, [...current]]);
    setUndoStack((old) => old.slice(0, -1));
    stackRef.current = [...previousStack];
    setStack([...previousStack]);
    setTraversal(null);
    setMessage("Undo successful.");
  }

  function handleRedo() {
    abortReplay();
    if (redoStack.length === 0) return;
    const current = stackRef.current;
    const nextStack = redoStack[redoStack.length - 1];
    setUndoStack((old) => [...old, [...current]]);
    setRedoStack((old) => old.slice(0, -1));
    stackRef.current = [...nextStack];
    setStack([...nextStack]);
    setTraversal(null);
    setMessage("Redo successful.");
  }

  /* ---------- OPERATIONS (sidebar buttons) ---------- */

  function handlePush() {
    const n = readNumber();
    if (n === null) return;
    abortReplay();
    const before = stackRef.current;
    const id = nextIdRef.current;
    const after = push(before, n, id);
    setOperation("push");
    setActiveLine(2);
    updateStack(after);
    setActiveNode(id);
    nextIdRef.current = id + 1;
    setNextId(id + 1);
    recordHistory(`Pushed ${n} onto the stack.`, {
      op: "push",
      before,
      after,
      activeId: id,
      traversal: null,
      line: 2,
    });
  }

  function handlePop() {
    abortReplay();
    const before = stackRef.current;
    setOperation("pop");
    setTraversal(null);
    if (before.length === 0) {
      setActiveNode(null);
      setActiveLine(2);
      setMessage("Cannot pop from an empty stack.");
      return;
    }
    const removed = before[before.length - 1];
    const after = pop(before);
    setActiveLine(4);
    updateStack(after);
    recordHistory(`Popped ${removed.value} from the top.`, {
      op: "pop",
      before,
      after,
      activeId: removed.id,
      traversal: null,
      line: 4,
    });
  }

  function handlePeek() {
    abortReplay();
    const s = stackRef.current;
    setOperation("peek");
    setTraversal(null);
    if (s.length === 0) {
      setActiveNode(null);
      setActiveLine(2);
      setMessage("The stack is empty.");
      return;
    }
    const topValue = peekStack(s);
    const topId = s[s.length - 1].id;
    setActiveNode(topId);
    setActiveLine(3);
    recordHistory(`Top element: ${topValue}. The stack remains unchanged.`, {
      op: "peek",
      before: s,
      after: s,
      activeId: topId,
      traversal: null,
      line: 3,
    });
  }

  function handleSearch() {
    const n = readNumber();
    if (n === null) return;
    abortReplay();
    const s = stackRef.current;
    setOperation("search");
    setTraversal(null);
    const index = searchStack(s, n);
    const line = index === -1 ? 4 : 3;
    const activeId = index === -1 ? null : s[index].id;
    setActiveLine(line);
    setActiveNode(activeId);
    const text =
      index === -1
        ? `Value ${n} was not found in the stack.`
        : `Found ${n} at array index ${index}, position ${
            s.length - 1 - index
          } from the top.`;
    recordHistory(text, {
      op: "search",
      before: s,
      after: s,
      activeId,
      traversal: null,
      line,
    });
  }

  function handleTraverse() {
    abortReplay();
    const s = stackRef.current;
    setOperation("traverse");
    setActiveLine(2);
    setActiveNode(null);
    const values = s
      .slice()
      .reverse()
      .map((node) => node.value);
    setTraversal(values);
    recordHistory(`Traversed ${s.length} element(s), from top to bottom.`, {
      op: "traverse",
      before: s,
      after: s,
      activeId: null,
      traversal: values,
      line: 2,
    });
  }

  function handleClear() {
    abortReplay();
    const before = stackRef.current;
    const after = clearStack();
    setOperation("clear");
    setActiveLine(1);
    setTraversal(null);
    updateStack(after);
    recordHistory("Cleared the stack.", {
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
    const before = stackRef.current;
    let generatedStack: StackNode[] = [];
    let id = nextIdRef.current;
    for (let i = 0; i < count; i++) {
      const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
      generatedStack = push(generatedStack, randomValue, id);
      id++;
    }
    updateStack(generatedStack);
    nextIdRef.current = id;
    setNextId(id);
    setOperation("traverse");
    setActiveNode(null);
    setActiveLine(null);
    const values = generatedStack
      .slice()
      .reverse()
      .map((node) => node.value);
    setTraversal(values);
    recordHistory(`Generated a stack with ${count} elements.`, {
      op: "traverse",
      before,
      after: generatedStack,
      activeId: null,
      traversal: values,
      line: 2,
    });
  }

  function handleZoomIn() {
    setZoom((current) => Math.min(1.8, Math.round((current + 0.1) * 10) / 10));
  }

  function handleZoomOut() {
    setZoom((current) => Math.max(0.5, Math.round((current - 0.1) * 10) / 10));
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <style>{`
        @keyframes node-drop {
          0%   { opacity: 0; transform: translateY(-90px) scale(0.9); }
          60%  { opacity: 1; transform: translateY(6px) scale(1.03); }
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

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F6B6D] sm:text-2xl">
            Stack Visualizer
          </h1>
          <p className="text-xs text-[#0F6B6D]">
            Explore LIFO operations through an interactive stack.
          </p>
        </div>
        <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          LIFO · Stack
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
                Modify your stack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-3 pt-1">
              <div className="space-y-1">
                <label htmlFor="stack-value" className="text-xs font-medium">
                  Element value
                </label>
                <Input
                  id="stack-value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePush();
                  }}
                  placeholder="Enter value"
                  className="h-8 text-sm"
                />
              </div>
<Button
  onClick={handlePush}
  className={`h-8 w-full text-xs bg-secondary text-white hover:bg-secondary/90`}
>
  + Push
</Button>

<Button
  onClick={handlePop}
  className="h-8 w-full text-xs bg-secondary text-white hover:bg-secondary/90"
>
  − Pop
</Button>

<Button
  onClick={handlePeek}
  className="h-8 w-full text-xs bg-secondary text-white hover:bg-secondary/90"
>
  Peek Top
</Button>

<Button
  onClick={handleSearch}
  className="h-8 w-full text-xs bg-secondary text-white hover:bg-secondary/90"
>
  Search Value
</Button>

<Button
  onClick={handleTraverse}
  className="h-8 w-full text-xs bg-secondary text-white hover:bg-secondary/90"
>
  Traverse Stack
</Button>

<Button
  onClick={handleClear}
  className="h-8 w-full text-xs bg-secondary text-white hover:bg-secondary/90"
>
  Clear Stack
</Button>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Minimum</label>
                  <Input
                    type="number"
                    value={randomMin}
                    onChange={(e) => setRandomMin(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Maximum</label>
                  <Input
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
                Generate Stack
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
                  Watch elements move in and out of the stack.
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
                    variant="outline"
                    onClick={handlePlay}
                    disabled={isPlaying}
                    className={`gap-2 ${coralButton}`}
                  >
                    <Play className="h-4 w-4" /> Play
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handlePause}
                    disabled={!isPlaying}
                    className={`gap-2 ${coralButton}`}
                  >
                    <Pause className="h-4 w-4" /> Pause
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className={`gap-2 ${coralButton}`}
                  >
                    <Undo2 className="h-4 w-4" /> Undo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className={`gap-2 ${coralButton}`}
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

              {/* STATISTICS */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Top
                  </p>
                  <p className="truncate text-lg font-semibold">
                    {stack.length > 0 ? stack[stack.length - 1].value : "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Stack Size
                  </p>
                  <p className="text-lg font-semibold">{stack.length}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Bottom
                  </p>
                  <p className="truncate text-lg font-semibold">
                    {stack.length > 0 ? stack[0].value : "—"}
                  </p>
                </div>
              </div>

              {/* STACK DIAGRAM */}
              <div className="flex min-h-[500px] flex-col overflow-hidden rounded-lg border bg-muted/10">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-medium">Stack Structure</span>
                  <Badge variant="outline" className="text-[10px]">
                    LIFO
                  </Badge>
                </div>
                <div className="relative flex min-h-[450px] min-w-0 flex-1 overflow-auto p-6">
                  {stack.length === 0 ? (
                    <div className="m-auto text-center">
                      <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 text-2xl text-muted-foreground">
                        ∅
                      </div>
                      <p className="text-sm font-medium">Stack is empty</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Push a value to add the first element.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="m-auto flex min-w-max flex-col items-center px-3 py-8 transition-transform"
                      style={{
                        zoom,
                        minHeight: `${stack.length * 56 + 140}px`,
                      }}
                    >
                      <Badge className="mb-2 bg-red-600 text-white hover:bg-red-600">
                        TOP
                      </Badge>
                      <div className="mb-1 text-xl text-red-600">↓</div>
                      {stack
                        .slice()
                        .reverse()
                        .map((node, index) => {
                          const originalIndex = stack.length - 1 - index;
                          const isTop = index === 0;
                          const isBottom = originalIndex === 0;
                          const isActive = activeNode === node.id;
                          const isNew = newIds.includes(node.id);
                          const newOrder = newIds.indexOf(node.id);
                          return (
                            <div
                              key={node.id}
                              style={
                                isNew
                                  ? {
                                      animation: `node-drop 600ms cubic-bezier(0.2, 0.8, 0.2, 1) ${
                                        newOrder * 120
                                      }ms both, node-glow 1200ms ease-out ${
                                        600 + newOrder * 120
                                      }ms`,
                                    }
                                  : undefined
                              }
                              className={`anim-new relative flex h-14 min-w-36 shrink-0 items-center justify-between gap-5 border-2 px-4 transition-colors ${
                                isTop ? "rounded-t-xl" : ""
                              } ${isBottom ? "rounded-b-xl" : ""} ${
                                isActive
                                  ? "z-10 border-red-600 bg-red-100 text-red-900 ring-2 ring-red-300"
                                  : isTop
                                    ? "border-red-400 bg-red-50 text-red-800"
                                    : "border-border bg-card text-foreground"
                              }`}
                            >
                              <span className="text-[10px] text-muted-foreground">
                                #{originalIndex}
                              </span>
                              <span className="text-lg font-bold">
                                {node.value}
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
                              {isActive && (
                                <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                          );
                        })}
                      <div className="mt-1 text-xl text-muted-foreground">↓</div>
                      <Badge variant="outline" className="mt-2">
                        BOTTOM
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* ARRAY REPRESENTATION */}
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Array Representation</p>
                  <span className="text-[10px] text-muted-foreground">
                    Bottom → Top
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {stack.length === 0 ? (
                    <span className="text-xs text-muted-foreground">[]</span>
                  ) : (
                    stack.map((node) => (
                      <div
                        key={node.id}
                        style={
                          newIds.includes(node.id)
                            ? {
                                animation:
                                  "node-drop 500ms ease-out both, node-glow 1000ms ease-out 500ms",
                              }
                            : undefined
                        }
                        className={`anim-new rounded-md border px-3 py-1.5 font-mono text-xs ${
                          activeNode === node.id
                            ? "border-red-400 bg-red-50 font-semibold text-red-700"
                            : "bg-muted/20"
                        }`}
                      >
                        {node.value}
                      </div>
                    ))
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
                      traversal.map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="flex items-center gap-2"
                        >
                          <span className="rounded-md bg-red-100 px-2 py-1 font-mono text-xs font-medium text-red-800">
                            {item}
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
                        The stack is empty.
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
                  <ol className="list-decimal space-y-1 pl-4">
                    {selectedCode.explanation.map((step, index) => (
                      <li
                        key={`${operation}-explanation-${index}`}
                        className="text-xs leading-relaxed text-muted-foreground"
                      >
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* TIME COMPLEXITY */}
            <Card className="flex min-w-0 flex-col overflow-hidden md:max-h-[560px]">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm">Time Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Performance of stack operations
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
                          isActive ? "border-red-300 bg-red-50/70" : "bg-card"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            {item.operation}
                          </p>
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] ${
                              isActive ? "border-red-300 text-red-700" : ""
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
                    A stack containing n elements requires O(n) space. Push and
                    pop take O(1) additional space per operation, excluding the
                    node being added or removed.
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