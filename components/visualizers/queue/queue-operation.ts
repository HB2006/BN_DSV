import type { ListNode } from "./type";

export function enqueue(
  queue: ListNode[],
  value: number,
  id: number
): ListNode[] {
  return [...queue, { id, value }];
}

export function dequeue(
  queue: ListNode[]
): ListNode[] {
  if (queue.length === 0) {
    throw new Error("Cannot dequeue from an empty queue.");
  }

  return queue.slice(1);
}

export function peekQueue(
  queue: ListNode[]
): number {
  if (queue.length === 0) {
    throw new Error("Cannot peek at an empty queue.");
  }

  return queue[0].value;
}

export function searchQueue(
  queue: ListNode[],
  value: number
): number {
  return queue.findIndex((node) => node.value === value);
}

export function isQueueEmpty(
  queue: ListNode[]
): boolean {
  return queue.length === 0;
}

export function clearQueue(): ListNode[] {
  return [];
}