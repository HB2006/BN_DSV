"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
  path?: number[] | null;
  value?: number; // value searched / inserted / deleted (used to replay the path)
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
  insert: {
    title: "Insert",
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
    title: "Delete",
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
    title: "Search",
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
    title: "Clear Tree",
    lines: ["root = null", "return"],
    explanation: [
      "Set the root reference to null.",
      "The tree becomes empty.",
    ],
    complexity: "O(1)",
  },
};

const complexityRows: {
  operation: string;
  keys: Operation[];
  time: string;
  why: string;
}[] = [
  {
    operation: "Insert",
    keys: ["insert"],
    time: "O(h)",
    why: "Follows one root-to-leaf path.",
  },
  {
    operation: "Delete",
    keys: ["delete"],
    time: "O(h)",
    why: "Finds and updates a node along a path.",
  },
  {
    operation: "Search",
    keys: ["search"],
    time: "O(h)",
    why: "Follows left/right comparisons.",
  },
  {
    operation: "Inorder / Preorder / Postorder",
    keys: ["inorder", "preorder", "postorder"],
    time: "O(n)",
    why: "Visits every node once.",
  },
  {
    operation: "Level-Order",
    keys: ["levelorder"],
    time: "O(n)",
    why: "Visits every node using a queue.",
  },
  {
    operation: "Clear Tree",
    keys: ["clear"],
    time: "O(1)",
    why: "Reset the root reference.",
  },
];

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

    current = value < current.value ? current.left : current.right;
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

function treeVisit(
  root: TreeNode | null,
  order: TraversalOrder
): TreeNode[] {
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

const VISIT_LINE: Record<TraversalOrder, number> = {
  inorder: 3,
  preorder: 2,
  postorder: 4,
  levelorder: 3,
};

const TRAVERSAL_LABELS: Record<TraversalOrder, string> = {
  inorder: "Inorder",
  preorder: "Preorder",
  postorder: "Postorder",
  levelorder: "Level-order",
};

// Nodes visited while looking for `value`, from the root down.
function searchPath(root: TreeNode | null, value: number): TreeNode[] {
  const path: TreeNode[] = [];
  let current = root;

  while (current) {
    path.push(current);

    if (value === current.value) break;

    current = value < current.value ? current.left : current.right;
  }

  return path;
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
    const initial = [50, 30, 70, 20, 40, 60, 80];

    for (let i = 0; i < initial.length; i++) {
      tree = insertNode(tree, initial[i], i + 1);
    }

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

  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState("1");
  const [undoStack, setUndoStack] = useState<(TreeNode | null)[]>([]);
  const [redoStack, setRedoStack] = useState<(TreeNode | null)[]>([]);

  const [stickyTop, setStickyTop] = useState(80);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      let bottom = 0;

      for (const el of document.elementsFromPoint(
        window.innerWidth / 2,
        2
      )) {
        let node: Element | null = el;

        while (node && node !== document.body) {
          const position = getComputedStyle(node).position;

          if (position === "fixed" || position === "sticky") {
            const rect = node.getBoundingClientRect();

            if (rect.top <= 2 && rect.height <= 160) {
              bottom = Math.max(bottom, rect.bottom);
            }
          }

          node = node.parentElement;
        }
      }

      setStickyTop(Math.round(bottom) + 12);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();

    window.addEventListener("scroll", schedule, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const rootRef = useRef(root);
  rootRef.current = root;

  const nextIdRef = useRef(nextId);
  nextIdRef.current = nextId;

  const speedRef = useRef(animationSpeed);
  speedRef.current = animationSpeed;

  const playbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const traverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const framesRef = useRef<Step[] | null>(null);
  const frameIndexRef = useRef(0);
  const replayOriginalRef = useRef<{ tree: TreeNode | null } | null>(null);
  const historyIdRef = useRef(1);

  const [newIds, setNewIds] = useState<number[]>([]);
  const prevIdsRef = useRef<Set<number> | null>(null);

  const selectedCode = pseudocode[operation];
  const stats = useMemo(() => getStats(root), [root]);
  const positioned = useMemo(() => layoutTree(root), [root]);

  const treeCanvasWidth = 1000;
  const treeCanvasHeight = Math.max(300, stats.height * 110 + 60);

  useEffect(() => {
    const ids = collectIds(root);
    const prev = prevIdsRef.current;
    prevIdsRef.current = new Set(ids);

    if (prev === null) return undefined;

    const added = ids.filter((id) => !prev.has(id));

    if (added.length === 0) {
      setNewIds([]);
      return undefined;
    }

    setNewIds(added);

    const t = setTimeout(() => setNewIds([]), 1600);

    return () => clearTimeout(t);
  }, [root]);

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

  function updateRoot(nextRoot: TreeNode | null) {
    const current = rootRef.current;

    setUndoStack((old) => [...old, cloneTree(current)]);
    setRedoStack([]);
    rootRef.current = nextRoot;
    setRoot(nextRoot);
    setActiveNode(null);
    setTraversal(null);
    setVisitedIds([]);
  }

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

    stopTraversalAnim();
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

    stopTraversalAnim();
    setVisitedIds([]);

    const entries = history.slice().reverse();
    const original = cloneTree(rootRef.current);

    replayOriginalRef.current = { tree: original };

    const frames: Step[] = [];

    frames.push({
      line: null,
      run: () => {
        const start = cloneTree(entries[0].before);

        rootRef.current = start;
        setRoot(start);
        setActiveNode(null);
        setTraversal(null);
        setVisitedIds([]);
        setReplayEntryId(null);
        setMessage("Replay started from the initial state.");
      },
    });

    entries.forEach((entry) => {
      const title = pseudocode[entry.op].title;

      // Traversals replay node by node; search / insert / delete replay the
      // root-to-target path; everything else jumps straight to the result.
      const isTraversal =
        entry.traversal != null &&
        entry.path != null &&
        entry.path.length > 0;

      const isPathOp =
        (entry.op === "insert" ||
          entry.op === "delete" ||
          entry.op === "search") &&
        entry.value !== undefined;

      const isRandom =
        entry.op === "levelorder" && entry.traversal == null;

      // 1) header: announce the operation and reset the tree to its "before" state
      frames.push({
        line: 0,
        run: () => {
          const start = cloneTree(entry.before);

          rootRef.current = start;
          setRoot(start);

          setOperation(entry.op);
          setReplayEntryId(entry.id);
          setTraversal(isTraversal ? [] : null);
          setVisitedIds([]);
          setActiveNode(null);
          setMessage(
            isRandom
              ? "Replaying: random tree generation"
              : `Replaying: ${title}`
          );
        },
      });

      // 2a) traversal: one frame per visited node
      if (isTraversal) {
        const values = entry.traversal as number[];
        const ids = entry.path as number[];
        const order = entry.op as TraversalOrder;
        const label = TRAVERSAL_LABELS[order];
        const visitLine = VISIT_LINE[order];

        ids.forEach((id, i) => {
          frames.push({
            line: visitLine,
            run: () => {
              setActiveNode(id);
              setVisitedIds(ids.slice(0, i + 1));
              setTraversal(values.slice(0, i + 1));
              setMessage(
                `${label}: visiting ${values[i]} (${i + 1} of ${values.length})`
              );
            },
          });
        });

        frames.push({
          line: null,
          run: () => {
            setActiveNode(null);
            setMessage(entry.text);
          },
        });

        return;
      }

      // 2b) search / insert / delete: walk the path from the root
      if (isPathOp) {
        const target = entry.value as number;
        const walked = searchPath(entry.before, target);
        const pathIds = walked.map((node) => node.id);

        walked.forEach((node, i) => {
          frames.push({
            line: 2,
            run: () => {
              setActiveNode(node.id);
              setVisitedIds(pathIds.slice(0, i + 1));
              setMessage(
                `Comparing ${target} with ${node.value} (step ${i + 1} of ${walked.length})`
              );
            },
          });
        });

        frames.push({
          line: entry.line,
          run: () => {
            const next = cloneTree(entry.after);

            rootRef.current = next;
            setRoot(next);
            setTraversal(null);

            if (entry.op === "insert") {
              setActiveNode(entry.activeId);
              setVisitedIds(
                entry.activeId !== null
                  ? [...pathIds, entry.activeId]
                  : pathIds
              );
            } else if (entry.op === "delete") {
              setActiveNode(null);
              setVisitedIds([]);
            } else {
              setActiveNode(entry.activeId);
              setVisitedIds(pathIds);
            }

            setMessage(entry.text);
          },
        });

        return;
      }

      // 2c) clear / random tree: show the result
      frames.push({
        line: entry.line,
        run: () => {
          const next = cloneTree(entry.after);

          rootRef.current = next;
          setRoot(next);
          setActiveNode(entry.activeId);
          setTraversal(entry.traversal);
          setVisitedIds(entry.path ?? []);
          setMessage(entry.text);
        },
      });
    });

    frames.push({
      line: null,
      run: () => {
        const restored = cloneTree(original);

        rootRef.current = restored;
        setRoot(restored);
        replayOriginalRef.current = null;
        setReplayEntryId(null);
        setActiveNode(null);
        setTraversal(null);
        setVisitedIds([]);
        setMessage("Replay finished.");
      },
    });

    framesRef.current = frames;
    frameIndexRef.current = 0;
    setIsPlaying(true);
    runFrames();
  }

  function handleUndo() {
    abortReplay();

    if (undoStack.length === 0) return;

    const current = cloneTree(rootRef.current);
    const previous = undoStack[undoStack.length - 1];

    setRedoStack((old) => [...old, current]);
    setUndoStack((old) => old.slice(0, -1));

    const restored = cloneTree(previous);

    rootRef.current = restored;
    setRoot(restored);
    setTraversal(null);
    setVisitedIds([]);
    setActiveNode(null);
    setMessage("Undo successful.");
  }

  function handleRedo() {
    abortReplay();

    if (redoStack.length === 0) return;

    const current = cloneTree(rootRef.current);
    const next = redoStack[redoStack.length - 1];

    setUndoStack((old) => [...old, current]);
    setRedoStack((old) => old.slice(0, -1));

    const restored = cloneTree(next);

    rootRef.current = restored;
    setRoot(restored);
    setTraversal(null);
    setVisitedIds([]);
    setActiveNode(null);
    setMessage("Redo successful.");
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

    abortReplay();

    const before = cloneTree(rootRef.current);
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
      after: cloneTree(after),
      activeId: id,
      traversal: null,
      value: n,
      line: 1,
    });
  }

  function remove() {
    const n = readNumber();

    if (n === null) return;

    abortReplay();

    const before = cloneTree(rootRef.current);
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
      after: cloneTree(after),
      activeId: found.id,
      traversal: null,
      value: n,
      line: 4,
    });
  }

  function search() {
    const n = readNumber();

    if (n === null) return;

    abortReplay();

    const before = cloneTree(rootRef.current);
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
        after: cloneTree(before),
        activeId: found?.id ?? null,
        traversal: null,
        value: n,
        line,
      }
    );
  }

  function traverse(order: TraversalOrder) {
    abortReplay();

    const before = cloneTree(rootRef.current);

    setOperation(order);
    setActiveLine(null);
    setActiveNode(null);

    const visitNodes = treeVisit(before, order);
    const values = visitNodes.map((node) => node.value);
    const ids = visitNodes.map((node) => node.id);
    const visitLine = VISIT_LINE[order];

    const labels: Record<TraversalOrder, string> = {
      inorder: "Inorder",
      preorder: "Preorder",
      postorder: "Postorder",
      levelorder: "Level-order",
    };

    const finalText = values.length
      ? `${labels[order]} traversal completed (${values.length} nodes).`
      : "The tree is empty.";

    record(finalText, {
      op: order,
      before,
      after: cloneTree(before),
      activeId: null,
      traversal: values,
      path: ids,
      line: values.length ? visitLine : null,
    });

    if (values.length === 0) {
      setTraversal([]);
      setVisitedIds([]);
      return;
    }

    setTraversal([]);
    setVisitedIds([]);

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
        traverseTimer.current = setTimeout(
          () => {
            traverseTimer.current = null;
            setActiveNode(null);
            setActiveLine(null);
            setMessage(finalText);
          },
          800 / Number(speedRef.current)
        );
      }
    };

    tick();
  }

  function clearTree() {
    abortReplay();

    const before = cloneTree(rootRef.current);

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

    const before = cloneTree(rootRef.current);
    let generated: TreeNode | null = null;
    const used = new Set<number>();
    let id = nextIdRef.current;

    while (used.size < count) {
      const n = Math.floor(Math.random() * (max - min + 1)) + min;

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
        after: cloneTree(generated),
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
          0% { opacity: 0; }
          100% { opacity: 1; }
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
          .anim-new {
            animation: none !important;
          }
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
            <h1 className="text-2xl font-bold tracking-tight text-[#0F6B6D] dark:text-[#FFAB91]">
              Binary Tree Visualizer
            </h1>

            <p className="text-xs text-[#0F6B6D] dark:text-white">
              Explore BST operations, traversals, pseudocode, and complexity.
            </p>
          </div>

          <Badge
            variant="outline"
            className="rounded-full border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-50"
          >
            Binary Search Tree · BST
          </Badge>
        </header>

        {/* Main Layout */}
        <div className="grid grid-cols-1 items-start gap-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside
            style={{ "--sidebar-top": `${stickyTop}px` } as CSSProperties}
            className="vis-scroll min-w-0 space-y-3 lg:sticky lg:top-[var(--sidebar-top)] lg:max-h-[calc(100vh_-_var(--sidebar-top)_-_0.75rem)] lg:overflow-y-scroll lg:pr-1"
          >
            {/* Operations (random generator lives in the same card) */}
            <Card className={cardCls}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium">
                  Operations
                </CardTitle>
                <CardDescription className="text-xs">
                  Modify your tree
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 p-4 pt-1">
                <div className="space-y-1">
                  <label htmlFor="tree-value" className="text-xs font-medium">
                    Node value
                  </label>

                  <Input
                    id="tree-value"
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter value"
                    className={inputCls}
                  />
                </div>

                <Button onClick={insert} className={opButton}>
                  + Insert
                </Button>

                <Button onClick={remove} className={opButton}>
                  − Delete
                </Button>

                <Button onClick={search} className={opButton}>
                  Search Value
                </Button>

                <Button
                  onClick={() => traverse("inorder")}
                  className={opButton}
                >
                  Inorder Traversal
                </Button>

                <Button
                  onClick={() => traverse("preorder")}
                  className={opButton}
                >
                  Preorder Traversal
                </Button>

                <Button
                  onClick={() => traverse("postorder")}
                  className={opButton}
                >
                  Postorder Traversal
                </Button>

                <Button
                  onClick={() => traverse("levelorder")}
                  className={opButton}
                >
                  Level-Order Traversal
                </Button>

                <Button onClick={clearTree} className={opButton}>
                  Clear Tree
                </Button>

                {/* Random tree */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="min-w-0 space-y-1">
                    <label htmlFor="tree-min" className="text-xs font-medium">
                      Minimum
                    </label>

                    <Input
                      id="tree-min"
                      type="number"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <label htmlFor="tree-max" className="text-xs font-medium">
                      Maximum
                    </label>

                    <Input
                      id="tree-max"
                      type="number"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="tree-count" className="text-xs font-medium">
                    Number of nodes (1–20)
                  </label>

                  <Input
                    id="tree-count"
                    type="number"
                    min="1"
                    max="20"
                    value={randomCount}
                    onChange={(e) => setRandomCount(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <Button onClick={generateRandom} className={opButton}>
                  Generate Tree
                </Button>
              </CardContent>
            </Card>

            {/* History */}
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

            {/* Status */}
            <Alert className="rounded-xl border-red-100 bg-red-50/60">
              <AlertDescription className="text-xs leading-relaxed text-red-900">
                {message}
              </AlertDescription>
            </Alert>
          </aside>

          {/* Main Content */}
          <section className="flex min-w-0 flex-col gap-4">
            {/* Visualization Card */}
            <Card className={`${cardCls} min-w-0 overflow-hidden`}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-[#BFD8D8] p-4">
                <div className="min-w-0">
                  <CardTitle className="text-base font-medium">
                    Learn, Play and Create
                  </CardTitle>

                  <CardDescription className="text-xs">
                    Explore the tree structure and traversal output.
                  </CardDescription>
                </div>

                {/* Zoom Controls */}
                <div className="flex shrink-0 items-center gap-2">
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

              <CardContent className="flex flex-col gap-3 p-4">
                {/* Playback Controls */}
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

                  {/* Animation Speed */}
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

                {/* Tree Statistics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Root
                    </p>
                    <p className="truncate text-xl font-medium">
                      {root ? root.value : "—"}
                    </p>
                  </div>

                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Nodes
                    </p>
                    <p className="text-xl font-medium">{stats.count}</p>
                  </div>

                  <div className={`${innerBox} min-w-0 bg-card p-3`}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                      Height
                    </p>
                    <p className="text-xl font-medium">
                      {stats.height || "—"}
                    </p>
                  </div>
                </div>

                {/* Tree Canvas */}
                <div
                  className={`${innerBox} flex min-w-0 flex-col overflow-hidden bg-card`}
                >
                  <div className="flex items-center justify-between border-b border-[#BFD8D8] px-3 py-2">
                    <span className="text-xs font-medium">Tree Structure</span>
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px]"
                    >
                      BST
                    </Badge>
                  </div>

                  <div className="vis-scroll h-[350px] overflow-auto p-3 sm:h-[420px] sm:p-4">
                    {!root ? (
                      <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center">
                        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 text-2xl text-muted-foreground">
                          ∅
                        </div>

                        <p className="text-sm font-medium">Tree is empty</p>

                        <p className="mt-1 text-xs text-muted-foreground">
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
                              .map((item) => {
                                const isVisited = visitedIds.includes(
                                  item.node.id
                                );

                                return (
                                  <line
                                    key={`edge-${item.node.id}`}
                                    x1={item.parentX}
                                    y1={item.parentY! + 22}
                                    x2={item.x}
                                    y2={item.y - 22}
                                    stroke={
                                      isVisited ? "#dc2626" : "currentColor"
                                    }
                                    strokeOpacity={isVisited ? 1 : 0.4}
                                    strokeWidth={isVisited ? 4 : 2.2}
                                    style={{
                                      transition:
                                        "stroke 300ms, stroke-width 300ms",
                                    }}
                                  />
                                );
                              })}
                          </svg>

                          {positioned.map(({ node, x, y }) => {
                            const isNew = newIds.includes(node.id);
                            const visitIndex = visitedIds.indexOf(node.id);
                            const isVisited = visitIndex !== -1;

                            return (
                              <div
                                key={node.id}
                                className={`anim-new absolute z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 transition-colors duration-300 sm:h-12 sm:w-12 ${
                                  activeNode === node.id
                                    ? "border-red-600 bg-red-100 text-red-900 ring-2 ring-red-300"
                                    : isVisited
                                      ? "border-red-400 bg-red-100 text-red-900"
                                      : node.id === root?.id
                                        ? "border-red-400 bg-red-50 text-red-800"
                                        : "border-border bg-card text-foreground"
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
                                <span className="text-sm font-bold leading-none sm:text-base">
                                  {node.value}
                                </span>

                                {activeNode === node.id && (
                                  <span className="absolute -top-4 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                                    ACTIVE
                                  </span>
                                )}

                                {isVisited && (
                                  <span className="absolute -bottom-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                                    {visitIndex + 1}
                                  </span>
                                )}

                                {isNew && (
                                  <span
                                    className="absolute -right-3 -top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-semibold text-white"
                                    style={{
                                      animation:
                                        "badge-pop 400ms ease-out both",
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
                </div>

                {/* Traversal Output */}
                <div className={`${innerBox} bg-card p-3`}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold">
                      Traversal / Operation Output
                    </span>

                    <Badge
                      variant="outline"
                      className="rounded-full font-mono text-[10px]"
                    >
                      {traversal?.length ?? 0} values
                    </Badge>
                  </div>

                  {traversal !== null ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {traversal.length > 0 ? (
                        traversal.map((v, index) => (
                          <span
                            key={`${v}-${index}-traversal`}
                            className="flex items-center gap-2"
                          >
                            <span className="rounded-md bg-red-100 px-2 py-1 font-mono text-xs font-medium text-red-800">
                              {v}
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
                          Empty
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Choose a traversal operation to see its output.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pseudocode and Complexity */}
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-2">
              {/* Pseudocode */}
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

                <CardContent className="flex min-w-0 flex-col gap-3 p-4 pt-1">
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
                          className={`whitespace-pre ${
                            line.trim().startsWith("//")
                              ? "italic text-sky-400/70"
                              : ""
                          }`}
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

              {/* Time Complexity */}
              <Card
                className={`${cardCls} flex min-w-0 flex-col overflow-hidden md:max-h-[560px]`}
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Time Complexity
                  </CardTitle>

                  <CardDescription className="text-xs">
                    Performance depends on the height of the tree
                  </CardDescription>
                </CardHeader>

                <CardContent className="vis-scroll flex-1 overflow-y-scroll p-4 pt-1">
                  <div className="space-y-3">
                    {complexityRows.map((row) => {
                      const isActive = row.keys.includes(operation);

                      return (
                        <div
                          key={row.operation}
                          className={`rounded-lg border p-3 transition-colors ${
                            isActive
                              ? "border-red-300 bg-red-50/70 dark:border-[#FFAB91]/60 dark:bg-[#FFAB91]/10"
                              : "bg-card"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium">
                              {row.operation}
                            </p>

                            <Badge
                              className={`font-mono text-[10px] ${
                                isActive
                                  ? "border-red-300 text-[#FBB917] dark:border-[#FFAB91] dark:text-[#000000]"
                                  : ""
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
                        A tree with n nodes requires O(n) space. Here,{" "}
                        <strong>h</strong> is the tree height and{" "}
                        <strong>n</strong> is the number of nodes. A balanced
                        BST has height O(log n); a skewed BST can have height
                        O(n).
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