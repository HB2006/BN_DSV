import type { StackNode } from "./type";

export function push(
  stack: StackNode[],
  value: number,
  id: number
): StackNode[] {
  return [...stack, { id, value }];
}

export function pop(
  stack: StackNode[]
): StackNode[] {
  if (stack.length === 0) {
    throw new Error("Cannot pop from an empty stack.");
  }

  return stack.slice(0, -1);
}

export function peekStack(
  stack: StackNode[]
): number {
  if (stack.length === 0) {
    throw new Error("Cannot peek at an empty stack.");
  }

  return stack[stack.length - 1].value;
}

export function searchStack(
  stack: StackNode[],
  value: number
): number {
  return stack.findIndex((node) => node.value === value);
}

export function isStackEmpty(
  stack: StackNode[]
): boolean {
  return stack.length === 0;
}

export function clearStack(): StackNode[] {
  return [];
}