class Stack:
    def __init__(self):
        self.stack = []

    def push(self, value):
        self.stack.append(value)

    def pop(self):
        if not self.stack:
            raise IndexError("Stack is empty")

        return self.stack.pop()

    def peek(self):
        if not self.stack:
            raise IndexError("Stack is empty")

        return self.stack[-1]

    def is_empty(self):
        return len(self.stack) == 0

    def size(self):
        return len(self.stack)

    def clear(self):
        self.stack.clear()

    def get_items(self):
        return self.stack.copy()