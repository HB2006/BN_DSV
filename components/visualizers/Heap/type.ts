export interface HeapNode {
  id: number;
  value: number;
}

export type HeapOperation =
  | "insert"
  | "delete-min"
  | "search"
  | "get-min"
  | "traverse"
  | "clear";