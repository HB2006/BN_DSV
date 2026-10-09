import pytest
from Data_Structures.queue import Queue

@pytest.fixture
def empty_queue():
    """Provides a fresh, empty queue with no capacity limit."""
    return Queue()

@pytest.fixture
def bounded_queue():
    """Provides a fresh queue restricted to a capacity of 2 items."""
    return Queue(capacity=2)


def test_initial_state(empty_queue):
    """Verify that a newly instantiated queue behaves as empty."""
    assert empty_queue.is_empty() is True
    assert empty_queue.is_full() is False
    assert len(empty_queue) == 0


def test_enqueue_and_size(empty_queue):
    """Verify items append properly and update the queue length."""
    empty_queue.enqueue("Task A")
    assert empty_queue.is_empty() is False
    assert len(empty_queue) == 1

    empty_queue.enqueue("Task B")
    assert len(empty_queue) == 2


def test_fifo_ordering(empty_queue):
    """Confirm First-In, First-Out (FIFO) queue principles apply."""
    empty_queue.enqueue(1)
    empty_queue.enqueue(2)
    empty_queue.enqueue(3)

    assert empty_queue.dequeue() == 1
    assert empty_queue.dequeue() == 2
    assert empty_queue.dequeue() == 3
    assert empty_queue.is_empty() is True


def test_peek_does_not_remove(empty_queue):
    """Verify peek retrieves the front element without altering the queue size."""
    empty_queue.enqueue("Stay")
    empty_queue.enqueue("Go")
    
    assert empty_queue.peek() == "Stay"
    assert len(empty_queue) == 2  # Length must not change


def test_dequeue_empty_raises_exception(empty_queue):
    """Ensure popping an empty queue triggers an IndexError."""
    with pytest.raises(IndexError, match="Dequeue from empty queue"):
        empty_queue.dequeue()


def test_peek_empty_raises_exception(empty_queue):
    """Ensure peeking an empty queue triggers an IndexError."""
    with pytest.raises(IndexError, match="Peek from empty queue"):
        empty_queue.peek()


def test_bounded_queue_limits(bounded_queue):
    """Validate behavior of queues operating at or above custom capacity constraints."""
    assert bounded_queue.is_full() is False
    
    bounded_queue.enqueue("item1")
    bounded_queue.enqueue("item2")
    
    assert bounded_queue.is_full() is True
    
    # Attempting to overfill should fail immediately
    with pytest.raises(OverflowError, match="Queue is full"):
        bounded_queue.enqueue("item3")


@pytest.mark.parametrize("items", [
    ([10, 20, 30]),
    (["A", "B", "C", "D"]),
    ([])
])
def test_bulk_processing(items):
    """Data-driven test to handle varying sequences of queue operations smoothly."""
    q = Queue()
    for item in items:
        q.enqueue(item)
        
    assert len(q) == len(items)
    
    for item in items:
        assert q.dequeue() == item