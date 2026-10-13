import type { TreeNode } from "./type";

export function insertTree(
  tree: TreeNode[],
  value: number,
  id: number
): TreeNode[] {
  const result = [...tree];
  const newNode: TreeNode = {
    id,
    value,
    left: null,
    right: null,
  };

  if (result.length === 0) {
    return [newNode];
  }

  let currentId = result[0].id;

  while (true) {
    const currentIndex = result.findIndex(
      (node) => node.id === currentId
    );

    if (currentIndex === -1) {
      throw new Error("Invalid tree structure.");
    }

    const current = result[currentIndex];

    if (value < current.value) {
      if (current.left === null) {
        result[currentIndex] = {
          ...current,
          left: id,
        };

        result.push(newNode);
        break;
      }

      currentId = current.left;
    } else if (value > current.value) {
      if (current.right === null) {
        result[currentIndex] = {
          ...current,
          right: id,
        };

        result.push(newNode);
        break;
      }

      currentId = current.right;
    } else {
      throw new Error("Duplicate values are not allowed.");
    }
  }

  return result;
}

export function searchTree(
  tree: TreeNode[],
  value: number
): number {
  if (tree.length === 0) {
    return -1;
  }

  let currentId: number | null = tree[0].id;

  while (currentId !== null) {
    const current = tree.find(
      (node) => node.id === currentId
    );

    if (!current) {
      return -1;
    }

    if (current.value === value) {
      return current.id;
    }

    currentId =
      value < current.value
        ? current.left
        : current.right;
  }

  return -1;
}

export function deleteTree(
  tree: TreeNode[],
  value: number
): TreeNode[] {
  const result = tree.map((node) => ({ ...node }));

  const removeNode = (
    nodeId: number | null
  ): number | null => {
    if (nodeId === null) {
      return null;
    }

    const index = result.findIndex(
      (node) => node.id === nodeId
    );

    if (index === -1) {
      return null;
    }

    const node = result[index];

    if (value < node.value) {
      result[index] = {
        ...node,
        left: removeNode(node.left),
      };

      return nodeId;
    }

    if (value > node.value) {
      result[index] = {
        ...node,
        right: removeNode(node.right),
      };

      return nodeId;
    }

    // Node has no left child.
    if (node.left === null) {
      return node.right;
    }

    // Node has no right child.
    if (node.right === null) {
      return node.left;
    }

    // Node has two children:
    // Find the smallest value in the right subtree.
    let successorId = node.right;

    while (true) {
      const successor = result.find(
        (item) => item.id === successorId
      );

      if (!successor || successor.left === null) {
        break;
      }

      successorId = successor.left;
    }

    const successor = result.find(
      (item) => item.id === successorId
    );

    if (!successor) {
      return nodeId;
    }

    result[index] = {
      ...node,
      value: successor.value,
      right: deleteSubtreeValue(
        node.right,
        successor.value
      ),
    };

    return nodeId;
  };

  const deleteSubtreeValue = (
    nodeId: number | null,
    target: number
  ): number | null => {
    if (nodeId === null) {
      return null;
    }

    const index = result.findIndex(
      (node) => node.id === nodeId
    );

    if (index === -1) {
      return null;
    }

    const node = result[index];

    if (target < node.value) {
      result[index] = {
        ...node,
        left: deleteSubtreeValue(node.left, target),
      };

      return nodeId;
    }

    if (target > node.value) {
      result[index] = {
        ...node,
        right: deleteSubtreeValue(node.right, target),
      };

      return nodeId;
    }

    if (node.left === null) {
      return node.right;
    }

    if (node.right === null) {
      return node.left;
    }

    return nodeId;
  };

  const rootId = result[0]?.id ?? null;
  const newRootId = removeNode(rootId);

  if (newRootId === null) {
    return [];
  }

  // Keep only nodes reachable from the new root.
  const reachable = new Set<number>();

  const visit = (nodeId: number | null) => {
    if (nodeId === null || reachable.has(nodeId)) {
      return;
    }

    const node = result.find(
      (item) => item.id === nodeId
    );

    if (!node) {
      return;
    }

    reachable.add(nodeId);
    visit(node.left);
    visit(node.right);
  };

  visit(newRootId);

  return result.filter((node) => reachable.has(node.id));
}

export function inorderTraversal(
  tree: TreeNode[]
): number[] {
  const result: number[] = [];

  const visit = (nodeId: number | null) => {
    if (nodeId === null) {
      return;
    }

    const node = tree.find(
      (item) => item.id === nodeId
    );

    if (!node) {
      return;
    }

    visit(node.left);
    result.push(node.value);
    visit(node.right);
  };

  visit(tree[0]?.id ?? null);

  return result;
}

export function getTreeRoot(
  tree: TreeNode[]
): TreeNode | null {
  return tree[0] ?? null;
}