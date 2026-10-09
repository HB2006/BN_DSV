"use client";

import { useState } from "react";
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

const pseudocode: Record<
  Operation,
  {
    title: string;
    lines: string[];
    explanation: string[];
    complexity: string;
  }
> = {
  "insert-head": {
    title: "Insert at Head",
    lines: [
      "// Insert a new node at the beginning",
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
      "// Add a node at the end",
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
      "If the list is empty, make it the head.",
      "Otherwise, traverse to the last node.",
      "Connect the last node to the new node.",
      "Increase the list size.",
    ],
    complexity: "O(n)",
  },

  "insert-position": {
    title: "Insert at Index",
    lines: [
      "// Insert at a zero-based index",
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
      "Create the new node.",
      "If index is zero, insert before the head.",
      "Find the node before the target position.",
      "Point the new node to the following node.",
      "Connect the previous node to the new node.",
    ],
    complexity: "O(n)",
  },

  "delete-value": {
    title: "Delete by Value",
    lines: [
      "// Delete the first matching value",
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
      "size = size - 1",
    ],
    explanation: [
      "Check whether the list is empty.",
      "If the head matches, move head forward.",
      "Otherwise, find the matching node.",
      "Update the previous node's pointer to skip it.",
      "Decrease the size when a node is deleted.",
    ],
    complexity: "O(n)",
  },

  search: {
    title: "Search",
    lines: [
      "// Find the first matching value",
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
      "Start at the head.",
      "Track the current index.",
      "Compare each node with the target.",
      "Return the index when a match is found.",
      "Return -1 if the value is absent.",
    ],
    complexity: "O(n)",
  },

  traverse: {
    title: "Traverse",
    lines: [
      "// Visit every node",
      "current = head",
      "while current != null:",
      "    visit(current.value)",
      "    current = current.next",
      "return",
    ],
    explanation: [
      "Start at the head.",
      "Visit the current node.",
      "Move to the next node.",
      "Stop when the pointer reaches null.",
    ],
    complexity: "O(n)",
  },

  clear: {
    title: "Clear List",
    lines: ["// Remove all nodes", "head = null", "size = 0", "return"],
    explanation: [
      "Set the head pointer to null.",
      "Reset the size to zero.",
      "The list is now empty.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows = [
  {
    operation: "Insert at Head",
    time: "O(1)",
    why: "Update the head pointer directly.",
  },
  {
    operation: "Insert at Tail",
    time: "O(n)",
    why: "Traverse to the last node.",
  },
  {
    operation: "Insert at Index",
    time: "O(n)",
    why: "Find the insertion position.",
  },
  {
    operation: "Delete by Value",
    time: "O(n)",
    why: "Find the target node.",
  },
  {
    operation: "Search",
    time: "O(n)",
    why: "May inspect every node.",
  },
  {
    operation: "Traverse",
    time: "O(n)",
    why: "Visit each node once.",
  },
  {
    operation: "Clear List",
    time: "O(1)",
    why: "Reset the head pointer and size.",
  },
];

const primaryButton =
  "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500";

const secondaryButton =
  "h-7 w-full justify-start border border-border bg-card px-2 text-xs text-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

export function LinkedListVisualizer() {
  const [list, setList] = useState<ListNode[]>([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ]);

  const [value, setValue] = useState("40");
  const [position, setPosition] = useState("1");
  const [nextId, setNextId] = useState(4);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>("insert-head");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [message, setMessage] = useState("Choose an operation to get started.");
  const [history, setHistory] = useState<string[]>([]);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [randomCount, setRandomCount] = useState("5");
  const [minValue, setMinValue] = useState("1");
  const [maxValue, setMaxValue] = useState("100");
  const [zoom, setZoom] = useState(1);

  const selectedCode = pseudocode[operation];

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 10) / 10));
  }

  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 10) / 10));
  }

  function resetZoom() {
    setZoom(1);
  }

  function record(text: string) {
    setHistory((old) => [text, ...old].slice(0, 8));
    setMessage(text);
    setTraversal(null);
  }

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

    setOperation("insert-head");
    setActiveLine(2);
    setActiveNode(nextId);
    setList((old) => insertHead(old, n, nextId));
    setNextId((old) => old + 1);
    record(`Inserted ${n} at the head.`);
  }

  function insertAtTail() {
    const n = readNumber();
    if (n === null) return;

    setOperation("insert-tail");
    setActiveLine(8);
    setActiveNode(nextId);
    setList((old) => insertTail(old, n, nextId));
    setNextId((old) => old + 1);
    record(`Inserted ${n} at the tail.`);
  }

  function insertAtIndex() {
    const n = readNumber();
    if (n === null) return;

    const index = Number(position);

    if (
      position.trim() === "" ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > list.length
    ) {
      setMessage(`Enter an integer index from 0 to ${list.length}.`);
      return;
    }

    try {
      setOperation("insert-position");
      setActiveLine(index === 0 ? 4 : 10);
      setActiveNode(nextId);
      setList((old) => insertAtPosition(old, n, index, nextId));
      setNextId((old) => old + 1);
      record(`Inserted ${n} at index ${index}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Insertion failed.");
    }
  }

  function removeValue() {
    const n = readNumber();
    if (n === null) return;

    const match = list.find((node) => node.value === n);

    setOperation("delete-value");

    if (!match) {
      setActiveNode(null);
      setActiveLine(8);
      setMessage(`Value ${n} was not found.`);
      return;
    }

    setActiveNode(match.id);
    setActiveLine(9);
    setList((old) => deleteValue(old, n));
    record(`Deleted the first occurrence of ${n}.`);
  }

  function search() {
    const n = readNumber();
    if (n === null) return;

    setOperation("search");

    const index = searchValue(list, n);
    setActiveLine(index === -1 ? 8 : 5);
    setActiveNode(index === -1 ? null : list[index].id);
    setTraversal(null);

    setMessage(
      index === -1 ? `Value ${n} was not found.` : `Found ${n} at index ${index}.`
    );
  }

  function traverse() {
    setOperation("traverse");
    setActiveLine(3);
    setActiveNode(null);
    setTraversal(list.map((node) => node.value));
    setMessage(`Traversed ${list.length} node(s).`);
  }

  function clearList() {
    setOperation("clear");
    setActiveLine(1);
    setActiveNode(null);
    setList([]);
    setTraversal(null);
    record("Cleared the list.");
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

    const generated: ListNode[] = Array.from({ length: count }, (_, index) => ({
      id: nextId + index,
      value: Math.floor(Math.random() * (max - min + 1)) + min,
    }));

    setList(generated);
    setNextId((old) => old + count);
    setOperation("traverse");
    setActiveLine(null);
    setActiveNode(null);
    setTraversal(null);
    record(`Generated ${count} random nodes.`);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
      {/* PAGE HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Linked List Visualizer
          </h1>
          <p className="text-xs text-muted-foreground">
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

      {/* BODY: LEFT SIDEBAR + RIGHT (TOP HALF / BOTTOM HALF) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-4 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* ===== FAR-LEFT COMPACT SIDEBAR ===== */}
        <aside className="min-h-0 min-w-0 space-y-3 lg:overflow-y-auto lg:pr-1">
          {/* OPERATIONS */}
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
                  Index{" "}
                  <span className="font-normal text-muted-foreground">
                    (0–{list.length})
                  </span>
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
                <Button onClick={insertAtHead} className={secondaryButton} variant="outline">
                  Insert at Head
                </Button>
                <Button onClick={insertAtTail} className={secondaryButton} variant="outline">
                  Insert at Tail
                </Button>
                <Button onClick={insertAtIndex} className={secondaryButton} variant="outline">
                  Insert at Index
                </Button>
                <Button onClick={removeValue} className={secondaryButton} variant="outline">
                  Delete by Value
                </Button>
                <Button onClick={search} className={secondaryButton} variant="outline">
                  Search
                </Button>
                <Button onClick={traverse} className={secondaryButton} variant="outline">
                  Traverse
                </Button>
                <Button
                  onClick={clearList}
                  className="h-7 w-full justify-start border-red-200 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950"
                  variant="outline"
                >
                  Clear List
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* RANDOM NODE GENERATOR */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="px-3 pb-1 pt-3">
              <CardTitle className="text-sm">Random Nodes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-3 pb-3">
              <div className="space-y-1">
                <label htmlFor="ll-count" className="text-[11px] font-medium text-muted-foreground">
                  Number of nodes
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
                  <label htmlFor="ll-min" className="text-[11px] font-medium text-muted-foreground">
                    Min
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
                  <label htmlFor="ll-max" className="text-[11px] font-medium text-muted-foreground">
                    Max
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

          {/* HISTORY */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-1 pt-3">
              <CardTitle className="text-sm">History</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHistory([])}
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
                <ul className="space-y-1.5">
                  {history.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-1.5 text-[11px] leading-snug"
                    >
                      <span className="font-bold text-red-600">↳</span>
                      <span className="min-w-0 break-words">{item}</span>
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

        {/* ===== RIGHT SIDE: TWO HORIZONTAL HALVES ===== */}
        <div className="grid min-h-0 min-w-0 grid-rows-[minmax(380px,1fr)_minmax(380px,1fr)] gap-3 lg:grid-rows-2">
          {/* ---------- UPPER HALF: VISUALIZATION PLAYGROUND ---------- */}
          <Card className="flex min-h-0 min-w-0 flex-col border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-3 border-b border-border px-4 py-2.5">
              <div className="min-w-0">
                <CardTitle className="text-base">
                  Visualization Playground
                </CardTitle>
                <CardDescription className="text-xs">
                  Follow the arrows to see each node&apos;s next pointer.
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
                  className="h-7 w-7 p-0 text-base"
                >
                  −
                </Button>
                <button
                  type="button"
                  onClick={resetZoom}
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

            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3">
              {/* LIST STATISTICS */}
              <div className="grid shrink-0 grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/40 py-2 text-center">
                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Head value</p>
                  <p className="break-words text-base font-bold">
                    {list.length ? list[0].value : "null"}
                  </p>
                </div>
                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Size</p>
                  <p className="text-base font-bold">{list.length}</p>
                </div>
                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Tail value</p>
                  <p className="break-words text-base font-bold">
                    {list.length ? list[list.length - 1].value : "null"}
                  </p>
                </div>
              </div>

              {/* LINKED LIST DIAGRAM (zoomable, scrollable) */}
              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-muted/20 p-4">
                {list.length === 0 ? (
                  <div className="flex h-full w-full flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-950/50">
                      ∅
                    </div>
                    <p className="text-lg font-semibold">Your list is empty</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Insert a node or generate a random list to begin.
                    </p>
                  </div>
                ) : (
                  <div
                    className="flex min-h-full w-max items-center"
                    style={{ zoom }}
                  >
                    <div className="flex min-w-max items-center py-4">
                      <div className="mr-3 flex flex-col items-center gap-3">
                        <Badge
                          variant="outline"
                          className="border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
                        >
                          HEAD
                        </Badge>
                        <span className="text-2xl text-red-600">↓</span>
                      </div>

                      {list.map((node, index) => {
                        const highlighted = activeNode === node.id;

                        return (
                          <div key={node.id} className="flex items-center">
                            <div
                              className={`relative flex h-32 w-28 flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                                highlighted
                                  ? "z-10 scale-105 border-red-500 bg-red-50 text-red-950 shadow-lg shadow-red-500/10 dark:bg-red-950/50 dark:text-red-100"
                                  : "border-border bg-card text-card-foreground"
                              }`}
                            >
                              <span
                                className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-xs font-bold ${
                                  highlighted
                                    ? "bg-red-600 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {index}
                              </span>

                              {highlighted && (
                                <span className="absolute -top-3 right-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                  ACTIVE
                                </span>
                              )}

                              <span className="max-w-full break-all px-1 text-2xl font-bold">
                                {node.value}
                              </span>

                              <div className="mt-3 flex w-full items-center justify-between px-3 text-xs text-muted-foreground">
                                <span>next</span>
                                <span
                                  className={`h-3 w-3 rounded-full ${
                                    highlighted ? "bg-red-600" : "bg-foreground"
                                  }`}
                                />
                              </div>
                            </div>

                            {index < list.length - 1 ? (
                              <div className="flex w-10 items-center justify-center sm:w-12">
                                <span
                                  className={`text-3xl transition-colors duration-300 ${
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
                              <div className="flex items-center gap-2 px-3">
                                <span className="text-2xl text-muted-foreground">
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

              {/* TRAVERSAL OUTPUT */}
              <div className="shrink-0 rounded-lg border border-border bg-card px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Traversal Output</p>
                  <Badge variant="outline" className="text-[11px]">
                    {selectedCode.complexity}
                  </Badge>
                </div>

                <p className="max-h-14 overflow-auto break-words rounded-md border border-border bg-muted/40 px-2 py-1.5 font-mono text-xs">
                  {traversal !== null
                    ? traversal.length
                      ? traversal.join(" → ") + " → NULL"
                      : "NULL"
                    : list.length
                      ? list.map((node) => node.value).join(" → ") + " → NULL"
                      : "NULL"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ---------- LOWER HALF: PSEUDOCODE + COMPLEXITY ---------- */}
          <div className="grid min-h-0 min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            {/* PSEUDOCODE */}
            <Card className="flex min-h-0 min-w-0 flex-col border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Pseudocode</CardTitle>
                  <Badge
                    variant="outline"
                    className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  >
                    {selectedCode.title}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {/* DARK CODE PANEL */}
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
                                : line.includes("if ") || line.includes("while ")
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

                {/* EXPLANATION */}
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
                    How it works
                  </h3>

                  <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-foreground">
                    {selectedCode.explanation.map((step, index) => (
                      <li key={`${operation}-step-${index}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* COMPLEXITY */}
            <Card className="flex min-h-0 min-w-0 flex-col border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <CardTitle className="text-base">Time Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Selected operation and all common operations.
                </CardDescription>
              </CardHeader>

              <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {/* SELECTED OPERATION COMPLEXITY */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
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
                      ? "Constant time: no traversal needed."
                      : "Linear time: may visit every node."}
                  </p>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="border-b border-border p-2">Operation</th>
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

                <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                  <span>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-600" />
                    O(1): Constant time
                  </span>
                  <span>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-600" />
                    O(n): Linear time
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}