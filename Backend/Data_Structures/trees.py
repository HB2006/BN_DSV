class Node:
    def __init__(self, value):
        self.value = value
        self.children = []


class Tree:
    def __init__(self):
        self.root = None

    def insert(self, value, parent_value=None):
        new_node = Node(value)

        # If tree is empty, create the root
        if self.root is None:
            self.root = new_node
            return

        # Every node after the root needs a parent
        if parent_value is None:
            raise ValueError("Parent value must be specified")

        parent = self._find(self.root, parent_value)

        if parent is None:
            raise ValueError("Parent node not found")

        parent.children.append(new_node)

    def _find(self, node, value):
        if node is None:
            return None

        if node.value == value:
            return node

        for child in node.children:
            result = self._find(child, value)

            if result is not None:
                return result

        return None

    def search(self, value):
        return self._find(self.root, value) is not None

    def preorder(self):
        result = []

        def traverse(node):
            if node is None:
                return

            # Visit node first
            result.append(node.value)

            # Then visit all children
            for child in node.children:
                traverse(child)

        traverse(self.root)

        return result

    def postorder(self):
        result = []

        def traverse(node):
            if node is None:
                return

            # Visit all children first
            for child in node.children:
                traverse(child)

            # Visit node after its children
            result.append(node.value)

        traverse(self.root)

        return result

    def clear(self):
        self.root = None