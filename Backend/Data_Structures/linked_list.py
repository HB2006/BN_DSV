class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def insert(self, value):
        new_node = Node(value)

        if self.head is None:
            self.head = new_node
            return

        current = self.head

        while current.next:
            current = current.next

        current.next = new_node

    def delete(self, value):
        if self.head is None:
            raise ValueError("Linked list is empty")

        if self.head.value == value:
            self.head = self.head.next
            return

        current = self.head

        while current.next:
            if current.next.value == value:
                current.next = current.next.next
                return

            current = current.next

        raise ValueError("Value not found")

    def search(self, value):
        current = self.head

        while current:
            if current.value == value:
                return True

            current = current.next

        return False

    def get_items(self):
        items = []
        current = self.head

        while current:
            items.append(current.value)
            current = current.next

        return items

    def clear(self):
        self.head = None