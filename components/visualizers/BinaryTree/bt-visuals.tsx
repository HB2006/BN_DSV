"use client";

import { useMemo, useState } from "react";
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

type TreeNode = {
  id: number;
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
};

type Operation =
  | "insert"
  | "delete"
  | "search"
  | "inorder"
  | "preorder"
  | "postorder"
  | "levelorder"
  | "clear";

type CodeInfo = {
  title: string;
  lines: string[];
  explanation: string[];
  complexity: string;
};

const pseudocode: Record<Operation, CodeInfo> = {
  insert: {
    title: "Insert into Binary Search Tree",
    lines: [
      "insert(node, value):",
      "  if node is null: return new node(value)",
      "  if value < node.value:",
      "    node.left = insert(node.left, value)",
      "  else if value > node.value:",
      "    node.right = insert(node.right, value)",
      "  else: return node  // duplicate",
      "  return node",
    ],
    explanation: [
      "Start at the root of the tree.",
      "If the value is smaller, continue into the left subtree.",
      "If the value is larger, continue into the right subtree.",
      "Insert when an empty position is reached. Duplicate values are ignored.",
    ],
    complexity: "O(h)",
  },

  delete: {
    title: "Delete from Binary Search Tree",
    lines: [
      "delete(node, value):",
      "  if node is null: return null",
      "  if value < node.value: go left",
      "  else if value > node.value: go right",
      "  else if one child is missing: return other child",
      "  else:",
      "    replace value with inorder successor",
      "    delete successor from right subtree",
      "  return node",
    ],
    explanation: [
      "Find the node by comparing the target with each visited node.",
      "A leaf can be removed directly.",
      "If one child exists, connect the parent to that child.",
      "If both children exist, replace the value with its inorder successor, then remove the successor.",
    ],
    complexity: "O(h)",
  },

  search: {
    title: "Search Binary Search Tree",
    lines: [
      "search(node, target):",
      "  if node is null: return not found",
      "  if node.value == target: return node",
      "  if target < node.value:",
      "    return search(node.left, target)",
      "  else:",
      "    return search(node.right, target)",
    ],
    explanation: [
      "Begin at the root.",
      "If the current value matches the target, the search succeeds.",
      "A smaller target must be in the left subtree; a larger target must be in the right subtree.",
      "If an empty position is reached, the value is not present.",
    ],
    complexity: "O(h)",
  },

  inorder: {
    title: "Inorder Traversal",
    lines: [
      "inorder(node):",
      "  if node is null: return",
      "  inorder(node.left)",
      "  visit(node)",
      "  inorder(node.right)",
    ],
    explanation: [
      "Visit the left subtree first.",
      "Visit the current node.",
      "Visit the right subtree last.",
      "For a BST, inorder traversal returns values in sorted order.",
    ],
    complexity: "O(n)",
  },

  preorder: {
    title: "Preorder Traversal",
    lines: [
      "preorder(node):",
      "  if node is null: return",
      "  visit(node)",
      "  preorder(node.left)",
      "  preorder(node.right)",
    ],
    explanation: [
      "Visit the current node first.",
      "Traverse the left subtree.",
      "Traverse the right subtree.",
      "This traversal visits the parent before its descendants.",
    ],
    complexity: "O(n)",
  },

  postorder: {
    title: "Postorder Traversal",
    lines: [
      "postorder(node):",
      "  if node is null: return",
      "  postorder(node.left)",
      "  postorder(node.right)",
      "  visit(node)",
    ],
    explanation: [
      "Traverse the left subtree.",
      "Traverse the right subtree.",
      "Visit the current node last.",
      "This traversal visits children before their parent.",
    ],
    complexity: "O(n)",
  },

  levelorder: {
    title: "Level-Order Traversal",
    lines: [
      "queue = [root]",
      "while queue is not empty:",
      "  node = queue.remove_front()",
      "  visit(node)",
      "  if node.left exists: queue.append(node.left)",
      "  if node.right exists: queue.append(node.right)",
    ],
    explanation: [
      "Put the root into a queue.",
      "Remove and visit the first node in the queue.",
      "Add its left child, then its right child, if they exist.",
      "Repeat until the queue is empty.",
    ],
    complexity: "O(n)",
  },

  clear: {
    title: "Clear Binary Tree",
    lines: ["root = null", "return"],
    explanation: [
      "Set the root reference to null.",
      "The tree becomes empty.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows = [
  {
    operation: "Insert",
    time: "O(h)",
    why: "Follows one root-to-leaf path.",
  },
  {
    operation: "Delete",
    time: "O(h)",
    why: "Finds and updates a node along a path.",
  },
  {
    operation: "Search",
    time: "O(h)",
    why: "Follows left/right comparisons.",
  },
  {
    operation: "Inorder / Preorder / Postorder",
    time: "O(n)",
    why: "Visits every node once.",
  },
  {
    operation: "Level-Order",
    time: "O(n)",
    why: "Visits every node using a queue.",
  },
];

const primaryButton =
  "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500";

const secondaryButton =
  "h-7 w-full justify-start border border-border bg-card px-2 text-xs text-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;

function makeNode(value: number, id: number): TreeNode {
  return { id, value, left: null, right: null };
}

function insertNode(
  root: TreeNode | null,
  value: number,
  id: number
): TreeNode {
  if (!root) return makeNode(value, id);

  if (value < root.value) {
    root.left = insertNode(root.left, value, id);
  } else if (value > root.value) {
    root.right = insertNode(root.right, value, id);
  }

  return root;
}

function findNode(
  root: TreeNode | null,
  value: number
): TreeNode | null {
  let current = root;

  while (current) {
    if (value === current.value) return current;

    current = value < current.value
      ? current.left
      : current.right;
  }

  return null;
}

function minNode(root: TreeNode): TreeNode {
  let current = root;

  while (current.left) {
    current = current.left;
  }

  return current;
}

function deleteNode(
  root: TreeNode | null,
  value: number
): TreeNode | null {
  if (!root) return null;

  if (value < root.value) {
    root.left = deleteNode(root.left, value);
  } else if (value > root.value) {
    root.right = deleteNode(root.right, value);
  } else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;

    const successor = minNode(root.right);

    root.value = successor.value;
    root.right = deleteNode(root.right, successor.value);
  }

  return root;
}

function cloneTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null;

  return {
    ...root,
    left: cloneTree(root.left),
    right: cloneTree(root.right),
  };
}

function treeValues(
  root: TreeNode | null,
  order: "inorder" | "preorder" | "postorder" | "levelorder"
): number[] {
  const result: number[] = [];

  if (!root) return result;

  if (order === "levelorder") {
    const queue: TreeNode[] = [root];

    while (queue.length) {
      const node = queue.shift()!;

      result.push(node.value);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    return result;
  }

  const visit = (node: TreeNode | null) => {
    if (!node) return;

    if (order === "preorder") {
      result.push(node.value);
    }

    visit(node.left);

    if (order === "inorder") {
      result.push(node.value);
    }

    visit(node.right);

    if (order === "postorder") {
      result.push(node.value);
    }
  };

  visit(root);

  return result;
}

function getStats(
  root: TreeNode | null
): { count: number; height: number } {
  if (!root) return { count: 0, height: 0 };

  const left = getStats(root.left);
  const right = getStats(root.right);

  return {
    count: 1 + left.count + right.count,
    height: 1 + Math.max(left.height, right.height),
  };
}

type PositionedNode = {
  node: TreeNode;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
};

function layoutTree(root: TreeNode | null): PositionedNode[] {
  const items: PositionedNode[] = [];

  const walk = (
    node: TreeNode | null,
    depth: number,
    left: number,
    right: number,
    parent?: { x: number; y: number }
  ) => {
    if (!node) return;

    const x = (left + right) / 2;
    const y = 44 + depth * 90;

    items.push({
      node,
      x,
      y,
      parentX: parent?.x,
      parentY: parent?.y,
    });

    walk(node.left, depth + 1, left, x, { x, y });
    walk(node.right, depth + 1, x, right, { x, y });
  };

  walk(root, 0, 24, 976);

  return items;
}

export function BinaryTreeVisualizer() {
  const [root, setRoot] = useState<TreeNode | null>(() => {
    let tree: TreeNode | null = null;

    [50, 30, 70, 20, 40, 60, 80].forEach((value, index) => {
      tree = insertNode(tree, value, index + 1);
    });

    return tree;
  });

  const [value, setValue] = useState("25");
  const [nextId, setNextId] = useState(8);
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
  const stats = useMemo(() => getStats(root), [root]);
  const positioned = useMemo(() => layoutTree(root), [root]);

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

    const existing = findNode(root, n);

    if (existing) {
      setOperation("insert");
      setActiveNode(existing.id);
      setActiveLine(6);
      setMessage(
        `${n} already exists. Duplicate values are not inserted.`
      );
      return;
    }

    const updated = cloneTree(root);

    setRoot(insertNode(updated, n, nextId));
    setActiveNode(nextId);
    setNextId((old) => old + 1);
    setOperation("insert");
    setActiveLine(1);

    record(`Inserted ${n} into the binary search tree.`);
  }

  function remove() {
    const n = readNumber();

    if (n === null) return;

    const found = findNode(root, n);

    setOperation("delete");
    setActiveLine(found ? 4 : 1);

    if (!found) {
      setActiveNode(null);
      setMessage(`Value ${n} was not found.`);
      return;
    }

    const updated = cloneTree(root);

    setRoot(deleteNode(updated, n));
    setActiveNode(null);

    record(`Deleted ${n} from the binary search tree.`);
  }

  function search() {
    const n = readNumber();

    if (n === null) return;

    const found = findNode(root, n);

    setOperation("search");
    setActiveLine(found ? 2 : 1);
    setActiveNode(found?.id ?? null);
    setTraversal(null);

    setMessage(
      found
        ? `Found ${n} in the binary search tree.`
        : `Value ${n} was not found.`
    );
  }

  function traverse(
    order: "inorder" | "preorder" | "postorder" | "levelorder"
  ) {
    setOperation(order);
    setActiveLine(null);
    setActiveNode(null);

    const values = treeValues(root, order);

    setTraversal(values);

    const labels = {
      inorder: "Inorder",
      preorder: "Preorder",
      postorder: "Postorder",
      levelorder: "Level-order",
    };

    setMessage(
      values.length
        ? `${labels[order]} traversal completed (${values.length} nodes).`
        : "The tree is empty."
    );
  }

  function clearTree() {
    setOperation("clear");
    setActiveLine(0);
    setRoot(null);
    setActiveNode(null);
    setTraversal(null);

    record("Cleared the binary tree.");
  }

  function generateRandom() {
    const count = Number(randomCount);
    const min = Number(minValue);
    const max = Number(maxValue);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 20 ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min > max ||
      max - min + 1 < count
    ) {
      setMessage(
        "Use 1–20 nodes, valid integer limits, and a range large enough for unique values."
      );
      return;
    }

    let generated: TreeNode | null = null;
    const used = new Set<number>();
    let id = nextId;

    while (used.size < count) {
      const n =
        Math.floor(Math.random() * (max - min + 1)) + min;

      if (used.has(n)) continue;

      used.add(n);
      generated = insertNode(generated, n, id++);
    }

    setRoot(generated);
    setNextId(id);
    setOperation("levelorder");
    setActiveLine(null);
    setActiveNode(null);
    setTraversal(null);

    record(
      `Generated a binary search tree with ${count} random nodes.`
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Binary Tree Visualizer
          </h1>

          <p className="text-xs text-muted-foreground">
            Explore BST operations, traversals, pseudocode, and complexity.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          Binary Search Tree (BST)
        </Badge>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-4 pb-4 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="min-h-0 min-w-0 space-y-3 lg:overflow-y-auto lg:pr-1">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border px-3 py-2">
              <CardTitle className="text-sm">Operations</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-3 py-3">
              <div className="space-y-1">
                <label
                  htmlFor="tree-value"
                  className="text-xs font-medium"
                >
                  Node value
                </label>

                <Input
                  id="tree-value"
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
                  onClick={remove}
                  className={secondaryButton}
                  variant="outline"
                >
                  Delete
                </Button>

                <Button
                  onClick={search}
                  className={secondaryButton}
                  variant="outline"
                >
                  Search
                </Button>

                <Button
                  onClick={() => traverse("inorder")}
                  className={secondaryButton}
                  variant="outline"
                >
                  Inorder Traversal
                </Button>

                <Button
                  onClick={() => traverse("preorder")}
                  className={secondaryButton}
                  variant="outline"
                >
                  Preorder Traversal
                </Button>

                <Button
                  onClick={() => traverse("postorder")}
                  className={secondaryButton}
                  variant="outline"
                >
                  Postorder Traversal
                </Button>

                <Button
                  onClick={() => traverse("levelorder")}
                  className={secondaryButton}
                  variant="outline"
                >
                  Level-Order Traversal
                </Button>

                <Button
                  onClick={clearTree}
                  className="h-7 w-full justify-start border-red-200 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  variant="outline"
                >
                  Clear Tree
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
                  htmlFor="tree-count"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  Number of nodes (1–20)
                </label>

                <Input
                  id="tree-count"
                  type="number"
                  min="1"
                  max="20"
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  className="h-7 px-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor="tree-min"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Minimum
                  </label>

                  <Input
                    id="tree-min"
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="h-7 px-2 text-xs"
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <label
                    htmlFor="tree-max"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Maximum
                  </label>

                  <Input
                    id="tree-max"
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
                Generate Tree
              </Button>
            </CardContent>
          </Card>

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

          <Alert className="border-red-200 bg-red-50 px-3 py-2 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            <AlertDescription className="text-[11px] leading-snug">
              <span className="font-semibold text-red-700 dark:text-red-300">
                Status:{" "}
              </span>
              {message}
            </AlertDescription>
          </Alert>
        </aside>

        <div className="grid min-h-0 min-w-0 grid-rows-[minmax(380px,1fr)_minmax(380px,1fr)] gap-3 lg:grid-rows-2">
          <Card className="flex min-h-0 min-w-0 flex-col border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-2.5">
              <div className="min-w-0">
                <CardTitle className="text-base">
                  Visualization Playground
                </CardTitle>

                <CardDescription className="text-xs">
                  Explore the tree structure and traversal output.
                </CardDescription>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setZoom((z) =>
                      Math.max(
                        MIN_ZOOM,
                        Math.round((z - ZOOM_STEP) * 10) / 10
                      )
                    )
                  }
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
                  onClick={() =>
                    setZoom((z) =>
                      Math.min(
                        MAX_ZOOM,
                        Math.round((z + ZOOM_STEP) * 10) / 10
                      )
                    )
                  }
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                  className="h-7 w-7 p-0 text-base"
                >
                  +
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3">
              <div className="grid shrink-0 grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/40 py-2 text-center">
                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Root</p>
                  <p className="break-words text-base font-bold">
                    {root ? root.value : "—"}
                  </p>
                </div>

                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Nodes</p>
                  <p className="text-base font-bold">{stats.count}</p>
                </div>

                <div className="min-w-0 px-1">
                  <p className="text-[11px] text-muted-foreground">Height</p>
                  <p className="text-base font-bold">
                    {stats.height || "—"}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-muted/20 p-3">
                {!root ? (
                  <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600 dark:bg-red-950/50">
                      ∅
                    </div>

                    <p className="text-lg font-semibold">
                      Your tree is empty
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Insert a value or generate a random tree to begin.
                    </p>
                  </div>
                ) : (
                  <div className="flex min-h-full min-w-full items-center justify-center">
                    <div
                      className="relative min-w-[700px]"
                      style={{
                        width: `${Math.max(700, 1000 * zoom)}px`,
                        height: `${Math.max(230, stats.height * 90 + 40)}px`,
                        zoom,
                      }}
                    >
                      <svg
                        className="absolute inset-0 h-full w-full overflow-visible"
                        viewBox={`0 0 1000 ${Math.max(230, stats.height * 90 + 40)}`}
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        {positioned
                          .filter((item) => item.parentX !== undefined)
                          .map((item) => (
                            <line
                              key={`edge-${item.node.id}`}
                              x1={item.parentX}
                              y1={item.parentY! + 23}
                              x2={item.x}
                              y2={item.y - 23}
                              stroke="currentColor"
                              strokeOpacity="0.35"
                              strokeWidth="1.8"
                            />
                          ))}
                      </svg>

                      {positioned.map(({ node, x, y }) => (
                        <div
                          key={node.id}
                          className={`absolute z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            activeNode === node.id
                              ? "scale-110 border-red-500 bg-red-50 text-red-950 shadow-lg shadow-red-500/10 dark:bg-red-950/50 dark:text-red-100"
                              : node.id === root?.id
                                ? "border-red-500 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100"
                                : "border-border bg-card"
                          }`}
                          style={{
                            left: `${x / 10}%`,
                            top: y,
                          }}
                        >
                          <span className="text-base font-bold leading-none">
                            {node.value}
                          </span>

                          {activeNode === node.id && (
                            <span className="absolute -top-3 rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-semibold text-white">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 rounded-lg border border-border bg-card px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">Traversal Output</p>

                  <Badge variant="outline" className="text-[11px]">
                    {traversal?.length ?? 0} values
                  </Badge>
                </div>

                <p className="break-words font-mono text-xs text-muted-foreground">
                  {traversal !== null
                    ? traversal.length
                      ? traversal.join(" → ")
                      : "Empty"
                    : "Choose a traversal operation to see its output."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid min-h-0 min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
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

            <Card className="flex min-h-0 min-w-0 flex-col border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-2.5">
                <CardTitle className="text-base">Time Complexity</CardTitle>

                <CardDescription className="text-xs">
                  Complexity depends on the height of the tree.
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
                      ? "Constant time."
                      : selectedCode.complexity === "O(h)"
                        ? "Proportional to tree height h."
                        : "Visits each node once."}
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
                                row.time === "O(h)"
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
                  Here, <strong>h</strong> is the tree height and <strong>n</strong>{" "}
                  is the number of nodes. A balanced BST has height O(log n); a
                  skewed BST can have height O(n).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}