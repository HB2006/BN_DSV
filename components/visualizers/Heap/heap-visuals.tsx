
"use client";

import { useState } from "react";
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
  "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500";

const secondaryButton =
  "h-7 w-full justify-start border border-border bg-card px-2 text-xs text-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

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
  const [history, setHistory] = useState<string[]>([]);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [randomCount, setRandomCount] = useState("7");
  const [minValue, setMinValue] = useState("1");
  const [maxValue, setMaxValue] = useState("100");
  const [zoom, setZoom] = useState(1);

  const selectedCode = pseudocode[operation];

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

  function insert() {
    const n = readNumber();
    if (n === null) return;

    setOperation("insert");
    setActiveLine(6);
    setActiveNode(nextId);
    setHeap((old) => insertHeap(old, n, nextId));
    setNextId((old) => old + 1);
    record(`Inserted ${n} into the min-heap.`);
  }

  function removeMinimum() {
    setOperation("delete-min");

    if (heap.length === 0) {
      setActiveLine(1);
      setActiveNode(null);
      setMessage("Cannot delete from an empty heap.");
      return;
    }

    const minValue = heap[0].value;

    setActiveLine(9);
    setActiveNode(null);
    setHeap((old) => deleteMin(old));
    record(`Deleted the minimum value ${minValue}.`);
  }

  function search() {
    const n = readNumber();
    if (n === null) return;

    setOperation("search");

    const index = searchHeap(heap, n);

    setActiveLine(index === -1 ? 4 : 3);
    setActiveNode(index === -1 ? null : heap[index].id);
    setTraversal(null);

    setMessage(
      index === -1
        ? `Value ${n} was not found.`
        : `Found ${n} at array index ${index}.`
    );
  }

  function peekMinimum() {
    setOperation("get-min");

    if (heap.length === 0) {
      setActiveLine(1);
      setActiveNode(null);
      setMessage("The heap is empty. No minimum exists.");
      return;
    }

    setActiveLine(2);
    setActiveNode(heap[0].id);
    setTraversal(null);
    setMessage(`Minimum value: ${getMin(heap)}.`);
  }

  function traverse() {
    setOperation("traverse");
    setActiveLine(2);
    setActiveNode(null);

    const values = heap.map((node) => node.value);

    setTraversal(values);
    setMessage(
      values.length
        ? `Traversed ${values.length} heap elements in level order.`
        : "The heap is empty."
    );
  }

  function clearHeap() {
    setOperation("clear");
    setActiveLine(1);
    setActiveNode(null);
    setHeap([]);
    setTraversal(null);
    record("Cleared the heap.");
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

    const values = Array.from(
      { length: count },
      () => Math.floor(Math.random() * (max - min + 1)) + min
    );

    // Build a valid min-heap by inserting each generated value.
    let generated: HeapNode[] = [];

    values.forEach((n, index) => {
      generated = insertHeap(generated, n, nextId + index);
    });

    setHeap(generated);
    setNextId((old) => old + count);
    setOperation("traverse");
    setActiveLine(null);
    setActiveNode(null);
    setTraversal(null);
    record(`Generated a min-heap with ${count} random nodes.`);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
      {/* PAGE HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Min-Heap Visualizer
          </h1>
          <p className="text-xs text-muted-foreground">
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

      {/* BODY: SIDEBAR + RIGHT WORKSPACE */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-4 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* LEFT SIDEBAR */}
        <aside className="min-h-0 min-w-0 space-y-3 lg:overflow-y-auto lg:pr-1">
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
                  className="h-7 bg-background px-2 text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <Button
                  onClick={insert}
                  className={secondaryButton}
                  variant="outline"
                >
                  Insert
                </Button>
                <Button
                  onClick={removeMinimum}
                  className={secondaryButton}
                  variant="outline"
                >
                  Delete Minimum
                </Button>
                <Button
                  onClick={search}
                  className={secondaryButton}
                  variant="outline"
                >
                  Search
                </Button>
                <Button
                  onClick={peekMinimum}
                  className={secondaryButton}
                  variant="outline"
                >
                  Get Minimum
                </Button>
                <Button
                  onClick={traverse}
                  className={secondaryButton}
                  variant="outline"
                >
                  Level-Order Traversal
                </Button>
                <Button
                  onClick={clearHeap}
                  className="h-7 w-full justify-start border-red-200 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950"
                  variant="outline"
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
                  className="h-7 px-2 text-xs"
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
                    className="h-7 px-2 text-xs"
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
                    className="h-7 px-2 text-xs"
                  />
                </div>
              </div>

              <Button
                onClick={generateRandom}
                className={`h-7 w-full text-xs ${primaryButton}`}
              >
                Generate Heap
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

        {/* RIGHT WORKSPACE: TOP + BOTTOM */}
        <div className="grid min-h-0 min-w-0 grid-rows-[minmax(380px,1fr)_minmax(380px,1fr)] gap-3 lg:grid-rows-2">
          {/* TOP: VISUALIZATION PLAYGROUND */}
          <Card className="flex min-h-0 min-w-0 flex-col border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-2.5">
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
              {/* STATISTICS */}
              <div className="grid shrink-0 grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/40 py-2 text-center">
                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">
                    Minimum
                  </p>
                  <p className="break-words text-base font-bold">
                    {heap.length ? heap[0].value : "—"}
                  </p>
                </div>

                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">
                    Heap Size
                  </p>
                  <p className="text-base font-bold">{heap.length}</p>
                </div>

                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">
                    Height
                  </p>
                  <p className="text-base font-bold">
                    {heap.length ? Math.floor(Math.log2(heap.length)) : "—"}
                  </p>
                </div>
              </div>

              {/* TREE PLAYGROUND */}
              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-muted/20 p-4">
                {heap.length === 0 ? (
                  <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-950/50">
                      ∅
                    </div>
                    <p className="text-lg font-semibold">Your heap is empty</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Insert a value or generate a random heap to begin.
                    </p>
                  </div>
                ) : (
                  <div
                    className="flex min-h-full w-max min-w-full items-center justify-center"
                    style={{ zoom }}
                  >
                    <div className="flex min-w-max flex-col items-center gap-7 py-5">
                      {Array.from({
                        length: Math.floor(Math.log2(heap.length)) + 1,
                      }).map((_, level) => {
                        const start = 2 ** level - 1;
                        const end = Math.min(
                          2 ** (level + 1) - 1,
                          heap.length
                        );

                        return (
                          <div
                            key={level}
                            className="flex items-start justify-center gap-5 sm:gap-10"
                          >
                            {heap.slice(start, end).map((node, offset) => {
                              const index = start + offset;
                              const highlighted = activeNode === node.id;
                              const left = 2 * index + 1;
                              const right = 2 * index + 2;

                              return (
                                <div
                                  key={node.id}
                                  className="flex flex-col items-center gap-2"
                                >
                                  <div
                                    className={`relative flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 transition-all duration-300 ${
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
                )}
              </div>

              {/* ARRAY REPRESENTATION */}
              <div className="shrink-0 rounded-lg border border-border bg-card px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Heap Array</p>
                  <Badge variant="outline" className="text-[11px]">
                    {heap.length} elements
                  </Badge>
                </div>

                <div className="flex max-h-16 flex-wrap gap-1.5 overflow-auto">
                  {heap.length ? (
                    heap.map((node, index) => (
                      <div
                        key={node.id}
                        className={`min-w-12 rounded-md border px-2 py-1 text-center ${
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
                    ))
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

          {/* BOTTOM: PSEUDOCODE + COMPLEXITY */}
          <div className="grid min-h-0 min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            {/* PSEUDOCODE PANEL */}
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

            {/* COMPLEXITY PANEL */}
            <Card className="flex min-h-0 min-w-0 flex-col border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <CardTitle className="text-base">Time Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Selected operation and all heap operations.
                </CardDescription>
              </CardHeader>

              <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
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
        </div>
      </div>
    </main>
  );
}
