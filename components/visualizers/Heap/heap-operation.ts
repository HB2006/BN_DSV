

import type { HeapNode } from "./type";

export function insertHeap(
  heap: HeapNode[],
  value: number,
  id: number
): HeapNode[] {
  const result = [...heap, { id, value }];
  let index = result.length - 1;

  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2);

    if (result[parentIndex].value <= result[index].value) {
      break;
    }

    [result[parentIndex], result[index]] = [
      result[index],
      result[parentIndex],
    ];

    index = parentIndex;
  }

  return result;
}

export function deleteMin(heap: HeapNode[]): HeapNode[] {
  if (heap.length === 0) {
    throw new Error("Cannot delete from an empty heap.");
  }

  if (heap.length === 1) {
    return [];
  }

  const result = [...heap];
  result[0] = result[result.length - 1];
  result.pop();

  let index = 0;

  while (true) {
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;
    let smallest = index;

    if (
      leftChild < result.length &&
      result[leftChild].value < result[smallest].value
    ) {
      smallest = leftChild;
    }

    if (
      rightChild < result.length &&
      result[rightChild].value < result[smallest].value
    ) {
      smallest = rightChild;
    }

    if (smallest === index) {
      break;
    }

    [result[index], result[smallest]] = [
      result[smallest],
      result[index],
    ];

    index = smallest;
  }

  return result;
}

export function searchHeap(
  heap: HeapNode[],
  value: number
): number {
  return heap.findIndex((node) => node.value === value);
}

export function getMin(heap: HeapNode[]): number {
  if (heap.length === 0) {
    throw new Error("Cannot get the minimum of an empty heap.");
  }

  return heap[0].value;
}