export interface ListNode {
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