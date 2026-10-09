import pytest
from Data_Structures.stack import Stack


def test_new_stack_is_empty():
    stack = Stack()

    assert stack.is_empty() is True
    assert stack.size() == 0


def test_push():
    stack = Stack()

    stack.push(10)
    stack.push(20)

    assert stack.size() == 2
    assert stack.peek() == 20


def test_pop():
    stack = Stack()

    stack.push(10)
    stack.push(20)

    assert stack.pop() == 20
    assert stack.pop() == 10
    assert stack.is_empty() is True


def test_peek_does_not_remove_element():
    stack = Stack()

    stack.push(10)

    assert stack.peek() == 10
    assert stack.size() == 1


def test_pop_empty_stack():
    stack = Stack()

    with pytest.raises(IndexError):
        stack.pop()


def test_peek_empty_stack():
    stack = Stack()

    with pytest.raises(IndexError):
        stack.peek()


def test_multiple_push_and_pop():
    stack = Stack()

    for i in range(1, 6):
        stack.push(i)

    assert stack.size() == 5

    for i in range(5, 0, -1):
        assert stack.pop() == i

    assert stack.is_empty() is True