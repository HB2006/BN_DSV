import type { StackNode } from "./type";

export function push(
  stack: StackNode[],
  value: number,
  id: number
): StackNode[] {
  return [...stack, { id, value }];
}

<<<<<<< HEAD
export function pop(stack: StackNode[]): StackNode[] {
=======
export function pop(
  stack: StackNode[]
): StackNode[] {
>>>>>>> 1b055705ba9504ab9b32fea184dc54d0cb1f2118
  if (stack.length === 0) {
    throw new Error("Cannot pop from an empty stack.");
  }

  return stack.slice(0, -1);
}

<<<<<<< HEAD
export function peekStack(stack: StackNode[]): number {
=======
export function peekStack(
  stack: StackNode[]
): number {
>>>>>>> 1b055705ba9504ab9b32fea184dc54d0cb1f2118
  if (stack.length === 0) {
    throw new Error("Cannot peek at an empty stack.");
  }

  return stack[stack.length - 1].value;
}

<<<<<<< HEAD
export function searchStack(stack: StackNode[], value: number): number {
  return stack.findIndex((node) => node.value === value);
}

export function isStackEmpty(stack: StackNode[]): boolean {
=======
export function searchStack(
  stack: StackNode[],
  value: number
): number {
  return stack.findIndex((node) => node.value === value);
}

export function isStackEmpty(
  stack: StackNode[]
): boolean {
>>>>>>> 1b055705ba9504ab9b32fea184dc54d0cb1f2118
  return stack.length === 0;
}

export function clearStack(): StackNode[] {
  return [];
}