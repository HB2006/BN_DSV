"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Undo2, Redo2, Gauge } from "lucide-react";
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

type HistoryEntry = {
  id: number;
  text: string;
  op: Operation;
  before: TreeNode | null;
  after: TreeNode | null;
  activeId: number | null;
  traversal: number[] | null;
  path?: number[] | null; // node ids in visit order (traversals only)
  line: number | null;
};

type HistoryMeta = Omit<HistoryEntry, "id" | "text">;

type Step = { line: number | null; run: () => void };

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
  "bg-[#D8A7B1] text-[#4D3039] hover:bg-[#C9919D] dark:bg-[#D8A7B1] dark:hover:bg-[#E2BAC2]";

const secondaryButton =
  "h-8 w-full justify-start border border-border bg-card px-2 text-xs text-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;
const MAX_HISTORY = 50;

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

    current =
      value < current.value ? current.left : current.right;
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

function collectIds(root: TreeNode | null, out: number[] = []): number[] {
  if (!root) return out;
  out.push(root.id);
  collectIds(root.left, out);
  collectIds(root.right, out);
  return out;
}

type TraversalOrder = "inorder" | "preorder" | "postorder" | "levelorder";

// Returns the nodes in the order they are visited.
function treeVisit(root: TreeNode | null, order: TraversalOrder): TreeNode[] {
  const result: TreeNode[] = [];

  if (!root) return result;

  if (order === "levelorder") {
    const queue: TreeNode[] = [root];

    while (queue.length) {
      const node = queue.shift()!;

      result.push(node);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    return result;
  }

  const visit = (node: TreeNode | null) => {
    if (!node) return;

    if (order === "preorder") {
      result.push(node);
    }

    visit(node.left);

    if (order === "inorder") {
      result.push(node);
    }

    visit(node.right);

    if (order === "postorder") {
      result.push(node);
    }
  };

  visit(root);

  return result;
}

// Pseudocode line (per traversal) that is highlighted when a node is visited.
const VISIT_LINE: Record<TraversalOrder, number> = {
  inorder: 3,
  preorder: 2,
  postorder: 4,
  levelorder: 3,
};

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
    const y = 60 + depth * 110;

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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [replayEntryId, setReplayEntryId] = useState<number | null>(null);
  const [traversal, setTraversal] = useState<number[] | null>(null);
  const [visitedIds, setVisitedIds] = useState<number[]>([]);
  const [randomCount, setRandomCount] = useState("7");
  const [minValue, setMinValue] = useState("1");
  const [maxValue, setMaxValue] = useState("100");
  const [zoom, setZoom] = useState(1);

  // Playback + undo/redo state
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1");
  const [undoStack, setUndoStack] = useState<(TreeNode | null)[]>([]);
  const [redoStack, setRedoStack] = useState<(TreeNode | null)[]>([]);

  // Latest-value refs so timer callbacks never see stale state
  const rootRef = useRef(root);
  rootRef.current = root;
  const nextIdRef = useRef(nextId);
  nextIdRef.current = nextId;
  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;

  // Replay machinery
  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const traverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<Step[] | null>(null);
  const frameIndexRef = useRef(0);
  const replayOriginalRef = useRef<{ tree: TreeNode | null } | null>(null);
  const historyIdRef = useRef(1);

  // New-node animation tracking
  const [newIds, setNewIds] = useState<number[]>([]);
  const prevIdsRef = useRef<Set<number> | null>(null);

  const selectedCode = pseudocode[operation];
  const stats = useMemo(() => getStats(root), [root]);
  const positioned = useMemo(() => layoutTree(root), [root]);

  // The canvas uses fixed logical dimensions. Zoom scales only the tree drawing.
  const treeCanvasWidth = 1000;
  const treeCanvasHeight = Math.max(300, stats.height * 110 + 60);

  // Detect any node that appeared (insert, redo, undo of delete, generate, replay)
  useEffect(() => {
    const ids = collectIds(root);
    const prev = prevIdsRef.current;
    prevIdsRef.current = new Set(ids);

    if (prev === null) return;

    const added = ids.filter((id) => !prev.has(id));
    if (added.length === 0) {
      setNewIds([]);
      return;
    }
    setNewIds(added);
    const t = setTimeout(() => setNewIds([]), 1600);
    return () => clearTimeout(t);
  }, [root]);

  // Clear playback timer on unmount
  useEffect(() => {
    return () => {
      if (playbackTimer.current !== null) {
        clearTimeout(playbackTimer.current);
      }
      if (traverseTimer.current !== null) {
        clearTimeout(traverseTimer.current);
      }
    };
  }, []);

  function stopTraversalAnim() {
    if (traverseTimer.current !== null) {
      clearTimeout(traverseTimer.current);
      traverseTimer.current = null;
    }
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

  // Trees are never mutated after being stored: every operation works on a clone.
  function updateRoot(nextRoot: TreeNode | null) {
    const current = rootRef.current;
    setUndoStack((old) => [...old, current]);
    setRedoStack([]);
    rootRef.current = nextRoot;
    setRoot(nextRoot);
    setActiveNode(null);
    setTraversal(null);
    setVisitedIds([]);
  }

  /* ---------- HISTORY REPLAY ---------- */

  // Stops any replay / traversal animation and puts the real tree back
  function abortReplay() {
    stopTraversalAnim();
    setVisitedIds([]);
    if (playbackTimer.current !== null) {
      clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
    setIsPlaying(false);
    if (replayOriginalRef.current) {
      const original = replayOriginalRef.current.tree;
      replayOriginalRef.current = null;
      rootRef.current = original;
      setRoot(original);
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

    stopTraversalAnim();
    setVisitedIds([]);
    const entries = history.slice().reverse(); // oldest first
    const original = rootRef.current;
    replayOriginalRef.current = { tree: original };

    const frames: Step[] = [];

    // 1. Rewind to the state before the first recorded operation
    frames.push({
      line: null,
      run: () => {
        const start = entries[0].before;
        rootRef.current = start;
        setRoot(start);
        setActiveNode(null);
        setTraversal(null);
        setVisitedIds([]);
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
          setVisitedIds([]);
          setActiveNode(entry.op === "delete" ? entry.activeId : null);
          setMessage(`Replaying: ${title}`);
        },
      });
      frames.push({
        line: entry.line,
        run: () => {
          rootRef.current = entry.after;
          setRoot(entry.after);
          setActiveNode(entry.op === "delete" ? null : entry.activeId);
          setTraversal(entry.traversal);
          setVisitedIds(entry.path ?? []);
          setMessage(entry.text);
        },
      });
    });

    // 3. Put the real tree back (matters if you used Undo/Redo earlier)
    frames.push({
      line: null,
      run: () => {
        rootRef.current = original;
        setRoot(original);
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
    const current = rootRef.current;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((old) => [...old, current]);
    setUndoStack((old) => old.slice(0, -1));
    rootRef.current = previous;
    setRoot(previous);
    setTraversal(null);
    setMessage("Undo successful.");
  }

  function handleRedo() {
    abortReplay();
    if (redoStack.length === 0) return;
    const current = rootRef.current;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((old) => [...old, current]);
    setRedoStack((old) => old.slice(0, -1));
    rootRef.current = next;
    setRoot(next);
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

  function insert() {
    const n = readNumber();

    if (n === null) return;

    abortReplay();
    const before = rootRef.current;
    const existing = findNode(before, n);

    if (existing) {
      setOperation("insert");
      setActiveNode(existing.id);
      setActiveLine(6);
      setTraversal(null);
      setMessage(
        `${n} already exists. Duplicate values are not inserted.`
      );
      return;
    }

    const id = nextIdRef.current;
    const after = insertNode(cloneTree(before), n, id);

    setOperation("insert");
    setActiveLine(1);
    updateRoot(after);
    setActiveNode(id);
    nextIdRef.current = id + 1;
    setNextId(id + 1);

    record(`Inserted ${n} into the binary search tree.`, {
      op: "insert",
      before,
      after,
      activeId: id,
      traversal: null,
      line: 1,
    });
  }

  function remove() {
    const n = readNumber();

    if (n === null) return;

    abortReplay();
    const before = rootRef.current;
    const found = findNode(before, n);

    setOperation("delete");
    setTraversal(null);
    setActiveLine(found ? 4 : 1);

    if (!found) {
      setActiveNode(null);
      setMessage(`Value ${n} was not found.`);
      return;
    }

    const after = deleteNode(cloneTree(before), n);

    updateRoot(after);

    record(`Deleted ${n} from the binary search tree.`, {
      op: "delete",
      before,
      after,
      activeId: found.id,
      traversal: null,
      line: 4,
    });
  }

  function search() {
    const n = readNumber();

    if (n === null) return;

    abortReplay();
    const before = rootRef.current;
    const found = findNode(before, n);
    const line = found ? 2 : 1;

    setOperation("search");
    setActiveLine(line);
    setActiveNode(found?.id ?? null);
    setTraversal(null);

    record(
      found
        ? `Found ${n} in the binary search tree.`
        : `Value ${n} was not found.`,
      {
        op: "search",
        before,
        after: before,
        activeId: found?.id ?? null,
        traversal: null,
        line,
      }
    );
  }

  function traverse(order: TraversalOrder) {
    abortReplay();
    const before = rootRef.current;

    setOperation(order);
    setActiveLine(null);
    setActiveNode(null);

    const visitNodes = treeVisit(before, order);
    const values = visitNodes.map((node) => node.value);
    const ids = visitNodes.map((node) => node.id);
    const visitLine = VISIT_LINE[order];

    const labels = {
      inorder: "Inorder",
      preorder: "Preorder",
      postorder: "Postorder",
      levelorder: "Level-order",
    };

    const finalText = values.length
      ? `${labels[order]} traversal completed (${values.length} nodes).`
      : "The tree is empty.";

    // Recorded up front so it appears in History; replay shows the full path.
    record(finalText, {
      op: order,
      before,
      after: before,
      activeId: null,
      traversal: values,
      path: ids,
      line: values.length ? visitLine : null,
    });

    if (values.length === 0) {
      setTraversal([]);
      return;
    }

    // Walk the tree one node at a time, lighting up the path as it goes.
    setTraversal([]);
    let step = 0;

    const tick = () => {
      setActiveLine(visitLine);
      setActiveNode(ids[step]);
      setVisitedIds(ids.slice(0, step + 1));
      setTraversal(values.slice(0, step + 1));
      setMessage(
        `${labels[order]}: visiting ${values[step]} (${step + 1} of ${values.length})`
      );
      step++;

      if (step < ids.length) {
        traverseTimer.current = setTimeout(
          tick,
          800 / Number(speedRef.current)
        );
      } else {
        traverseTimer.current = setTimeout(() => {
          traverseTimer.current = null;
          setActiveNode(null);
          setActiveLine(null);
          setMessage(finalText);
        }, 800 / Number(speedRef.current));
      }
    };

    tick();
  }

  function clearTree() {
    abortReplay();
    const before = rootRef.current;

    setOperation("clear");
    setActiveLine(0);
    updateRoot(null);

    record("Cleared the binary tree.", {
      op: "clear",
      before,
      after: null,
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

    abortReplay();
    const before = rootRef.current;
    let generated: TreeNode | null = null;
    const used = new Set<number>();
    let id = nextIdRef.current;

    while (used.size < count) {
      const n =
        Math.floor(Math.random() * (max - min + 1)) + min;

      if (used.has(n)) continue;

      used.add(n);
      generated = insertNode(generated, n, id++);
    }

    updateRoot(generated);
    nextIdRef.current = id;
    setNextId(id);
    setOperation("levelorder");
    setActiveLine(null);

    record(
      `Generated a binary search tree with ${count} random nodes.`,
      {
        op: "levelorder",
        before,
        after: generated,
        activeId: null,
        traversal: null,
        line: null,
      }
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <style>{`
        @keyframes node-fade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
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

      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Binary Tree Visualizer
          </h1>

          <p className="text-xs text-muted-foreground sm:text-sm">
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

      <div className="grid grid-cols-1 items-start gap-3 px-4 pb-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-3 lg:max-h-[calc(100vh-1.5rem)] lg:overflow-y-auto lg:pr-1">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border px-3 py-2">
              <CardTitle className="text-sm">Operations</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 px-3 py-3">
              <div className="space-y-1">
                <label htmlFor="tree-value" className="text-xs font-medium">
                  Node value
                </label>

                <Input
                  id="tree-value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Value"
                  className="h-8 bg-background px-2 text-xs"
                />
              </div>

              <div className="space-y-1 pt-1">
                <Button onClick={insert} className={secondaryButton} variant="outline">
                  Insert
                </Button>

                <Button onClick={remove} className={secondaryButton} variant="outline">
                  Delete
                </Button>

                <Button onClick={search} className={secondaryButton} variant="outline">
                  Search
                </Button>

                <Button onClick={() => traverse("inorder")} className={secondaryButton} variant="outline">
                  Inorder Traversal
                </Button>

                <Button onClick={() => traverse("preorder")} className={secondaryButton} variant="outline">
                  Preorder Traversal
                </Button>

                <Button onClick={() => traverse("postorder")} className={secondaryButton} variant="outline">
                  Postorder Traversal
                </Button>

                <Button onClick={() => traverse("levelorder")} className={secondaryButton} variant="outline">
                  Level-Order Traversal
                </Button>

                <Button
                  onClick={clearTree}
                  className="h-8 w-full justify-start border-red-200 bg-red-50 px-2 text-xs text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
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
                <label htmlFor="tree-count" className="text-[11px] font-medium text-muted-foreground">
                  Number of nodes (1–20)
                </label>

                <Input
                  id="tree-count"
                  type="number"
                  min="1"
                  max="20"
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  className="h-8 px-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 space-y-1">
                  <label htmlFor="tree-min" className="text-[11px] font-medium text-muted-foreground">
                    Minimum
                  </label>

                  <Input
                    id="tree-min"
                    type="number"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="h-8 px-2 text-xs"
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <label htmlFor="tree-max" className="text-[11px] font-medium text-muted-foreground">
                    Maximum
                  </label>

                  <Input
                    id="tree-max"
                    type="number"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="h-8 px-2 text-xs"
                  />
                </div>
              </div>

              <Button
                onClick={generateRandom}
                className={`h-8 w-full text-xs ${primaryButton}`}
              >
                Generate Tree
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
          {/* Visualization card: height is determined by its content. */}
          <Card className="min-w-0 overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg">
                  Visualization Playground
                </CardTitle>

                <CardDescription className="text-xs sm:text-sm">
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
                  className="h-8 w-8 p-0 text-base"
                >
                  −
                </Button>

                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Reset zoom"
                  className="h-8 min-w-[3.5rem] rounded-md border border-border bg-muted/40 px-2 text-xs font-medium hover:bg-muted"
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
                  className="h-8 w-8 p-0 text-base"
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

              {/* These statistics are outside the zoomed canvas. */}
              <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-muted/40 py-3 text-center">
                <div className="min-w-0 px-2">
                  <p className="text-xs text-muted-foreground">Root</p>
                  <p className="break-words text-xl font-bold">
                    {root ? root.value : "—"}
                  </p>
                </div>

                <div className="min-w-0 px-2">
                  <p className="text-xs text-muted-foreground">Nodes</p>
                  <p className="text-xl font-bold">{stats.count}</p>
                </div>

                <div className="min-w-0 px-2">
                  <p className="text-xs text-muted-foreground">Height</p>
                  <p className="text-xl font-bold">{stats.height || "—"}</p>
                </div>
              </div>

              {/* Fixed-height viewport; only its tree canvas is zoomed. */}
              <div className="h-[350px] overflow-auto rounded-xl border border-border bg-muted/20 p-3 sm:h-[420px] sm:p-4">
                {!root ? (
                  <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-3xl text-red-600 dark:bg-red-950/50">
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
                  <div
                    className="relative mx-auto shrink-0"
                    style={{
                      width: `${treeCanvasWidth * zoom}px`,
                      height: `${treeCanvasHeight * zoom}px`,
                    }}
                  >
                    {/* Zoom affects this SVG and the nodes together, not the cards. */}
                    <div
                      className="absolute left-0 top-0 origin-top-left"
                      style={{
                        width: `${treeCanvasWidth}px`,
                        height: `${treeCanvasHeight}px`,
                        transform: `scale(${zoom})`,
                      }}
                    >
                      <svg
                        className="absolute inset-0 h-full w-full overflow-visible"
                        viewBox={`0 0 1000 ${treeCanvasHeight}`}
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        {positioned
                          .filter((item) => item.parentX !== undefined)
                          .map((item) => (
                            <line
                              key={`edge-${item.node.id}`}
                              x1={item.parentX}
                              y1={item.parentY! + 28}
                              x2={item.x}
                              y2={item.y - 28}
                              stroke={
                                visitedIds.includes(item.node.id)
                                  ? "#dc2626"
                                  : "currentColor"
                              }
                              strokeOpacity={
                                visitedIds.includes(item.node.id) ? 1 : 0.4
                              }
                              strokeWidth={
                                visitedIds.includes(item.node.id) ? 4 : 2.2
                              }
                              style={{ transition: "stroke 300ms, stroke-width 300ms" }}
                            />
                          ))}
                      </svg>

                      {positioned.map(({ node, x, y }) => {
                        const isNew = newIds.includes(node.id);
                        const visitIndex = visitedIds.indexOf(node.id);
                        const isVisited = visitIndex !== -1;

                        return (
                          <div
                            key={node.id}
                            className={`anim-new absolute z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 transition-colors duration-300 sm:h-16 sm:w-16 ${
                              activeNode === node.id
                                ? "border-red-500 bg-red-50 text-red-950 shadow-lg shadow-red-500/20 dark:bg-red-950/50 dark:text-red-100"
                                : isVisited
                                  ? "border-red-400 bg-red-100 text-red-900 shadow-md dark:bg-red-950/60 dark:text-red-100"
                                  : node.id === root?.id
                                  ? "border-red-500 bg-red-50 text-red-950 shadow-md dark:bg-red-950/40 dark:text-red-100"
                                  : "border-border bg-card shadow-sm"
                            }`}
                            style={{
                              left: `${x}px`,
                              top: `${y}px`,
                              ...(isNew
                                ? {
                                    animation:
                                      "node-fade 500ms ease-out both, node-glow 1200ms ease-out 400ms",
                                  }
                                : {}),
                            }}
                          >
                            <span className="text-lg font-bold leading-none sm:text-xl">
                              {node.value}
                            </span>

                            {activeNode === node.id && (
                              <span className="absolute -top-4 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                ACTIVE
                              </span>
                            )}

                            {isVisited && (
                              <span className="absolute -bottom-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
                                {visitIndex + 1}
                              </span>
                            )}

                            {isNew && (
                              <span
                                className="absolute -right-3 -top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-semibold text-white"
                                style={{
                                  animation: "badge-pop 400ms ease-out both",
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Traversal output remains at its normal size. */}
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Traversal Output</p>

                  <Badge variant="outline" className="text-xs">
                    {traversal?.length ?? 0} values
                  </Badge>
                </div>

                <p className="break-words font-mono text-sm text-muted-foreground">
                  {traversal !== null
                    ? traversal.length
                      ? traversal.join(" → ")
                      : "Empty"
                    : "Choose a traversal operation to see its output."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pseudocode and complexity are separate, normal-sized cards. */}
          <div className="grid min-w-0 grid-cols-1 items-start gap-3 md:grid-cols-2">
            <Card className="min-w-0 border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">Pseudocode</CardTitle>

                  <Badge
                    variant="outline"
                    className="border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                  >
                    {selectedCode.title}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="min-w-0 space-y-4 p-4">
                <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 shadow-inner sm:text-sm">
                  <div className="min-w-max space-y-1 font-mono">
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

                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-red-700 dark:text-red-300">
                    How it works
                  </h3>

                  <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                    {selectedCode.explanation.map((step, index) => (
                      <li key={`${operation}-step-${index}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border px-4 py-3">
                <CardTitle className="text-base">Time Complexity</CardTitle>

                <CardDescription className="text-xs sm:text-sm">
                  Complexity depends on the height of the tree.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {selectedCode.title}
                    </p>

                    <p className="mt-1 text-3xl font-bold text-red-700 dark:text-red-400">
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
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted/60">
                        <th className="border-b border-border p-3">
                          Operation
                        </th>
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
                                row.time === "O(h)"
                                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
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

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Here, <strong>h</strong> is the tree height and{" "}
                  <strong>n</strong> is the number of nodes. A balanced BST has
                  height O(log n); a skewed BST can have height O(n).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}