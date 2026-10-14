"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    title: "Traverse",
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
    title: "Clear List",
    lines: ["head = null", "size = 0", "return"],
    explanation: [
      "Set the head pointer to null.",
      "Reset the list size to zero.",
      "The list is now empty.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows: {
  operation: string;
  key: Operation;
  time: string;
  why: string;
}[] = [
  {
    operation: "Insert at Head",
    key: "insert-head",
    time: "O(1)",
    why: "Updates the head pointer directly.",
  },
  {
    operation: "Insert at Tail",
    key: "insert-tail",
    time: "O(n)",
    why: "Traverses to the last node.",
  },
  {
    operation: "Insert at Index",
    key: "insert-position",
    time: "O(n)",
    why: "Finds the insertion position.",
  },
  {
    operation: "Delete by Value",
    key: "delete-value",
    time: "O(n)",
    why: "Searches for the target node.",
  },
  {
    operation: "Search",
    key: "search",
    time: "O(n)",
    why: "May inspect every node.",
  },
  {
    operation: "Traverse",
    key: "traverse",
    time: "O(n)",
    why: "Visits every node once.",
  },
  {
    operation: "Clear List",
    key: "clear",
    time: "O(1)",
    why: "Resets the head reference.",
  },
];

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
  const [message, setMessage] = useState(
    "Choose an operation to get started."
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [replayEntryId, setReplayEntryId] = useState<number | null>(null);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [randomCount, setRandomCount] = useState("5");
  const [minValue, setMinValue] = useState("1");
  const [maxValue, setMaxValue] = useState("100");
  const [zoom, setZoom] = useState(1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1");
  const [undoStack, setUndoStack] = useState<ListNode[][]>([]);
  const [redoStack, setRedoStack] = useState<ListNode[][]>([]);
  const selectedCode = pseudocode[operation];

  const listRef = useRef(list);
  listRef.current = list;

  const nextIdRef = useRef(nextId);
  nextIdRef.current = nextId;

  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;

  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<Step[] | null>(null);
  const frameIndexRef = useRef(0);
  const replayOriginalRef = useRef<ListNode[] | null>(null);
  const historyIdRef = useRef(1);

  const [newIds, setNewIds] = useState<NodeKey[]>([]);
  const prevIdsRef = useRef<Set<NodeKey>>(
    new Set(list.map((node) => node.id))
  );

  useEffect(() => {
    const previousIds = prevIdsRef.current;
    const ids = list.map((node) => node.id as NodeKey);
    const added = ids.filter((id) => !previousIds.has(id));

    prevIdsRef.current = new Set(ids);

    if (added.length === 0) {
      setNewIds([]);
      return;
    }

    setNewIds(added);
    const timer = setTimeout(() => setNewIds([]), 1600);

    return () => clearTimeout(timer);
  }, [list]);

  useEffect(() => {
    return () => {
      if (playbackTimer.current !== null) {
        clearTimeout(playbackTimer.current);
      }
    };
  }, []);

  function zoomIn() {
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.round((current + ZOOM_STEP) * 10) / 10)
    );
  }

  function zoomOut() {
    setZoom((current) =>
      Math.max(MIN_ZOOM, Math.round((current - ZOOM_STEP) * 10) / 10)
    );
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

  const abortReplay = useCallback(() => {
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
  }, []);

  function runFrames() {
    const tick = () => {
      const frames = framesRef.current;

      if (!frames) return;

      const index = frameIndexRef.current;

      if (index >= frames.length) {
        playbackTimer.current = null;
        framesRef.current = null;
        frameIndexRef.current = 0;
        replayOriginalRef.current = null;
        setIsPlaying(false);
        return;
      }

      frameIndexRef.current = index + 1;
      setActiveLine(frames[index].line);
      frames[index].run();

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
    const original = [...listRef.current];

    replayOriginalRef.current = original;

    const frames: Step[] = [];

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

    entries.forEach((entry) => {
      const title = pseudocode[entry.op].title;

      frames.push({
        line: 0,
        run: () => {
          setOperation(entry.op);
          setReplayEntryId(entry.id);
          setTraversal(null);
          setActiveNode(
            entry.op === "delete-value" ? entry.activeId : null
          );
          setMessage(`Replaying: ${title}`);
        },
      });

      frames.push({
        line: entry.line,
        run: () => {
          listRef.current = entry.after;
          setList(entry.after);
          setActiveNode(
            entry.op === "delete-value" ? null : entry.activeId
          );
          setTraversal(entry.traversal);
          setMessage(entry.text);
        },
      });
    });

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

    const current = [...listRef.current];
    const previous = undoStack[undoStack.length - 1];

    setRedoStack((old) => [...old, current]);
    setUndoStack((old) => old.slice(0, -1));

    listRef.current = [...previous];
    setList([...previous]);
    setTraversal(null);
    setActiveNode(null);
    setActiveLine(null);
    setMessage("Undo successful.");
  }

  function handleRedo() {
    abortReplay();

    if (redoStack.length === 0) return;

    const current = [...listRef.current];
    const next = redoStack[redoStack.length - 1];

    setUndoStack((old) => [...old, current]);
    setRedoStack((old) => old.slice(0, -1));

    listRef.current = [...next];
    setList([...next]);
    setTraversal(null);
    setActiveNode(null);
    setActiveLine(null);
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
    const number = readNumber();
    if (number === null) return;

    abortReplay();

    const before = [...listRef.current];
    const id = nextIdRef.current;
    const after = insertHead(before, number, id);

    setOperation("insert-head");
    setActiveLine(2);
    updateList(after);
    setActiveNode(id);

    nextIdRef.current = id + 1;
    setNextId(id + 1);

    record(`Inserted ${number} at the head.`, {
      op: "insert-head",
      before,
      after,
      activeId: id,
      traversal: null,
      line: 2,
    });
  }

  function insertAtTail() {
    const number = readNumber();
    if (number === null) return;

    abortReplay();

    const before = [...listRef.current];
    const id = nextIdRef.current;
    const after = insertTail(before, number, id);

    setOperation("insert-tail");
    setActiveLine(7);
    updateList(after);
    setActiveNode(id);

    nextIdRef.current = id + 1;
    setNextId(id + 1);

    record(`Inserted ${number} at the tail.`, {
      op: "insert-tail",
      before,
      after,
      activeId: id,
      traversal: null,
      line: 7,
    });
  }

  function insertAtIndex() {
    const number = readNumber();
    if (number === null) return;

    const index = Number(position);
    const before = [...listRef.current];

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
      const after = insertAtPosition(before, number, index, id);
      const line = index === 0 ? 3 : 9;

      setOperation("insert-position");
      setActiveLine(line);
      updateList(after);
      setActiveNode(id);

      nextIdRef.current = id + 1;
      setNextId(id + 1);

      record(`Inserted ${number} at index ${index}.`, {
        op: "insert-position",
        before,
        after,
        activeId: id,
        traversal: null,
        line,
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Insertion failed."
      );
    }
  }

  function removeValue() {
    const number = readNumber();
    if (number === null) return;

    abortReplay();

    const before = [...listRef.current];
    const match = before.find((node) => node.value === number);

    setOperation("delete-value");
    setTraversal(null);

    if (!match) {
      setActiveNode(null);
      setActiveLine(0);
      record(`Value ${number} was not found.`);
      return;
    }

    const after = deleteValue(before, number);

    setActiveLine(7);
    updateList(after);

    record(`Deleted the first occurrence of ${number}.`, {
      op: "delete-value",
      before,
      after,
      activeId: match.id,
      traversal: null,
      line: 7,
    });
  }

  function search() {
    const number = readNumber();
    if (number === null) return;

    abortReplay();

    const before = [...listRef.current];

    setOperation("search");
    setTraversal(null);

    const index = searchValue(before, number);
    const line = index === -1 ? 7 : 4;
    const activeId = index === -1 ? null : before[index].id;

    setActiveLine(line);
    setActiveNode(activeId);

    record(
      index === -1
        ? `Value ${number} was not found.`
        : `Found ${number} at index ${index}.`,
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

    const before = [...listRef.current];

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

    const before = [...listRef.current];
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
      randomCount.trim() === "" ||
      minValue.trim() === "" ||
      maxValue.trim() === "" ||
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

    const before = [...listRef.current];
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
          0% { opacity: 0; transform: translateX(70px) scale(0.9); }
          60% { opacity: 1; transform: translateX(-6px) scale(1.03); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }

        @keyframes node-glow {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.55); }
          100% { box-shadow: 0 0 0 18px rgba(220, 38, 38, 0); }
        }

        @keyframes badge-pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-new { animation: none !important; }
        }

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
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F6B6D]">
              Linked List Visualizer
            </h1>
            <p className="text-xs text-[#0F6B6D]">
              Explore pointers, operations, pseudocode, and complexity.
            </p>
          </div>

          <Badge
            variant="outline"
            className="rounded-full border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-50"
          >
            Singly · Linked List
          </Badge>
        </header>

        {/* Main layout */}
        <div className="grid grid-cols-1 items-start gap-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="vis-scroll min-w-0 space-y-3 lg:sticky lg:top-3 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-scroll lg:pr-1">
            {/* OPERATIONS (random generator lives in the same card) */}
            <Card className={cardCls}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">
                  Operations
                </CardTitle>
                <CardDescription className="text-xs">
                  Modify your linked list
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 p-4 pt-1">
                <div className="space-y-1">
                  <label htmlFor="ll-value" className="text-xs font-medium">
                    Node value
                  </label>
                  <Input
                    id="ll-value"
                    type="number"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Enter value"
                    className={inputCls}
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
                    onChange={(event) => setPosition(event.target.value)}
                    placeholder="Zero-based index"
                    className={inputCls}
                  />
                </div>

                <Button onClick={insertAtHead} className={opButton}>
                  Insert at Head
                </Button>

                <Button onClick={insertAtTail} className={opButton}>
                  Insert at Tail
                </Button>

                <Button onClick={insertAtIndex} className={opButton}>
                  Insert at Index
                </Button>

                <Button onClick={removeValue} className={opButton}>
                  Delete by Value
                </Button>

                <Button onClick={search} className={opButton}>
                  Search Value
                </Button>

                <Button onClick={traverse} className={opButton}>
                  Traverse List
                </Button>

                <Button onClick={clearList} className={opButton}>
                  Clear List
                </Button>

                {/* RANDOM LIST */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="min-w-0 space-y-1">
                    <label htmlFor="ll-min" className="text-xs font-medium">
                      Minimum
                    </label>
                    <Input
                      id="ll-min"
                      type="number"
                      value={minValue}
                      onChange={(event) => setMinValue(event.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <label htmlFor="ll-max" className="text-xs font-medium">
                      Maximum
                    </label>
                    <Input
                      id="ll-max"
                      type="number"
                      value={maxValue}
                      onChange={(event) => setMaxValue(event.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="ll-count" className="text-xs font-medium">
                    Number of nodes (1–30)
                  </label>
                  <Input
                    id="ll-count"
                    type="number"
                    min="1"
                    max="30"
                    value={randomCount}
                    onChange={(event) => setRandomCount(event.target.value)}
                    className={inputCls}
                  />
                </div>

                <Button onClick={generateRandom} className={opButton}>
                  Generate List
                </Button>
              </CardContent>
            </Card>

            {/* HISTORY */}
            <Card className={cardCls}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">History</CardTitle>
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
                    setMessage("History cleared.");
                  }}
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
            <Alert className="rounded-xl border-red-100 bg-red-50/60">
              <AlertDescription className="text-xs leading-relaxed text-red-900">
                {message}
              </AlertDescription>
            </Alert>
          </aside>

          {/* Main content */}
          <section className="flex min-w-0 flex-col gap-4">
            {/* Visualization playground */}
            <Card className={`${cardCls} min-w-0 overflow-hidden`}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-[#BFD8D8] p-4">
                <div className="min-w-0">
                  <CardTitle className="text-base font-medium">
                    Learn, Play and Create
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Follow the arrows to understand each node&apos;s next
                    pointer.
                  </CardDescription>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                    disabled={zoom <= MIN_ZOOM}
                    aria-label="Zoom out"
                    className={`${zoomButton} w-8`}
                  >
                    −
                  </Button>

                  <span className="min-w-12 text-center text-xs text-muted-foreground">
                    {Math.round(zoom * 100)}%
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                    disabled={zoom >= MAX_ZOOM}
                    aria-label="Zoom in"
                    className={`${zoomButton} w-8`}
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

              <CardContent className="flex min-w-0 flex-col gap-3 p-4">
                {/* Playback controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BFD8D8] bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handlePlay}
                      disabled={isPlaying}
                      className={coralButton}
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
                      className={coralButton}
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
                      className={coralButton}
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
                      className={coralButton}
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
                      onChange={(event) =>
                        setAnimationSpeed(event.target.value)
                      }
                      className="h-9 rounded-lg border border-[#BFD8D8] bg-background px-3 text-sm"
                    >
                      <option value="0.5">0.5×</option>
                      <option value="1">1×</option>
                      <option value="2">2×</option>
                      <option value="4">4×</option>
                    </select>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Head
                    </p>
                    <p className="truncate text-xl font-medium">
                      {list.length ? list[0].value : "NULL"}
                    </p>
                  </div>

                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Nodes
                    </p>
                    <p className="text-xl font-medium">{list.length}</p>
                  </div>

                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Tail
                    </p>
                    <p className="truncate text-xl font-medium">
                      {list.length ? list[list.length - 1].value : "NULL"}
                    </p>
                  </div>
                </div>

                {/* Linked-list visualization */}
                <div
                  className={`${innerBox} flex min-h-[500px] min-w-0 flex-col overflow-hidden bg-card`}
                >
                  <div className="flex items-center justify-between border-b border-[#BFD8D8] px-3 py-2">
                    <span className="text-xs font-medium">
                      Linked List Structure
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px]"
                    >
                      HEAD → NULL
                    </Badge>
                  </div>

                  <div className="vis-scroll relative flex min-h-[450px] min-w-0 flex-1 overflow-auto p-6">
                    {list.length === 0 ? (
                      <div className="m-auto text-center">
                        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 text-2xl text-muted-foreground">
                          ∅
                        </div>
                        <p className="text-sm font-medium">
                          Your list is empty
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Insert a node or generate a random list to begin.
                        </p>
                      </div>
                    ) : (
                      <div className="flex min-h-full min-w-full items-center justify-center">
                        <div
                          className="flex w-max items-center py-12"
                          style={{ zoom }}
                        >
                          <div className="mr-3 flex flex-col items-center gap-2">
                            <Badge className="bg-red-600 text-white hover:bg-red-600">
                              HEAD
                            </Badge>
                            <span className="text-xl text-red-600">↓</span>
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
                                      ? "z-10 scale-105 border-red-600 bg-red-100 text-red-900 ring-2 ring-red-300"
                                      : index === 0
                                        ? "border-red-400 bg-red-50 text-red-800"
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
                                    <span className="absolute -right-2 -top-3 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                      ACTIVE
                                    </span>
                                  )}

                                  {isNew && (
                                    <span
                                      className="absolute -left-2 -top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-semibold text-white"
                                      style={{
                                        animation:
                                          "badge-pop 400ms ease-out both",
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
                                        highlighted
                                          ? "bg-red-600"
                                          : "bg-foreground"
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
                                      className="rounded-full border-red-300 text-red-700"
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
                </div>

                {/* Traversal output */}
                <div className={`${innerBox} bg-card p-3`}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold">Traversal Output</p>
                    <Badge
                      variant="outline"
                      className="rounded-full font-mono text-[10px]"
                    >
                      {traversal?.length ?? 0} values
                    </Badge>
                  </div>

                  <p className="vis-scroll max-h-14 overflow-auto break-words rounded-md border border-[#BFD8D8] bg-muted/20 px-2 py-1.5 font-mono text-xs">
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

            {/* Pseudocode and complexity */}
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
                      {selectedCode.title}
                    </Badge>
                  </div>

                  <CardDescription className="text-xs">
                    Follow the selected operation step by step.
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 p-4 pt-1">
                  <div className="vis-scroll max-h-[260px] overflow-auto rounded-xl bg-[#020617] p-4 font-mono text-xs text-slate-100">
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
                              ? "italic text-sky-400/70"
                              : ""
                          }
                        >
                          {line || " "}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className={`${innerBox} bg-muted/30 p-4`}>
                    <p className="mb-2 text-xs font-medium">How it works</p>
                    <ol className="list-inside list-decimal space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                      {selectedCode.explanation.map((step, index) => (
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
                    Performance of linked-list operations
                  </CardDescription>
                </CardHeader>

                <CardContent className="vis-scroll flex-1 overflow-y-scroll p-4 pt-1">
                  <div className="space-y-3">
                    {complexityRows.map((row) => {
                      const isActive = row.key === operation;

                      return (
                        <div
                          key={row.operation}
                          className={`rounded-xl border p-4 transition-colors ${
                            isActive
                              ? "border-red-300 bg-red-50"
                              : "border-[#BFD8D8] bg-card"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium">
                              {row.operation}
                            </p>

                            <Badge
                              variant="outline"
                              className={`rounded-full font-mono text-[10px] ${
                                isActive
                                  ? "border-red-300 text-red-600"
                                  : "border-[#BFD8D8]"
                              }`}
                            >
                              {row.time}
                            </Badge>
                          </div>

                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {row.why}
                          </p>
                        </div>
                      );
                    })}

                    <div className={`${innerBox} bg-muted/30 p-4`}>
                      <p className="text-xs font-medium">Space Complexity</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        A linked list storing n nodes requires O(n) space, with
                        each node holding a value and a reference to the next
                        node.
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