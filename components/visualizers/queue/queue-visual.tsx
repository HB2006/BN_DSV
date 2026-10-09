
"use client";

import { useState } from "react";
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

const pseudocode: Record<
  Operation,
  { title: string; lines: string[]; explanation: string }
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
  },
};

const complexity = [
  {
    operation: "Enqueue",
    time: "O(1)",
    why: "Add a node at the rear.",
  },
  {
    operation: "Dequeue",
    time: "O(1)",
    why: "Remove the front element.",
  },
  {
    operation: "Peek",
    time: "O(1)",
    why: "Read the front element directly.",
  },
  {
    operation: "Search",
    time: "O(n)",
    why: "The target may be anywhere in the queue.",
  },
  {
    operation: "Traversal",
    time: "O(n)",
    why: "Visit every node once.",
  },
  {
    operation: "Clear",
    time: "O(1)",
    why: "Reset the queue to an empty array.",
  },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;

function getNodeValue(node: ListNode): string {
  const item = node as ListNode & { data?: number | string };
  return String(item.value ?? item.data ?? "");
}

function getNodeId(node: ListNode, index: number): string | number {
  const item = node as ListNode & { id?: string | number };
  return item.id ?? `${getNodeValue(node)}-${index}`;
}

export default function QueueVisualizer() {
  const [queue, setQueue] = useState<ListNode[]>([]);
  const [nextId, setNextId] = useState(1);

  const [inputValue, setInputValue] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [message, setMessage] = useState("Queue is ready.");
  const [operation, setOperation] = useState<Operation>("enqueue");
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [highlightedValue, setHighlightedValue] = useState<string | null>(
    null
  );
  const [traversal, setTraversal] = useState<string[] | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);

  const [randomCount, setRandomCount] = useState("5");
  const [randomMin, setRandomMin] = useState("1");
  const [randomMax, setRandomMax] = useState("99");

  const selectedCode = pseudocode[operation];

  const recordHistory = (text: string) => {
    setHistory((previous) => [text, ...previous].slice(0, 8));
    setMessage(text);
  };

  const resetHighlights = () => {
    setHighlightedValue(null);
    setTraversal(null);
    setActiveLine(null);
  };

  const handleEnqueue = () => {
    if (inputValue.trim() === "") {
      setMessage("Please enter a value to enqueue.");
      return;
    }

    const value = Number(inputValue);

    if (!Number.isFinite(value)) {
      setMessage("Please enter a valid number.");
      return;
    }

    // enqueue requires queue, value, and a unique ID.
    const updatedQueue = enqueue(queue, value, nextId);

    setQueue(updatedQueue);
    setNextId((currentId) => currentId + 1);
    setOperation("enqueue");
    setHighlightedValue(String(value));
    setTraversal(null);
    setActiveLine(6);
    setInputValue("");

    recordHistory(`Enqueued ${value}`);
  };

  const handleDequeue = () => {
    setOperation("dequeue");
    setTraversal(null);

    if (queue.length === 0) {
      setHighlightedValue(null);
      setActiveLine(2);
      setMessage("Cannot dequeue: the queue is empty.");
      return;
    }

    const removedValue = getNodeValue(queue[0]);
    const updatedQueue = queue.slice(1);

    setQueue(updatedQueue);
    setHighlightedValue(null);
    setActiveLine(5);

    recordHistory(`Dequeued ${removedValue}`);
  };

  const handlePeek = () => {
    setOperation("peek");
    setTraversal(null);

    if (queue.length === 0) {
      setHighlightedValue(null);
      setActiveLine(2);
      setMessage("The queue is empty. There is no front element.");
      return;
    }

    const frontValue = getNodeValue(queue[0]);

    setHighlightedValue(frontValue);
    setActiveLine(4);

    recordHistory(`Peeked front: ${frontValue}`);
  };

  const handleSearch = () => {
    if (searchValue.trim() === "") {
      setMessage("Enter a value to search for.");
      return;
    }

    const target = Number(searchValue);

    if (!Number.isFinite(target)) {
      setMessage("Please enter a valid number to search for.");
      return;
    }

    setOperation("search");
    setTraversal(null);

    const foundIndex = queue.findIndex(
      (node) => getNodeValue(node) === String(target)
    );

    if (foundIndex !== -1) {
      setHighlightedValue(String(target));
      setActiveLine(6);
      recordHistory(`Found ${target} at position ${foundIndex}`);
    } else {
      setHighlightedValue(null);
      setActiveLine(9);
      recordHistory(`${target} was not found`);
    }
  };

  const handleTraverse = () => {
    setOperation("traverse");
    setActiveLine(4);
    setHighlightedValue(null);

    const values = queue.map((node) => getNodeValue(node));
    setTraversal(values);

    recordHistory(
      values.length > 0
        ? `Traversed queue: ${values.join(" → ")}`
        : "Traversed an empty queue"
    );
  };

  const handleClear = () => {
    setQueue([]);
    setOperation("clear");
    setHighlightedValue(null);
    setTraversal(null);
    setActiveLine(2);

    recordHistory("Cleared the queue");
  };

  const handleGenerate = () => {
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
        "Enter a node count from 1–20 and valid integer minimum and maximum values."
      );
      return;
    }

    let generatedQueue: ListNode[] = [];
    let id = nextId;

    for (let i = 0; i < count; i++) {
      const value = Math.floor(Math.random() * (max - min + 1)) + min;

      generatedQueue = enqueue(generatedQueue, value, id);
      id++;
    }

    setQueue(generatedQueue);
    setNextId(id);
    setOperation("traverse");
    setHighlightedValue(null);
    setActiveLine(null);

    const values = generatedQueue.map((node) => getNodeValue(node));
    setTraversal(values);

    recordHistory(`Generated a queue with ${generatedQueue.length} nodes`);
  };

  const handleZoomIn = () => {
    setZoom((current) =>
      Math.min(MAX_ZOOM, Math.round((current + ZOOM_STEP) * 10) / 10)
    );
  };

  const handleZoomOut = () => {
    setZoom((current) =>
      Math.max(MIN_ZOOM, Math.round((current - ZOOM_STEP) * 10) / 10)
    );
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Queue Visualizer
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore FIFO operations through an interactive queue.
          </p>
        </div>

        <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          FIFO · Queue
        </Badge>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="min-h-0 min-w-0 space-y-3 lg:overflow-y-auto lg:pr-1">
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Operations</CardTitle>
              <CardDescription className="text-xs">
                Modify your queue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 p-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-medium">Value</label>
                <Input
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
                className="h-8 w-full bg-red-600 text-xs hover:bg-red-700"
              >
                <span className="mr-2">+</span> Enqueue
              </Button>

              <Button
                onClick={handleDequeue}
                variant="outline"
                className="h-8 w-full text-xs"
              >
                <span className="mr-2">−</span> Dequeue
              </Button>

              <Button
                onClick={handlePeek}
                variant="outline"
                className="h-8 w-full text-xs"
              >
                <span className="mr-2">⌕</span> Peek Front
              </Button>

              <div className="space-y-1 border-t pt-2">
                <label className="text-xs font-medium">Search value</label>
                <Input
                  type="number"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="Search value"
                  className="h-8 text-sm"
                />

                <Button
                  onClick={handleSearch}
                  variant="outline"
                  className="h-8 w-full text-xs"
                >
                  Search
                </Button>
              </div>

              <Button
                onClick={handleTraverse}
                variant="outline"
                className="h-8 w-full text-xs"
              >
                FIFO Traversal
              </Button>

              <Button
                onClick={handleClear}
                variant="outline"
                className="h-8 w-full border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Clear Queue
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Random Queue</CardTitle>
              <CardDescription className="text-xs">
                Generate sample values
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 p-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-medium">Node count</label>
                <Input
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
                Generate Queue
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
              <CardTitle className="text-sm">History</CardTitle>
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
                <div className="space-y-2">
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

          <Alert className="border-red-100 bg-red-50/60">
            <AlertDescription className="text-xs leading-relaxed text-red-900">
              {message}
            </AlertDescription>
          </Alert>
        </aside>

        <section className="grid min-h-0 min-w-0 grid-cols-1 gap-3 lg:grid-rows-2">
          <Card className="flex min-h-[420px] min-w-0 flex-col overflow-hidden">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b p-3 sm:p-4">
              <div>
                <CardTitle className="text-base">
                  Visualization Playground
                </CardTitle>
                <CardDescription className="text-xs">
                  Front-to-rear queue representation
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

            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
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

              <div className="flex min-h-[160px] flex-1 flex-col overflow-hidden rounded-lg border bg-muted/10">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-medium">Queue Structure</span>
                  <Badge variant="outline" className="text-[10px]">
                    FIFO
                  </Badge>
                </div>

                <div className="flex min-h-0 flex-1 items-center overflow-auto p-4">
                  {queue.length === 0 ? (
                    <div className="w-full text-center">
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
                      className="mx-auto flex min-w-max items-center gap-3 py-4 transition-transform"
                      style={{ zoom }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Badge className="bg-red-600 text-white hover:bg-red-600">
                          FRONT
                        </Badge>
                        <div className="text-xl text-red-600">↓</div>
                      </div>

                      {queue.map((node, index) => {
                        const value = getNodeValue(node);
                        const isHighlighted = highlightedValue === value;
                        const isFront = index === 0;
                        const isRear = index === queue.length - 1;

                        return (
                          <div
                            key={getNodeId(node, index)}
                            className="flex items-center gap-3"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div
                                className={`flex h-16 min-w-16 items-center justify-center rounded-xl border-2 px-3 text-lg font-bold shadow-sm transition-all ${
                                  isHighlighted
                                    ? "scale-105 border-red-600 bg-red-100 text-red-800 ring-2 ring-red-300"
                                    : isFront
                                      ? "border-red-400 bg-red-50 text-red-700"
                                      : "border-border bg-card text-foreground"
                                }`}
                              >
                                {value}
                              </div>

                              <span className="text-[10px] text-muted-foreground">
                                Index {index}
                              </span>

                              {isFront && (
                                <Badge
                                  variant="outline"
                                  className="border-red-300 text-[10px] text-red-700"
                                >
                                  Front
                                </Badge>
                              )}

                              {isRear && (
                                <Badge variant="outline" className="text-[10px]">
                                  Rear
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

              <div className="rounded-lg border p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Queue Representation</p>
                  <span className="text-[10px] text-muted-foreground">
                    Front → Rear
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {queue.length === 0 ? (
                    <span className="text-xs text-muted-foreground">[]</span>
                  ) : (
                    queue.map((node, index) => (
                      <div
                        key={`${getNodeId(node, index)}-array`}
                        className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                          highlightedValue === getNodeValue(node)
                            ? "border-red-400 bg-red-50 font-semibold text-red-700"
                            : "bg-muted/20"
                        }`}
                      >
                        {getNodeValue(node)}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/10 p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    Traversal / Operation Output
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {complexity.find(
                      (item) =>
                        item.operation.toLowerCase() ===
                        (operation === "traverse"
                          ? "traversal"
                          : operation)
                    )?.time ?? "O(n)"}
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

          <div className="grid min-h-[420px] min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm">Pseudocode</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {selectedCode.title}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Follow the current operation step by step.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3 pt-1 sm:p-4 sm:pt-1">
                <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100">
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
                  <p className="mb-1 text-xs font-semibold">Explanation</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {selectedCode.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm">Time Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Performance of queue operations
                </CardDescription>
              </CardHeader>

              <CardContent className="min-h-0 flex-1 overflow-auto p-3 pt-1 sm:p-4 sm:pt-1">
                <div className="space-y-2">
                  {complexity.map((item) => {
                    const normalizedOperation =
                      operation === "traverse" ? "traversal" : operation;

                    const isActive =
                      item.operation.toLowerCase() === normalizedOperation;

                    return (
                      <div
                        key={item.operation}
                        className={`rounded-lg border p-3 transition-colors ${
                          isActive
                            ? "border-red-300 bg-red-50/70"
                            : "bg-card"
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
                    A queue storing n elements requires O(n) space. Enqueue
                    and dequeue take O(1) time per operation.
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
