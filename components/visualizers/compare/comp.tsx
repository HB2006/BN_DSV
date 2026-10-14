"use client";

import { useState } from "react";

type Operation = "Search" | "Insert" | "Delete" | "Traverse";

type Structure =
  | "Array"
  | "Stack"
  | "Queue"
  | "Linked List"
  | "Binary Tree"
  | "Graph"
  | "Heap";

const operations: Operation[] = ["Search", "Insert", "Delete", "Traverse"];

const structures: Structure[] = [
  "Array",
  "Stack",
  "Queue",
  "Linked List",
  "Binary Tree",
  "Graph",
  "Heap",
];

const icons: Record<Structure, string> = {
  Array: "▤",
  Stack: "▱",
  Queue: "☷",
  "Linked List": "○—○—○",
  "Binary Tree": "⑂",
  Graph: "◇",
  Heap: "♧",
};

const complexity: Record<
  Operation,
  Record<
    Structure,
    {
      best: string;
      average: string;
      worst: string;
      space: string;
      note: string;
    }
  >
> = {
  Search: {
    Array: {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Linear search",
    },
    Stack: {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Search through elements",
    },
    Queue: {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Search through elements",
    },
    "Linked List": {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Sequential search",
    },
    "Binary Tree": {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Assumes a balanced BST for O(log n)",
    },
    Graph: {
      best: "O(1)",
      average: "O(V + E)",
      worst: "O(V + E)",
      space: "O(V)",
      note: "BFS or DFS",
    },
    Heap: {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Arbitrary element search",
    },
  },
  Insert: {
    Array: {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "End insertion if capacity exists",
    },
    Stack: {
      best: "O(1)",
      average: "O(1)",
      worst: "O(1)",
      space: "O(1)",
      note: "Push",
    },
    Queue: {
      best: "O(1)",
      average: "O(1)",
      worst: "O(1)",
      space: "O(1)",
      note: "Enqueue with a suitable implementation",
    },
    "Linked List": {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "O(1) when the insertion position is known",
    },
    "Binary Tree": {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(n)",
      space: "O(1)",
      note: "BST insertion; balanced on average",
    },
    Graph: {
      best: "O(1)",
      average: "O(1)",
      worst: "O(1)",
      space: "O(1)",
      note: "Add a vertex or edge",
    },
    Heap: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)",
      space: "O(1)",
      note: "Insert and restore heap order",
    },
  },
  Delete: {
    Array: {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Removing an element may shift others",
    },
    Stack: {
      best: "O(1)",
      average: "O(1)",
      worst: "O(1)",
      space: "O(1)",
      note: "Pop",
    },
    Queue: {
      best: "O(1)",
      average: "O(1)",
      worst: "O(1)",
      space: "O(1)",
      note: "Dequeue with a suitable implementation",
    },
    "Linked List": {
      best: "O(1)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "O(1) when the target node is known",
    },
    "Binary Tree": {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(n)",
      space: "O(1)",
      note: "BST deletion; balanced on average",
    },
    Graph: {
      best: "O(1)",
      average: "O(V + E)",
      worst: "O(V + E)",
      space: "O(1)",
      note: "Depends on vertex or edge removal",
    },
    Heap: {
      best: "O(1)",
      average: "O(log n)",
      worst: "O(log n)",
      space: "O(1)",
      note: "Remove root and restore heap order",
    },
  },
  Traverse: {
    Array: {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Visit each element",
    },
    Stack: {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Visit each element",
    },
    Queue: {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Visit each element",
    },
    "Linked List": {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Visit each node",
    },
    "Binary Tree": {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(h)",
      note: "Tree traversal; h is tree height",
    },
    Graph: {
      best: "O(V + E)",
      average: "O(V + E)",
      worst: "O(V + E)",
      space: "O(V)",
      note: "BFS or DFS",
    },
    Heap: {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      space: "O(1)",
      note: "Visit all heap elements",
    },
  },
};

const resultRows = [
  { label: "Best Case", key: "best" as const },
  { label: "Average Case", key: "average" as const },
  { label: "Worst Case", key: "worst" as const },
  { label: "Space Complexity", key: "space" as const },
  { label: "Notes", key: "note" as const },
];

/*
  Palette (sampled from the Stack Visualizer page):
    page background   #0F6B68  (teal)
    cards             #FFF4E6  (cream)
    panels / headers  #DDE1D3  (sage)
    insets            #EDE9DD  (stone)
    accent            #FFAB91  (coral peach)
    body text         #0B4A47  (deep teal)
*/

export default function ComparePage() {
  const [operation, setOperation] = useState<Operation>("Search");
  const [selected, setSelected] = useState<Structure[]>([
    "Stack",
    "Queue",
    "Linked List",
    "Binary Tree",
    "Graph",
  ]);

  const toggleStructure = (structure: Structure) => {
    setSelected((current) =>
      current.includes(structure)
        ? current.filter((item) => item !== structure)
        : [...current, structure]
    );
  };

  return (
    <main className="min-h-screen bg-[#0F6B68] px-6 py-7 text-[#0B4A47] lg:px-10">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Page heading */}
        <header className="border-b border-white/20 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
            Compare Operations
          </h1>
          <p className="mt-3 text-sm text-white/85 md:text-base">
            Select an operation and choose data structures to compare their
            performance.
          </p>
        </header>

        {/* 1. Operation selection */}
        <section className="rounded-2xl bg-[#FFF4E6] p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-[#0F6B68]">
            1. Select an Operation
          </h2>

          <div className="flex flex-wrap gap-3">
            {operations.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setOperation(item)}
                aria-pressed={operation === item}
                className={`flex min-w-28 items-center justify-center gap-3 rounded-lg border-2 bg-[#FFAB91] px-4 py-3 text-sm font-medium text-[#0B4A47] transition ${
                  operation === item
                    ? "border-[#0F6B68] shadow-md"
                    : "border-transparent hover:border-[#0F6B68]/50 hover:brightness-95"
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {item === "Search" && "⌕"}
                  {item === "Insert" && "⊕"}
                  {item === "Delete" && "♜"}
                  {item === "Traverse" && "♧"}
                </span>
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* 2. Data structure selection */}
        <section className="rounded-2xl bg-[#FFF4E6] p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-[#0F6B68]">
            2. Choose Data Structures to Compare
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {structures
              .filter((structure) => structure !== "Array")
              .map((structure) => {
                const checked = selected.includes(structure);

                return (
                  <label
                    key={structure}
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-3 text-center transition ${
                      checked
                        ? "border-[#0F6B68] bg-[#DDE1D3]"
                        : "border-[#0F6B68]/20 hover:bg-[#EDE9DD]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStructure(structure)}
                        className="h-5 w-5 cursor-pointer accent-[#0F6B68]"
                      />
                      <span
                        className={`text-3xl ${
                          checked ? "text-[#0F6B68]" : "text-[#0B4A47]/60"
                        }`}
                        aria-hidden="true"
                      >
                        {icons[structure]}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        checked ? "text-[#0B4A47]" : "text-[#0B4A47]/70"
                      }`}
                    >
                      {structure}
                    </span>
                  </label>
                );
              })}
          </div>

          <p className="mt-5 text-sm text-[#0B4A47]/70">
            Select at least two data structures.
          </p>
        </section>

        {/* 3. Comparison results */}
        <section className="rounded-2xl bg-[#FFF4E6] p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#0F6B68]">
              3. Comparison Results{" "}
              <span className="text-sm font-medium text-[#0B4A47]/70">
                (Operation: {operation})
              </span>
            </h2>
            <span className="text-sm text-[#0B4A47]/70">
              n = number of elements
            </span>
          </div>

          {selected.length < 2 ? (
            <p className="py-12 text-center text-sm text-[#0B4A47]/70">
              Select at least two data structures to compare their performance.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#0F6B68]/30">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-[#0F6B68]/40 bg-[#DDE1D3]">
                    <th className="min-w-36 px-3 py-4 font-semibold text-[#0B4A47]">
                      Complexity
                    </th>

                    {selected.map((structure) => (
                      <th
                        key={structure}
                        className="px-4 py-4 text-center font-semibold text-[#0B4A47]"
                      >
                        <span className="mb-2 block text-2xl font-normal text-[#0F6B68]">
                          {icons[structure]}
                        </span>
                        {structure}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {resultRows.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-[#0F6B68]/20 last:border-b-0 hover:bg-[#FFAB91]/20"
                    >
                      <th className="px-3 py-4 font-medium text-[#0B4A47]">
                        {row.label}
                      </th>

                      {selected.map((structure) => (
                        <td
                          key={structure}
                          className={`px-4 py-4 text-center ${
                            row.key === "note"
                              ? "text-xs leading-5 text-[#0B4A47]/75"
                              : "font-mono text-[#0B4A47]"
                          }`}
                        >
                          {complexity[operation][structure][row.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Insight */}
        {selected.length >= 2 && (
          <section className="flex items-start gap-4 rounded-2xl bg-[#FFF4E6] p-6 shadow-sm">
            <span className="text-3xl text-[#0F6B68]" aria-hidden="true">
              ♧
            </span>
            <div>
              <h3 className="font-semibold text-[#0F6B68]">Insight</h3>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-[#0B4A47]">
                {operation === "Search" &&
                  "Search performance depends on how elements are organised. A balanced binary search tree can offer O(log n) average search time, while stacks, queues, and linked lists generally require O(n) time."}
                {operation === "Insert" &&
                  "Insertion performance depends on where the element is added. Stack and queue operations are generally O(1) at their designated ends, while heaps and search trees may need to restore their ordering."}
                {operation === "Delete" &&
                  "Deletion is often fastest when the target is already known or the structure supports removal at a specific end. Finding an arbitrary element may add extra time."}
                {operation === "Traverse" &&
                  "Traversal visits the elements in a structure. Most linear structures take O(n) time, while graph traversal takes O(V + E) time."}
              </p>
            </div>
          </section>
        )}

        <p className="border-t border-white/20 pt-4 text-xs leading-5 text-white/75">
          Complexity depends on implementation and input. Binary search tree
          averages assume a balanced tree; graph traversal uses V vertices and
          E edges. The displayed values are theoretical estimates.
        </p>
      </div>
    </main>
  );
}