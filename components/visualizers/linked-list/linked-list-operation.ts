
import type { ListNode } from "./type";

export function insertHead(
  list: ListNode[],
  value: number,
  id: number
): ListNode[] {
  return [{ id, value }, ...list];
}

export function insertTail(
  list: ListNode[],
  value: number,
  id: number
): ListNode[] {
  return [...list, { id, value }];
}

export function insertAtPosition(
  list: ListNode[],
  value: number,
  position: number,
  id: number
): ListNode[] {
  if (
    !Number.isInteger(position) ||
    position < 0 ||
    position > list.length
  ) {
    throw new Error(
      `Position must be between 0 and ${list.length}.`
    );
  }

  const result = [...list];
  result.splice(position, 0, { id, value });

  return result;
}

export function deleteValue(
  list: ListNode[],
  value: number
): ListNode[] {
  const index = list.findIndex((node) => node.value === value);

  if (index === -1) {
    throw new Error(`Value ${value} was not found.`);
  }

  return list.filter((_, i) => i !== index);
}

export function searchValue(
  list: ListNode[],
  value: number
): number {
  return list.findIndex((node) => node.value === value);
}