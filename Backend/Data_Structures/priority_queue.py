import heapq


class PriorityQueue:
    def __init__(self):
        self.queue = []

    def enqueue(self, value, priority):
        """
        Add an element with a priority.
        Lower priority number = higher priority.
        """
        heapq.heappush(self.queue, (priority, value))

    def dequeue(self):
        """
        Remove and return the highest-priority element.
        """
        if not self.queue:
            raise IndexError("Priority queue is empty")

        priority, value = heapq.heappop(self.queue)
        return value

    def peek(self):
        """
        Return the highest-priority element without removing it.
        """
        if not self.queue:
            raise IndexError("Priority queue is empty")

        priority, value = self.queue[0]
        return value

    def is_empty(self):
        return len(self.queue) == 0

    def size(self):
        return len(self.queue)

    def clear(self):
        self.queue.clear()

    def get_items(self):
        """
        Return the elements in priority order.
        """
        return [
            value
            for priority, value in sorted(self.queue)
        ]