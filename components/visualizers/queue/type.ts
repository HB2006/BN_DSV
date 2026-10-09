export interface QueueNode {
  id: number;
  value: number;
}

export type QueueOperation =
  | "enqueue"
  | "dequeue"
  | "peek"
  | "search"
  | "traverse"
  | "clear";