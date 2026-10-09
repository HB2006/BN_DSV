
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
  { title: string; lines: string[]; explanation: string[]; complexity: string }
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
    lines: [
      "// Remove all nodes",
      "head = null",
      "size = 0",
      "return",
    ],
    explanation: [
      "Set the head pointer to null.",
      "Reset the size to zero.",
      "The list is now empty.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows = [
  { operation: "Insert at Head", time: "O(1)", why: "Update the head pointer directly." },
  { operation: "Insert at Tail", time: "O(n)", why: "Traverse to the last node." },
  { operation: "Insert at Index", time: "O(n)", why: "Find the insertion position." },
  { operation: "Delete by Value", time: "O(n)", why: "Find the target node." },
  { operation: "Search", time: "O(n)", why: "May inspect every node." },
  { operation: "Traverse", time: "O(n)", why: "Visit each node once." },
  { operation: "Clear List", time: "O(1)", why: "Reset the head pointer and size." },
];

const primaryButton =
  "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500";

const secondaryButton =
  "border border-border bg-card text-foreground hover:bg-muted";

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

  const selectedCode = pseudocode[operation];

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
      index === -1
        ? `Value ${n} was not found.`
        : `Found ${n} at index ${index}.`
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
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Linked List Visualizer
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
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

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(260px,0.9fr)_minmax(400px,1.4fr)_minmax(320px,1.1fr)]">
          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-5">
            <Card className="border-border bg-card text-card-foreground shadow-sm">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-xl">List Controls</CardTitle>
                <CardDescription>
                  Perform operations on the linked list.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-5">
                <div className="space-y-2">
                  <label htmlFor="ll-value" className="text-sm font-medium">
                    Node value
                  </label>
                  <Input
                    id="ll-value"
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter value"
                    className="border-input bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="ll-position" className="text-sm font-medium">
                    Position / Index (0-based)
                  </label>
                  <Input
                    id="ll-position"
                    type="number"
                    min="0"
                    max={list.length}
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Enter index"
                    className="border-input bg-background"
                  />
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium">Operations</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={insertAtHead} className={primaryButton}>
                      Insert at Head
                    </Button>
                    <Button onClick={insertAtTail} className={secondaryButton}>
                      Insert at Tail
                    </Button>
                    <Button onClick={insertAtIndex} className={secondaryButton}>
                      Insert at Index
                    </Button>
                    <Button
                      onClick={removeValue}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/50"
                    >
                      Delete by Value
                    </Button>
                    <Button onClick={search} className={secondaryButton}>
                      Search
                    </Button>
                    <Button onClick={traverse} className={secondaryButton}>
                      Traverse
                    </Button>
                  </div>

                  <Button
                    onClick={clearList}
                    variant="outline"
                    className="mt-2 w-full border-border"
                  >
                    Clear List
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card text-card-foreground shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Generate Random Nodes
                </CardTitle>
                <CardDescription>
                  Generate a list using your chosen value range.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="min-w-0 space-y-1">
                    <label htmlFor="ll-count" className="text-xs text-muted-foreground">
                      Count
                    </label>
                    <Input
                      id="ll-count"
                      type="number"
                      min="1"
                      max="30"
                      value={randomCount}
                      onChange={(e) => setRandomCount(e.target.value)}
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <label htmlFor="ll-min" className="text-xs text-muted-foreground">
                      Min value
                    </label>
                    <Input
                      id="ll-min"
                      type="number"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <label htmlFor="ll-max" className="text-xs text-muted-foreground">
                      Max value
                    </label>
                    <Input
                      id="ll-max"
                      type="number"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={generateRandom} className={`w-full ${primaryButton}`}>
                  Generate Random List
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border bg-card text-card-foreground shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Operation History</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistory([])}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </CardHeader>

              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Your recent operations will appear here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {history.map((item, index) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex gap-2 text-sm"
                      >
                        <span className="font-bold text-red-600">↳</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Alert className="border-red-200 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
              <AlertDescription>
                <span className="font-semibold text-red-700 dark:text-red-300">
                  Status:
                </span>{" "}
                {message}
              </AlertDescription>
            </Alert>
          </div>

          {/* CENTRE COLUMN */}
          <Card className="min-w-0 border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl">
                Visualization Playground
              </CardTitle>
              <CardDescription>
                Follow the arrows to understand each node's next pointer.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-muted/40 py-4 text-center">
                <div className="px-1">
                  <p className="text-xs text-muted-foreground">Head value</p>
                  <p className="mt-1 break-words text-xl font-bold">
                    {list.length ? list[0].value : "null"}
                  </p>
                </div>
                <div className="px-1">
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="mt-1 text-xl font-bold">{list.length}</p>
                </div>
                <div className="px-1">
                  <p className="text-xs text-muted-foreground">Tail value</p>
                  <p className="mt-1 break-words text-xl font-bold">
                    {list.length ? list[list.length - 1].value : "null"}
                  </p>
                </div>
              </div>

              <div className="flex min-h-[360px] items-center overflow-x-auto rounded-xl border border-border bg-muted/20 p-6 sm:p-8">
                {list.length === 0 ? (
                  <div className="w-full text-center">
                    <p className="text-lg font-semibold text-foreground">
                      Your list is empty
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Insert a node or generate a random list to begin.
                    </p>
                  </div>
                ) : (
                  <div className="flex min-w-max items-center">
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
                            <div className="flex w-12 items-center justify-center">
                              <span
                                className={`text-3xl transition-colors duration-300 ${
                                  highlighted || activeNode === list[index + 1].id
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
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Traversal Output</p>
                  <Badge variant="outline">{selectedCode.complexity}</Badge>
                </div>

                <p className="break-words rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm">
                  {traversal !== null
                    ? traversal.length
                      ? traversal.join(" → ") + " → NULL"
                      : "NULL"
                    : list.length
                      ? list.map((node) => node.value).join(" → ") + " → NULL"
                      : "NULL"}
                </p>

                <p className="mt-3 text-xs text-muted-foreground">
                  The red outline identifies the node affected by the latest operation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT COLUMN: DARK PSEUDOCODE */}
          <Card className="min-w-0 border-border bg-card text-card-foreground shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl">Pseudocode</CardTitle>
              <CardDescription>
                Logic and explanation for the selected operation.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 dark:border-red-900 dark:bg-red-950/40">
                <p className="font-semibold text-red-800 dark:text-red-300">
                  {selectedCode.title}
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 shadow-inner">
                <div className="min-w-max space-y-1 py-2 font-mono">
                  {selectedCode.lines.map((line, index) => (
                    <div
                      key={`${operation}-${index}`}
                      className={`flex items-start gap-3 rounded px-2 py-2 transition-colors duration-200 ${
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

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <h3 className="mb-3 font-semibold text-red-700 dark:text-red-300">
                  How it works
                </h3>
                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
                  {selectedCode.explanation.map((step, index) => (
                    <li key={`${operation}-step-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">
                  Time complexity
                </p>
                <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">
                  {selectedCode.complexity}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FULL-WIDTH COMPLEXITY TABLE */}
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">
              Time Complexity of Operations
            </CardTitle>
            <CardDescription>
              Time complexity for common singly linked-list operations.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="border-b border-border p-3">Operation</th>
                    <th className="border-b border-border p-3">Time</th>
                    <th className="border-b border-border p-3">Why?</th>
                  </tr>
                </thead>

                <tbody>
                  {complexityRows.map((row) => (
                    <tr
                      key={row.operation}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="border-b border-border p-3 font-medium">
                        {row.operation}
                      </td>
                      <td className="border-b border-border p-3">
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
                      <td className="border-b border-border p-3 text-muted-foreground">
                        {row.why}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
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
    </main>
  );
}