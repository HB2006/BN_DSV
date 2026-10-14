"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Undo2, Redo2, Gauge } from "lucide-react";
import type { ListNode } from "./type";
import {
  insertHead,
  insertTail,
  insertAtPosition,
  deleteValue,
  searchValue,
} from "./linked-list-operation";

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
  | "insert-head"
  | "insert-tail"
  | "insert-position"
  | "delete-value"
  | "search"
  | "traverse"
  | "clear";

type NodeKey = string | number;

type CodeInfo = {
  title: string;
  lines: string[];
  explanation: string[];
  complexity: string;
};

type HistoryEntry = {
  id: number;
  text: string;
  op: Operation;
  before: ListNode[];
  after: ListNode[];
  activeId: NodeKey | null;
  traversal: number[] | null;
  line: number | null;
};

type HistoryMeta = Omit<HistoryEntry, "id" | "text">;

type Step = { line: number | null; run: () => void };

const pseudocode: Record<Operation, CodeInfo> = {
  "insert-head": {
    title: "Insert at Head",
    lines: [
      "newNode = Node(value)",
      "newNode.next = head",
      "head = newNode",
      "size = size + 1",
    ],
    explanation: [
      "Create a new node containing the value.",
      "Point the new node to the current head.",
      "Update head to point to the new node.",
      "Increase the list size.",
    ],
    complexity: "O(1)",
  },

  "insert-tail": {
    title: "Insert at Tail",
    lines: [
      "newNode = Node(value)",
      "if head == null:",
      "    head = newNode",
      "else:",
      "    current = head",
      "    while current.next != null:",
      "        current = current.next",
      "    current.next = newNode",
      "size = size + 1",
    ],
    explanation: [
      "Create a new node.",
      "If the list is empty, make the new node the head.",
      "Otherwise, traverse until the last node.",
      "Connect the last node to the new node.",
      "Increase the list size.",
    ],
    complexity: "O(n)",
  },

  "insert-position": {
    title: "Insert at Index",
    lines: [
      "newNode = Node(value)",
      "if index == 0:",
      "    newNode.next = head",
      "    head = newNode",
      "else:",
      "    current = head",
      "    repeat index - 1 times:",
      "        current = current.next",
      "    newNode.next = current.next",
      "    current.next = newNode",
      "size = size + 1",
    ],
    explanation: [
      "Create a new node.",
      "If the index is zero, insert before the head.",
      "Find the node immediately before the target index.",
      "Point the new node to the following node.",
      "Connect the previous node to the new node.",
    ],
    complexity: "O(n)",
  },

  "delete-value": {
    title: "Delete by Value",
    lines: [
      "if head == null: return",
      "if head.value == value:",
      "    head = head.next",
      "else:",
      "    current = head",
      "    while current.next != null:",
      "        if current.next.value == value:",
      "            current.next = current.next.next",
      "            break",
      "        current = current.next",
    ],
    explanation: [
      "Check whether the list is empty.",
      "If the head matches, move head to the next node.",
      "Otherwise, search for the first matching node.",
      "Update the previous node's pointer to skip the target.",
      "Only the first occurrence is deleted.",
    ],
    complexity: "O(n)",
  },

  search: {
    title: "Search",
    lines: [
      "current = head",
      "index = 0",
      "while current != null:",
      "    if current.value == value:",
      "        return index",
      "    current = current.next",
      "    index = index + 1",
      "return -1",
    ],
    explanation: [
      "Start at the head of the list.",
      "Track the index of the current node.",
      "Compare each node's value with the target.",
      "Return the index when a match is found.",
      "Return -1 if the value is absent.",
    ],
    complexity: "O(n)",
  },

  traverse: {
    title: "Traverse Linked List",
    lines: [
      "current = head",
      "while current != null:",
      "    visit(current.value)",
      "    current = current.next",
      "return",
    ],
    explanation: [
      "Start at the head.",
      "Visit the current node.",
      "Follow the next pointer.",
      "Stop when current becomes null.",
    ],
    complexity: "O(n)",
  },

  clear: {
    title: "Clear Linked List",
    lines: ["head = null", "size = 0", "return"],
    explanation: [
      "Set the head pointer to null.",
      "Reset the list size to zero.",
      "The list is now empty.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows = [
  {
    operation: "Insert at Head",
    time: "O(1)",
    why: "Updates the head pointer directly.",
  },
  {
    operation: "Insert at Tail",
    time: "O(n)",
    why: "Traverses to the last node.",
  },
  {
    operation: "Insert at Index",
    time: "O(n)",
    why: "Finds the insertion position.",
  },
  {
    operation: "Delete by Value",
    time: "O(n)",
    why: "Searches for the target node.",
  },
  {
    operation: "Search",
    time: "O(n)",
    why: "May inspect every node.",
  },
  {
    operation: "Traverse",
    time: "O(n)",
    why: "Visits every node once.",
  },
  {
    operation: "Clear List",
    time: "O(1)",
    why: "Resets the head reference.",
  },
];

const primaryButton =
  "bg-[#D8A7B1] text-[#4D3039] hover:bg-[#C9919D] dark:bg-[#D8A7B1] dark:hover:bg-[#E2BAC2]"

const secondaryButton =
  "h-7 w-full justify-start border border-[#0F6B6D] bg-[#0F6B6D] px-2 text-xs text-white hover:border-[#0B5557] hover:bg-[#0B5557] hover:text-white dark:border-[#0F6B6D] dark:bg-[#0F6B6D] dark:text-white dark:hover:border-[#0B5557] dark:hover:bg-[#0B5557] dark:hover:text-white";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;
const MAX_HISTORY = 50;

export function LinkedListVisualizer() {
  const [list, setList] = useState<ListNode[]>([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ]);
  const [value, setValue] = useState("40");
  const [position, setPosition] = useState("1");
  const [nextId, setNextId] = useState(4);
  const [activeNode, setActiveNode] = useState<NodeKey | null>(null);
  const [operation, setOperation] = useState<Operation>("insert-head");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [message, setMessage] = useState("Choose an operation to get started.");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [replayEntryId, setReplayEntryId] = useState<number | null>(null);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [randomCount, setRandomCount] = useState("5");
  const [minValue, setMinValue] = useState("1");
  const [maxValue, setMaxValue] = useState("100");
  const [zoom, setZoom] = useState(1);

  // Playback + undo/redo state
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1");
  const [undoStack, setUndoStack] = useState<ListNode[][]>([]);
  const [redoStack, setRedoStack] = useState<ListNode[][]>([]);
  const selectedCode = pseudocode[operation];

  // Latest-value refs so timer callbacks never see stale state
  const listRef = useRef(list);
  listRef.current = list;
  const nextIdRef = useRef(nextId);
  nextIdRef.current = nextId;
  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;

  // Replay machinery
  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<Step[] | null>(null);
  const frameIndexRef = useRef(0);
  const replayOriginalRef = useRef<ListNode[] | null>(null);
  const historyIdRef = useRef(1);

  // New-node animation tracking
  const [newIds, setNewIds] = useState<NodeKey[]>([]);
  const prevIdsRef = useRef<Set<NodeKey>>(new Set(list.map((n) => n.id)));

  // Detect any node that appeared (insert, redo, undo of delete, generate, replay)
  useEffect(() => {
    const prev = prevIdsRef.current;
    const ids = list.map((n) => n.id as NodeKey);
    const added = ids.filter((id) => !prev.has(id));
    prevIdsRef.current = new Set(ids);

    if (added.length === 0) {
      setNewIds([]);
      return;
    }
    setNewIds(added);
    const t = setTimeout(() => setNewIds([]), 1600);
    return () => clearTimeout(t);
  }, [list]);

  // Clear playback timer on unmount
  useEffect(() => {
    return () => {
      if (playbackTimer.current !== null) {
        clearTimeout(playbackTimer.current);
      }
    };
  }, []);

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 10) / 10));
  }

  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 10) / 10));
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

  function updateList(nextList: ListNode[]) {
    const current = listRef.current;
    setUndoStack((old) => [...old, [...current]]);
    setRedoStack([]);
    listRef.current = nextList;
    setList(nextList);
    setActiveNode(null);
    setTraversal(null);
  }

  /* ---------- HISTORY REPLAY ---------- */

  // Stops any replay and puts the real list back
  function abortReplay() {
    if (playbackTimer.current !== null) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
    setIsPlaying(false);
    if (replayOriginalRef.current) {
      const original = replayOriginalRef.current;
      replayOriginalRef.current = null;
      listRef.current = original;
      setList(original);
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
    const original = listRef.current;
    replayOriginalRef.current = original;

    const frames: Step[] = [];

    // 1. Rewind to the state before the first recorded operation
    frames.push({
      line: null,
      run: () => {
        const start = entries[0].before;
        listRef.current = start;
        setList(start);
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
          setActiveNode(entry.op === "delete-value" ? entry.activeId : null);
          setMessage(`Replaying: ${title}`);
        },
      });
      frames.push({
        line: entry.line,
        run: () => {
          listRef.current = entry.after;
          setList(entry.after);
          setActiveNode(entry.op === "delete-value" ? null : entry.activeId);
          setTraversal(entry.traversal);
          setMessage(entry.text);
        },
      });
    });

    // 3. Put the real list back (matters if you used Undo/Redo earlier)
    frames.push({
      line: null,
      run: () => {
        listRef.current = original;
        setList(original);
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
    const current = listRef.current;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((old) => [...old, [...current]]);
    setUndoStack((old) => old.slice(0, -1));
    listRef.current = [...previous];
    setList([...previous]);
    setTraversal(null);
    setMessage("Undo successful.");
  }

  function handleRedo() {
    abortReplay();
    if (redoStack.length === 0) return;
    const current = listRef.current;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((old) => [...old, [...current]]);
    setRedoStack((old) => old.slice(0, -1));
    listRef.current = [...next];
    setList([...next]);
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

  function insertAtHead() {
    const n = readNumber();
    if (n === null) return;

    abortReplay();
    const before = listRef.current;
    const id = nextIdRef.current;
    const after = insertHead(before, n, id);

    setOperation("insert-head");
    setActiveLine(2);
    updateList(after);
    setActiveNode(id);
    nextIdRef.current = id + 1;
    setNextId(id + 1);

    record(`Inserted ${n} at the head.`, {
      op: "insert-head",
      before,
      after,
      activeId: id,
      traversal: null,
      line: 2,
    });
  }

  function insertAtTail() {
    const n = readNumber();
    if (n === null) return;

    abortReplay();
    const before = listRef.current;
    const id = nextIdRef.current;
    const after = insertTail(before, n, id);

    setOperation("insert-tail");
    setActiveLine(7);
    updateList(after);
    setActiveNode(id);
    nextIdRef.current = id + 1;
    setNextId(id + 1);

    record(`Inserted ${n} at the tail.`, {
      op: "insert-tail",
      before,
      after,
      activeId: id,
      traversal: null,
      line: 7,
    });
  }

  function insertAtIndex() {
    const n = readNumber();
    if (n === null) return;

    const index = Number(position);
    const before = listRef.current;

    if (
      position.trim() === "" ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > before.length
    ) {
      setMessage(`Enter an integer index from 0 to ${before.length}.`);
      return;
    }

    try {
      abortReplay();
      const id = nextIdRef.current;
      const after = insertAtPosition(before, n, index, id);
      const line = index === 0 ? 3 : 9;

      setOperation("insert-position");
      setActiveLine(line);
      updateList(after);
      setActiveNode(id);
      nextIdRef.current = id + 1;
      setNextId(id + 1);

      record(`Inserted ${n} at index ${index}.`, {
        op: "insert-position",
        before,
        after,
        activeId: id,
        traversal: null,
        line,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Insertion failed.");
    }
  }

  function removeValue() {
    const n = readNumber();
    if (n === null) return;

    abortReplay();
    const before = listRef.current;
    const match = before.find((node) => node.value === n);

    setOperation("delete-value");
    setTraversal(null);

    if (!match) {
      setActiveNode(null);
      setActiveLine(0);
      setMessage(`Value ${n} was not found.`);
      return;
    }

    const after = deleteValue(before, n);

    setActiveLine(7);
    updateList(after);

    record(`Deleted the first occurrence of ${n}.`, {
      op: "delete-value",
      before,
      after,
      activeId: match.id,
      traversal: null,
      line: 7,
    });
  }

  function search() {
    const n = readNumber();
    if (n === null) return;

    abortReplay();
    const before = listRef.current;

    setOperation("search");
    setTraversal(null);

    const index = searchValue(before, n);
    const line = index === -1 ? 7 : 4;
    const activeId = index === -1 ? null : before[index].id;

    setActiveLine(line);
    setActiveNode(activeId);

    record(
      index === -1
        ? `Value ${n} was not found.`
        : `Found ${n} at index ${index}.`,
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

  function traverse() {
    abortReplay();
    const before = listRef.current;

    setOperation("traverse");
    setActiveLine(2);
    setActiveNode(null);

    const values = before.map((node) => node.value);
    setTraversal(values);

    record(
      before.length
        ? `Traversed ${before.length} node(s).`
        : "The list is empty.",
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

  function clearList() {
    abortReplay();
    const before = listRef.current;
    const after: ListNode[] = [];

    setOperation("clear");
    setActiveLine(0);
    updateList(after);

    record("Cleared the linked list.", {
      op: "clear",
      before,
      after,
      activeId: null,
      traversal: null,
      line: 0,
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
      setMessage("Use 1–30 nodes and valid integer minimum/maximum values.");
      return;
    }

    abortReplay();
    const before = listRef.current;
    const startId = nextIdRef.current;

    const generated: ListNode[] = Array.from(
      { length: count },
      (_, index) => ({
        id: startId + index,
        value: Math.floor(Math.random() * (max - min + 1)) + min,
      })
    );

    updateList(generated);
    nextIdRef.current = startId + count;
    setNextId(startId + count);
    setOperation("traverse");
    setActiveLine(null);

    record(`Generated a linked list with ${count} random nodes.`, {
      op: "traverse",
      before,
      after: generated,
      activeId: null,
      traversal: null,
      line: null,
    });
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

      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0F6B6D] sm:text-2xl">
            Linked List Visualizer
          </h1>
          <p className="text-xs text-[#0F6B6D]">
            Explore pointers, operations, pseudocode, and complexity.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          Singly Linked List
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
                <label htmlFor="ll-value" className="text-xs font-medium">
                  Node value
                </label>
                <Input
                  id="ll-value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Value"
                  className="h-7 bg-background px-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="ll-position" className="text-xs font-medium">
                  Index (0–{list.length})
                </label>
                <Input
                  id="ll-position"
                  type="number"
                  min="0"
                  max={list.length}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Zero-based index"
                  className="h-7 bg-background px-2 text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <Button
                  onClick={insertAtHead}
                  className={secondaryButton}
                  variant="outline"
                >
                  Insert at Head
                </Button>
                <Button
                  onClick={insertAtTail}
                  className={secondaryButton}
                  variant="outline"
                >
                  Insert at Tail
                </Button>
                <Button
                  onClick={insertAtIndex}
                  className={secondaryButton}
                  variant="outline"
                >
                  Insert at Index
                </Button>
                <Button
                  onClick={removeValue}
                  className={secondaryButton}
                  variant="outline"
                >
                  Delete by Value
                </Button>
                <Button
                  onClick={search}
                  className={secondaryButton}
                  variant="outline"
                >
                  Search
                </Button>
                <Button
                  onClick={traverse}
                  className={secondaryButton}
                  variant="outline"
                >
                  Traverse
                </Button>
                <Button
                  onClick={clearList}
                  className="h-7 w-full justify-start border-red-200 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  variant="outline"
                >
                  Clear List
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="px-3 pb-1 pt-3">
              <CardTitle className="text-sm">Random Nodes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-3 pb-3">
              <div className="space-y-1">
                <label
                  htmlFor="ll-count"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Number of nodes (1–30)
                </label>
                <Input
                  id="ll-count"
                  type="number"
                  min="1"
                  max="30"
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  className="h-7 px-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor="ll-min"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Minimum
                  </label>
                  <Input
                    id="ll-min"
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="h-7 px-2 text-xs"
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor="ll-max"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Maximum
                  </label>
                  <Input
                    id="ll-max"
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="h-7 px-2 text-xs"
                  />
                </div>
              </div>

              <Button
                onClick={generateRandom}
                className={`h-7 w-full text-xs ${primaryButton}`}
              >
                Generate List
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
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border px-3 py-3 sm:px-4">
              <div className="min-w-0">
                <CardTitle className="text-base">
                  Visualization Playground
                </CardTitle>
                <CardDescription className="text-xs">
                  Follow the arrows to understand each node&apos;s next pointer.
                </CardDescription>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                  className="h-7 w-7 p-0 text-base"
                >
                  −
                </Button>

                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Reset zoom"
                  className="h-7 min-w-[3.25rem] rounded-md border border-border bg-muted/40 px-2 text-xs font-medium hover:bg-muted"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                  className="h-7 w-7 p-0 text-base"
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

              {/* Stats remain outside the zoomed visualization. */}
              <div className="grid shrink-0 grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/40 py-2 text-center">
                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Head</p>
                  <p className="break-words text-base font-bold">
                    {list.length ? list[0].value : "NULL"}
                  </p>
                </div>

                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Nodes</p>
                  <p className="text-base font-bold">{list.length}</p>
                </div>

                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Tail</p>
                  <p className="break-words text-base font-bold">
                    {list.length ? list[list.length - 1].value : "NULL"}
                  </p>
                </div>
              </div>

              {/* Only this viewport contains the zoomed linked-list drawing. */}
              <div className="h-[350px] overflow-auto rounded-xl border border-border bg-muted/20 p-3 sm:h-[420px] sm:p-4">
                {list.length === 0 ? (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-950/50">
                      ∅
                    </div>

                    <p className="text-lg font-semibold">Your list is empty</p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Insert a node or generate a random list to begin.
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-full min-w-full items-center justify-center">
                    <div
                      className="flex w-max items-center py-8"
                      style={{ zoom }}
                    >
                      <div className="mr-3 flex flex-col items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                        >
                          HEAD
                        </Badge>

                        <span className="text-2xl text-red-600">↓</span>
                      </div>

                      {list.map((node, index) => {
                        const highlighted = activeNode === node.id;
                        const isNew = newIds.includes(node.id);
                        const newOrder = newIds.indexOf(node.id);

                        return (
                          <div key={node.id} className="flex items-center">
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
                              className={`anim-new relative flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                                highlighted
                                  ? "z-10 scale-105 border-red-500 bg-red-50 text-red-950 shadow-lg shadow-red-500/10 dark:bg-red-950/50 dark:text-red-100"
                                  : "border-border bg-card text-card-foreground"
                              }`}
                            >
                              <span
                                className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  highlighted
                                    ? "bg-red-600 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {index}
                              </span>

                              {highlighted && (
                                <span className="absolute -top-3 right-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                                  ACTIVE
                                </span>
                              )}

                              {isNew && (
                                <span
                                  className="absolute -right-2 -top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-semibold text-white"
                                  style={{
                                    animation: "badge-pop 400ms ease-out both",
                                  }}
                                >
                                  NEW
                                </span>
                              )}

                              <span className="max-w-full break-all px-1 text-xl font-bold">
                                {node.value}
                              </span>

                              <div className="mt-2 flex w-full items-center justify-between border-t border-border px-2 pt-1 text-[10px] text-muted-foreground">
                                <span>next</span>

                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    highlighted ? "bg-red-600" : "bg-foreground"
                                  }`}
                                />
                              </div>
                            </div>

                            {index < list.length - 1 ? (
                              <div className="flex w-8 items-center justify-center sm:w-10">
                                <span
                                  className={`text-2xl transition-colors duration-300 ${
                                    highlighted ||
                                    activeNode === list[index + 1].id
                                      ? "text-red-600"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  →
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-2">
                                <span className="text-xl text-muted-foreground">
                                  →
                                </span>

                                <Badge
                                  variant="outline"
                                  className="border-red-300 text-red-700 dark:border-red-900 dark:text-red-300"
                                >
                                  NULL
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Traversal output is intentionally outside the zoom wrapper. */}
              <div className="shrink-0 rounded-lg border border-border bg-card px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Traversal Output</p>

                  <Badge variant="outline" className="text-[11px]">
                    {traversal?.length ?? 0} values
                  </Badge>
                </div>

                <p className="max-h-14 overflow-auto break-words rounded-md border border-border bg-muted/40 px-2 py-1.5 font-mono text-xs">
                  {traversal !== null
                    ? traversal.length
                      ? `${traversal.join(" → ")} → NULL`
                      : "NULL"
                    : list.length
                      ? `${list.map((node) => node.value).join(" → ")} → NULL`
                      : "NULL"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pseudocode and complexity stay in normal page flow. */}
          <div className="grid min-w-0 grid-cols-1 items-start gap-3 md:grid-cols-2">
            <Card className="min-w-0 border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
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
                                    line.includes("repeat ")
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
                  Selected operation and common linked-list operations.
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
                      ? "Constant time: no traversal needed."
                      : "Linear time: may visit every node."}
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
                  Here, <strong>n</strong> is the number of nodes. In a singly
                  linked list, inserting at the head takes O(1), while
                  operations that need to find a node generally take O(n).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}