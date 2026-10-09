"use client";

import { useState } from "react";
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

type Operation =
  | "push"
  | "pop"
  | "peek"
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
  {
    operation: "Push",
    key: "push",
    time: "O(1)",
    why: "Add an element to the top.",
  },
  {
    operation: "Pop",
    key: "pop",
    time: "O(1)",
    why: "Remove the top element.",
  },
  {
    operation: "Peek",
    key: "peek",
    time: "O(1)",
    why: "Read the top element.",
  },
  {
    operation: "Search",
    key: "search",
    time: "O(n)",
    why: "May inspect every element.",
  },
  {
    operation: "Traverse",
    key: "traverse",
    time: "O(n)",
    why: "Visit every element once.",
  },
  {
    operation: "Clear Stack",
    key: "clear",
    time: "O(1)",
    why: "Replace the stack with an empty array.",
  },
];

const primaryButton =
  "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500";

export function StackVisualizer() {
  const [stack, setStack] = useState<StackNode[]>([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ]);

  const [value, setValue] = useState("40");
  const [nextId, setNextId] = useState(4);

  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>("push");
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const [message, setMessage] = useState(
    "Choose an operation to get started."
  );

  const [history, setHistory] = useState<string[]>([]);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [zoom, setZoom] = useState(1);

  const [randomCount, setRandomCount] = useState("5");
  const [randomMin, setRandomMin] = useState("1");
  const [randomMax, setRandomMax] = useState("99");

  const selectedCode = pseudocode[operation];

  function recordHistory(text: string) {
    setHistory((old) => [text, ...old].slice(0, 8));
    setMessage(text);
  }

  function readNumber(): number | null {
    if (value.trim() === "" || !Number.isFinite(Number(value))) {
      setMessage("Enter a valid number first.");
      return null;
    }

    return Number(value);
  }

  function handlePush() {
    const n = readNumber();
    if (n === null) return;

    setOperation("push");
    setActiveLine(2);
    setActiveNode(nextId);
    setTraversal(null);

    setStack((old) => push(old, n, nextId));
    setNextId((old) => old + 1);

    recordHistory(`Pushed ${n} onto the stack.`);
  }

  function handlePop() {
    setOperation("pop");
    setTraversal(null);

    if (stack.length === 0) {
      setActiveNode(null);
      setActiveLine(2);
      setMessage("Cannot pop from an empty stack.");
      return;
    }

    const removed = stack[stack.length - 1];

    setActiveNode(removed.id);
    setActiveLine(4);
    setStack((old) => pop(old));

    recordHistory(`Popped ${removed.value} from the top.`);
  }

  function handlePeek() {
    setOperation("peek");
    setTraversal(null);

    if (stack.length === 0) {
      setActiveNode(null);
      setActiveLine(2);
      setMessage("The stack is empty.");
      return;
    }

    const topValue = peekStack(stack);

    setActiveNode(stack[stack.length - 1].id);
    setActiveLine(3);

    recordHistory(
      `Top element: ${topValue}. The stack remains unchanged.`
    );
  }

  function handleSearch() {
    const n = readNumber();
    if (n === null) return;

    setOperation("search");
    setTraversal(null);

    const index = searchStack(stack, n);

    setActiveLine(index === -1 ? 4 : 3);
    setActiveNode(index === -1 ? null : stack[index].id);

    if (index === -1) {
      recordHistory(`Value ${n} was not found in the stack.`);
    } else {
      const positionFromTop = stack.length - 1 - index;

      recordHistory(
        `Found ${n} at array index ${index}, position ${positionFromTop} from the top.`
      );
    }
  }

  function handleTraverse() {
    setOperation("traverse");
    setActiveLine(2);
    setActiveNode(null);

    const values = stack
      .slice()
      .reverse()
      .map((node) => node.value);

    setTraversal(values);

    recordHistory(
      `Traversed ${stack.length} element(s), from top to bottom.`
    );
  }

  function handleClear() {
    setOperation("clear");
    setActiveLine(1);
    setActiveNode(null);
    setTraversal(null);
    setStack(clearStack());

    recordHistory("Cleared the stack.");
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

    let generatedStack: StackNode[] = [];
    let id = nextId;

    for (let i = 0; i < count; i++) {
      const randomValue =
        Math.floor(Math.random() * (max - min + 1)) + min;

      generatedStack = push(generatedStack, randomValue, id);
      id++;
    }

    setStack(generatedStack);
    setNextId(id);
    setOperation("traverse");
    setActiveNode(null);
    setActiveLine(null);

    const values = generatedStack
      .slice()
      .reverse()
      .map((node) => node.value);

    setTraversal(values);

    recordHistory(`Generated a stack with ${count} elements.`);
  }

  function handleZoomIn() {
    setZoom((current) =>
      Math.min(1.8, Math.round((current + 0.1) * 10) / 10)
    );
  }

  function handleZoomOut() {
    setZoom((current) =>
      Math.max(0.5, Math.round((current - 0.1) * 10) / 10)
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Stack Visualizer
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore LIFO operations through an interactive stack.
          </p>
        </div>

        <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
          LIFO · Stack
        </Badge>
      </header>

      {/* MAIN LAYOUT */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* LEFT SIDEBAR */}
        <aside className="min-h-0 min-w-0 space-y-3 lg:overflow-y-auto lg:pr-1">
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
                className={`h-8 w-full text-xs ${primaryButton}`}
              >
                + Push
              </Button>

              <Button
                onClick={handlePop}
                variant="outline"
                className="h-8 w-full text-xs"
              >
                − Pop
              </Button>

              <Button
                onClick={handlePeek}
                variant="outline"
                className="h-8 w-full text-xs"
              >
                Peek Top
              </Button>

              <Button
                onClick={handleSearch}
                variant="outline"
                className="h-8 w-full text-xs"
              >
                Search Value
              </Button>

              <Button
                onClick={handleTraverse}
                variant="outline"
                className="h-8 w-full text-xs"
              >
                Traverse Stack
              </Button>

              <Button
                onClick={handleClear}
                variant="outline"
                className="h-8 w-full border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Clear Stack
              </Button>
            </CardContent>
          </Card>

          {/* RANDOM GENERATOR */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Random Nodes</CardTitle>
              <CardDescription className="text-xs">
                Generate sample elements
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
                Generate Stack
              </Button>
            </CardContent>
          </Card>

          {/* HISTORY */}
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

          {/* STATUS */}
          <Alert className="border-red-100 bg-red-50/60">
            <AlertDescription className="text-xs leading-relaxed text-red-900">
              {message}
            </AlertDescription>
          </Alert>
        </aside>

        {/* RIGHT CONTENT */}
        <section className="grid min-h-0 min-w-0 grid-cols-1 gap-3 lg:grid-rows-2">
          {/* VISUALIZATION PLAYGROUND */}
          <Card className="flex min-h-[420px] min-w-0 flex-col overflow-hidden">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b p-3 sm:p-4">
              <div>
                <CardTitle className="text-base">
                  Visualization Playground
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

            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
              {/* STATISTICS */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-muted/20 p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                    Top
                  </p>
                  <p className="truncate text-lg font-semibold">
                    {stack.length > 0
                      ? stack[stack.length - 1].value
                      : "—"}
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
              <div className="flex min-h-[170px] flex-1 flex-col overflow-hidden rounded-lg border bg-muted/10">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-medium">Stack Structure</span>
                  <Badge variant="outline" className="text-[10px]">
                    LIFO
                  </Badge>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
                  {stack.length === 0 ? (
                    <div className="text-center">
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
                      className="flex min-w-max flex-col items-center py-3 transition-transform"
                      style={{ zoom }}
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

                          return (
                            <div
                              key={node.id}
                              className={`relative flex h-14 min-w-36 items-center justify-between gap-5 border-2 px-4 transition-all ${
                                isTop ? "rounded-t-xl" : ""
                              } ${
                                isBottom ? "rounded-b-xl" : ""
                              } ${
                                isActive
                                  ? "z-10 scale-105 border-red-600 bg-red-100 text-red-900 ring-2 ring-red-300"
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

                              {isActive && (
                                <span className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                          );
                        })}

                      <div className="mt-1 text-xl text-muted-foreground">
                        ↓
                      </div>

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
                    stack.map((node, index) => (
                      <div
                        key={node.id}
                        className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
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

          {/* BOTTOM HALF: PSEUDOCODE + COMPLEXITY */}
          <div className="grid min-h-[420px] min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            {/* PSEUDOCODE */}
            <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden">
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
            <Card className="flex min-h-0 min-w-0 flex-col overflow-hidden">
              <CardHeader className="p-3 pb-2 sm:p-4 sm:pb-2">
                <CardTitle className="text-sm">Time Complexity</CardTitle>
                <CardDescription className="text-xs">
                  Performance of stack operations
                </CardDescription>
              </CardHeader>

              <CardContent className="min-h-0 flex-1 overflow-auto p-3 pt-1 sm:p-4 sm:pt-1">
                <div className="space-y-2">
                  {complexityRows.map((item) => {
                    const isActive = item.key === operation;

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
                              isActive
                                ? "border-red-300 text-red-700"
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
                    A stack containing n elements requires O(n) space.
                    Push and pop take O(1) additional space per operation,
                    excluding the node being added or removed.
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