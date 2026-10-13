export interface StackNode {
  id: number;
  value: number;
}

export type StackOperation =
  | "push"
  | "pop"
  | "peek"
  | "search"
  | "traverse"
  | "clear";
  