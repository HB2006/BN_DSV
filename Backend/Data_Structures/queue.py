from collections import deque


class Queue:
    def __init__(self, capacity=None):
        self.queue = deque()
        self.capacity = capacity

    def enqueue(self, value):
        """Add an element to the rear of the queue."""
        if self.is_full():
            raise OverflowError("Queue is full")

        self.queue.append(value)

    def dequeue(self):
        """Remove and return the element from the front."""
        if self.is_empty():
            raise IndexError("Dequeue from empty queue")

        return self.queue.popleft()

    def peek(self):
        """Return the front element without removing it."""
        if self.is_empty():
            raise IndexError("Peek from empty queue")

        return self.queue[0]

    def front(self):
        """Return the front element without removing it."""
        return self.peek()

    def rear(self):
        """Return the rear element without removing it."""
        if self.is_empty():
            raise IndexError("Queue is empty")

        return self.queue[-1]

    def is_empty(self):
        """Return True if the queue is empty."""
        return len(self.queue) == 0

    def is_full(self):
        """Return True if the queue has reached its capacity."""
        if self.capacity is None:
            return False

        return len(self.queue) >= self.capacity

    def size(self):
        """Return the number of elements in the queue."""
        return len(self.queue)

    def __len__(self):
        """Allow len(queue) to return the queue size."""
        return len(self.queue)

    def clear(self):
        """Remove all elements from the queue."""
        self.queue.clear()

    def get_items(self):
        """Return all queue elements as a list."""
        return list(self.queue)