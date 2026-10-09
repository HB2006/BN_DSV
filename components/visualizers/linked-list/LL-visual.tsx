
"use client";

import { useState } from "react";
import type { ListNode } from "./type";

import {
  insertHead,
  insertTail,
  insertAtPosition,
  deleteValue,
  searchValue,
} from "./linked-list-operations";

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

export function LinkedListVisualizer() {
  const [list, setList] = useState<ListNode[]>([
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
  ]);

  const [value, setValue] = useState("40");
  const [position, setPosition] = useState("1");
  const [nextId, setNextId] = useState(4);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [message, setMessage] = useState(
    "Ready. Choose an operation to get started."
  );
  const [complexity, setComplexity] = useState("—");
  const [traversal, setTraversal] = useState<number[] | null>(null);

  const readValue = (): number | null => {
    if (value.trim() === "") {
      setMessage("Please enter a value.");
      return null;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      setMessage("Please enter a valid number.");
      return null;
    }

    return parsed;
  };

  const handleInsertHead = () => {
    const parsed = readValue();
    if (parsed === null) return;

    setList((current) => insertHead(current, parsed, nextId));
    setNextId((id) => id + 1);
    setHighlightedId(null);
    setTraversal(null);
    setMessage(`Inserted ${parsed} at the head.`);
    setComplexity("O(1)");
  };

  const handleInsertTail = () => {
    const parsed = readValue();
    if (parsed === null) return;

    setList((current) => insertTail(current, parsed, nextId));
    setNextId((id) => id + 1);
    setHighlightedId(null);
    setTraversal(null);
    setMessage(`Inserted ${parsed} at the tail.`);
    setComplexity("O(n)");
  };

  const handleInsertPosition = () => {
    const parsed = readValue();
    if (parsed === null) return;

    if (position.trim() === "") {
      setMessage("Please enter a position.");
      return;
    }

    const parsedPosition = Number(position);

    if (
      !Number.isInteger(parsedPosition) ||
      parsedPosition < 0 ||
      parsedPosition > list.length
    ) {
      setMessage(
        `Position must be an integer between 0 and ${list.length}.`
      );
      return;
    }

    try {
      setList((current) =>
        insertAtPosition(current, parsed, parsedPosition, nextId)
      );

      setNextId((id) => id + 1);
      setHighlightedId(null);
      setTraversal(null);
      setMessage(
        `Inserted ${parsed} at index ${parsedPosition}.`
      );
      setComplexity("O(n)");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Insertion failed."
      );
    }
  };

  const handleDelete = () => {
    const parsed = readValue();
    if (parsed === null) return;

    const existingNode = list.find((node) => node.value === parsed);

    if (!existingNode) {
      setMessage(`Value ${parsed} was not found.`);
      setComplexity("O(n)");
      return;
    }

    setList((current) => deleteValue(current, parsed));
    setHighlightedId(null);
    setTraversal(null);
    setMessage(`Deleted the first occurrence of ${parsed}.`);
    setComplexity("O(n)");
  };

  const handleSearch = () => {
    const parsed = readValue();
    if (parsed === null) return;

    const index = searchValue(list, parsed);

    if (index === -1) {
      setHighlightedId(null);
      setMessage(`Value ${parsed} was not found.`);
    } else {
      setHighlightedId(list[index].id);
      setMessage(`Found ${parsed} at index ${index}.`);
    }

    setTraversal(null);
    setComplexity("O(n)");
  };

  const handleTraverse = () => {
    const values = list.map((node) => node.value);

    setTraversal(values);
    setHighlightedId(null);
    setMessage(
      values.length > 0
        ? `Traversed ${values.length} node(s).`
        : "The list is empty."
    );
    setComplexity("O(n)");
  };

  const handleClear = () => {
    setList([]);
    setHighlightedId(null);
    setTraversal(null);
    setMessage("The linked list has been cleared.");
    setComplexity("O(1)");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Linked List Visualizer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Insert, delete, search, and traverse a singly linked list.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
          <CardDescription>
            Enter a number and choose an operation.
            Positions use zero-based indexing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="node-value"
                className="text-sm font-medium"
              >
                Node value
              </label>
              <Input
                id="node-value"
                type="number"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Enter a value"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="node-position"
                className="text-sm font-medium"
              >
                Insertion index
              </label>
              <Input
                id="node-position"
                type="number"
                min="0"
                max={list.length}
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                placeholder="Enter an index"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleInsertHead}>
              Insert at Head
            </Button>
            <Button onClick={handleInsertTail} variant="secondary">
              Insert at Tail
            </Button>
            <Button onClick={handleInsertPosition} variant="secondary">
              Insert at Index
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete Value
            </Button>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
            <Button onClick={handleTraverse} variant="outline">
              Traverse
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear List
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Linked List</CardTitle>
              <CardDescription>
                Each node stores a value and points to the next node.
              </CardDescription>
            </div>

            <Badge variant="secondary">
              {list.length} {list.length === 1 ? "node" : "nodes"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="min-h-32 overflow-x-auto rounded-lg border bg-muted/20 p-6">
            {list.length === 0 ? (
              <div className="flex min-h-20 items-center justify-center text-sm text-muted-foreground">
                The list is empty. Insert a node to begin.
              </div>
            ) : (
              <div className="flex min-w-max items-center gap-3">
                {list.map((node, index) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`min-w-20 rounded-lg border-2 p-3 text-center transition-colors ${
                        highlightedId === node.id
                          ? "border-green-500 bg-green-100 text-green-950 dark:bg-green-950 dark:text-green-100"
                          : "border-primary/40 bg-background"
                      }`}
                    >
                      <div className="text-xs text-muted-foreground">
                        Node {index}
                      </div>
                      <div className="text-xl font-bold">
                        {node.value}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        next → {index === list.length - 1 ? "null" : "node"}
                      </div>
                    </div>

                    {index < list.length - 1 ? (
                      <span
                        className="text-2xl text-muted-foreground"
                        aria-label="points to"
                      >
                        →
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        → null
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Length
              </p>
              <p className="mt-1 text-2xl font-bold">{list.length}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Last operation complexity
              </p>
              <p className="mt-1 text-2xl font-bold">{complexity}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Head value
              </p>
              <p className="mt-1 text-2xl font-bold">
                {list.length > 0 ? list[0].value : "null"}
              </p>
            </div>
          </div>

          {traversal !== null && (
            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="font-semibold">Traversal result</h3>
              <p className="break-words font-mono text-sm">
                {traversal.length > 0
                  ? traversal.join(" → ") + " → null"
                  : "null"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Complexity Reference</CardTitle>
          <CardDescription>
            Complexity for a standard singly linked list.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Insert at head", "O(1)"],
              ["Insert at tail", "O(n)"],
              ["Insert at index", "O(n)"],
              ["Delete by value", "O(n)"],
              ["Search by value", "O(n)"],
              ["Traverse", "O(n)"],
            ].map(([operation, time]) => (
              <div
                key={operation}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <span className="text-sm">{operation}</span>
                <Badge variant="outline">{time}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}