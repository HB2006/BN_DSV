import pytest
from Data_Structures.priority_queue import PriorityQueue


def test_initial_state():
    pq = PriorityQueue()

    assert pq.is_empty()
    assert pq.size() == 0
    assert pq.get_items() == []


def test_enqueue():
    pq = PriorityQueue()

    pq.enqueue("Task A", 2)

    assert not pq.is_empty()
    assert pq.size() == 1
    assert pq.peek() == "Task A"


def test_enqueue_multiple_elements():
    pq = PriorityQueue()

    pq.enqueue("Low", 3)
    pq.enqueue("High", 1)
    pq.enqueue("Medium", 2)

    assert pq.size() == 3


def test_priority_order():
    pq = PriorityQueue()

    pq.enqueue("Low", 3)
    pq.enqueue("High", 1)
    pq.enqueue("Medium", 2)

    assert pq.get_items() == ["High", "Medium", "Low"]


def test_peek_returns_highest_priority_without_removing():
    pq = PriorityQueue()

    pq.enqueue("Low", 3)
    pq.enqueue("High", 1)

    assert pq.peek() == "High"
    assert pq.size() == 2


def test_dequeue_returns_highest_priority():
    pq = PriorityQueue()

    pq.enqueue("Low", 3)
    pq.enqueue("High", 1)
    pq.enqueue("Medium", 2)

    assert pq.dequeue() == "High"
    assert pq.size() == 2


def test_dequeue_in_priority_order():
    pq = PriorityQueue()

    pq.enqueue("Low", 3)
    pq.enqueue("High", 1)
    pq.enqueue("Medium", 2)

    assert pq.dequeue() == "High"
    assert pq.dequeue() == "Medium"
    assert pq.dequeue() == "Low"

    assert pq.is_empty()


def test_dequeue_empty_queue():
    pq = PriorityQueue()

    with pytest.raises(IndexError, match="Priority queue is empty"):
        pq.dequeue()


def test_peek_empty_queue():
    pq = PriorityQueue()

    with pytest.raises(IndexError, match="Priority queue is empty"):
        pq.peek()


def test_is_empty():
    pq = PriorityQueue()

    assert pq.is_empty()

    pq.enqueue("Task", 1)

    assert not pq.is_empty()

    pq.dequeue()

    assert pq.is_empty()


def test_size():
    pq = PriorityQueue()

    assert pq.size() == 0

    pq.enqueue("Task 1", 1)
    pq.enqueue("Task 2", 2)

    assert pq.size() == 2

    pq.dequeue()

    assert pq.size() == 1


def test_clear():
    pq = PriorityQueue()

    pq.enqueue("Task 1", 1)
    pq.enqueue("Task 2", 2)
    pq.enqueue("Task 3", 3)

    pq.clear()

    assert pq.is_empty()
    assert pq.size() == 0
    assert pq.get_items() == []


def test_get_items_returns_priority_order():
    pq = PriorityQueue()

    pq.enqueue("Task C", 5)
    pq.enqueue("Task A", 1)
    pq.enqueue("Task B", 3)

    assert pq.get_items() == [
        "Task A",
        "Task B",
        "Task C"
    ]


def test_same_priority():
    pq = PriorityQueue()

    pq.enqueue("Task A", 1)
    pq.enqueue("Task B", 1)
    pq.enqueue("Task C", 1)

    assert pq.size() == 3

    # With equal priorities, heapq orders by the value.
    assert pq.get_items() == ["Task A", "Task B", "Task C"]


def test_negative_priorities():
    pq = PriorityQueue()

    pq.enqueue("Normal", 1)
    pq.enqueue("Very High", -1)
    pq.enqueue("Low", 5)

    assert pq.get_items() == [
        "Very High",
        "Normal",
        "Low"
    ]


def test_duplicate_values():
    pq = PriorityQueue()

    pq.enqueue("Task", 2)
    pq.enqueue("Task", 1)

    assert pq.size() == 2
    assert pq.dequeue() == "Task"
    assert pq.dequeue() == "Task"
    assert pq.is_empty()