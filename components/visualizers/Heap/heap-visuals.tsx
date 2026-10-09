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

  const handleInsert = () => {
    const parsed = readValue();
    if (parsed === null) return;

    setHeap((current) => insertHeap(current, parsed, nextId));
    setNextId((id) => id + 1);
    setHighlightedId(null);
    setTraversal(null);
    setMessage(`Inserted ${parsed} into the min-heap.`);
    setComplexity("O(log n)");
  };

  const handleDeleteMin = () => {
    if (heap.length === 0) {
      setMessage("Cannot delete from an empty heap.");
      setComplexity("O(log n)");
      return;
    }

    const minValue = heap[0].value;

    setHeap((current) => deleteMin(current));
    setHighlightedId(null);
    setTraversal(null);
    setMessage(`Deleted the minimum value: ${minValue}.`);
    setComplexity("O(log n)");
  };

  const handleSearch = () => {
    const parsed = readValue();
    if (parsed === null) return;

    const index = searchHeap(heap, parsed);

    if (index === -1) {
      setHighlightedId(null);
      setMessage(`Value ${parsed} was not found in the heap.`);
    } else {
      setHighlightedId(heap[index].id);
      setMessage(
        `Found ${parsed} at array index ${index}.`
      );
    }

    setTraversal(null);
    setComplexity("O(n)");
  };

  const handleGetMin = () => {
    if (heap.length === 0) {
      setMessage("The heap is empty. No minimum value exists.");
      setComplexity("O(1)");
      return;
    }

    setHighlightedId(heap[0].id);
    setTraversal(null);
    setMessage(`Minimum value: ${getMin(heap)}.`);
    setComplexity("O(1)");
  };

  const handleTraverse = () => {
    const values = heap.map((node) => node.value);

    setTraversal(values);
    setHighlightedId(null);
    setMessage(
      values.length > 0
        ? "Displayed the heap's level-order traversal."
        : "The heap is empty."
    );
    setComplexity("O(n)");
  };

  const handleClear = () => {
    setHeap([]);
    setHighlightedId(null);
    setTraversal(null);
    setMessage("The heap has been cleared.");
    setComplexity("O(1)");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Min-Heap Visualizer
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Insert values, remove the minimum, search, and explore
          the binary heap structure.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
          <CardDescription>
            Enter a number and choose an operation. The smallest
            value always stays at the root of the min-heap.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <label
              htmlFor="heap-value"
              className="text-sm font-medium"
            >
              Node value
            </label>

            <Input
              id="heap-value"
              type="number"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Enter a value"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleInsert}>
              Insert
            </Button>

            <Button
              onClick={handleDeleteMin}
              variant="destructive"
            >
              Delete Minimum
            </Button>

            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>

            <Button onClick={handleGetMin} variant="secondary">
              Get Minimum
            </Button>

            <Button onClick={handleTraverse} variant="outline">
              Level-Order Traversal
            </Button>

            <Button onClick={handleClear} variant="outline">
              Clear Heap
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Heap Tree</CardTitle>
              <CardDescription>
                Each parent is less than or equal to its children.
                Array indices determine the tree connections.
              </CardDescription>
            </div>

            <Badge variant="secondary">
              {heap.length} {heap.length === 1 ? "node" : "nodes"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="min-h-64 overflow-auto rounded-lg border bg-muted/20 p-6">
            {heap.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
                The heap is empty. Insert a value to begin.
              </div>
            ) : (
              <div className="flex min-w-max flex-col items-center gap-5">
                {Array.from({
                  length: Math.floor(Math.log2(heap.length)) + 1,
                }).map((_, level) => {
                  const startIndex = 2 ** level - 1;
                  const endIndex = Math.min(
                    2 ** (level + 1) - 1,
                    heap.length
                  );

                  return (
                    <div
                      key={level}
                      className="flex items-start justify-center gap-4 sm:gap-8"
                    >
                      {heap
                        .slice(startIndex, endIndex)
                        .map((node, offset) => {
                          const index = startIndex + offset;
                          const leftChildIndex = 2 * index + 1;
                          const rightChildIndex = 2 * index + 2;

                          return (
                            <div
                              key={node.id}
                              className="flex flex-col items-center gap-2"
                            >
                              <div
                                className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 transition-colors ${
                                  highlightedId === node.id
                                    ? "border-green-500 bg-green-100 text-green-950 dark:bg-green-950 dark:text-green-100"
                                    : index === 0
                                      ? "border-primary bg-primary/10"
                                      : "border-primary/40 bg-background"
                                }`}
                              >
                                <span className="text-xl font-bold">
                                  {node.value}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  [{index}]
                                </span>
                              </div>

                              <span className="text-xs text-muted-foreground">
                                {index === 0
                                  ? "Root"
                                  : `Node ${index}`}
                              </span>

                              {(leftChildIndex < heap.length ||
                                rightChildIndex < heap.length) && (
                                <span className="text-xs text-muted-foreground">
                                  {leftChildIndex < heap.length &&
                                  rightChildIndex < heap.length
                                    ? `Children: ${heap[leftChildIndex].value}, ${heap[rightChildIndex].value}`
                                    : leftChildIndex < heap.length
                                      ? `Left: ${heap[leftChildIndex].value}`
                                      : `Right: ${heap[rightChildIndex].value}`}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Heap Size
              </p>
              <p className="mt-1 text-2xl font-bold">
                {heap.length}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Minimum Value
              </p>
              <p className="mt-1 text-2xl font-bold">
                {heap.length > 0 ? heap[0].value : "—"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Last Operation Complexity
              </p>
              <p className="mt-1 text-2xl font-bold">
                {complexity}
              </p>
            </div>
          </div>

          {traversal !== null && (
            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="font-semibold">
                Level-Order Traversal
              </h3>
              <p className="break-words font-mono text-sm">
                {traversal.length > 0
                  ? traversal.join(" → ")
                  : "The heap is empty."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Heap Array Representation</CardTitle>
          <CardDescription>
            A binary heap is stored in an array. For index i,
            the left child is at 2i + 1 and the right child is at 2i + 2.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {heap.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No elements in the heap.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {heap.map((node, index) => (
                <div
                  key={node.id}
                  className={`min-w-16 rounded-md border p-3 text-center ${
                    highlightedId === node.id
                      ? "border-green-500 bg-green-100 text-green-950 dark:bg-green-950 dark:text-green-100"
                      : "bg-background"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">
                    Index {index}
                  </p>
                  <p className="text-lg font-bold">{node.value}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Complexity Reference</CardTitle>
          <CardDescription>
            Standard binary min-heap operations.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Insert", "O(log n)"],
              ["Delete minimum", "O(log n)"],
              ["Search by value", "O(n)"],
              ["Get minimum", "O(1)"],
              ["Level-order traversal", "O(n)"],
              ["Clear heap", "O(1)"],
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