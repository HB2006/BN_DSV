import pytest

from Data_Structures.linked_list import LinkedList


@pytest.fixture
def linked_list():
    """Provides a fresh linked list for each test."""
    return LinkedList()


def test_initial_state(linked_list):
    """A newly created linked list should have no elements."""
    assert linked_list.head is None
    assert linked_list.get_items() == []


def test_insert_single_element(linked_list):
    """Test inserting a single element."""
    linked_list.insert(10)

    assert linked_list.head.value == 10
    assert linked_list.get_items() == [10]


def test_insert_multiple_elements(linked_list):
    """Test that multiple elements are inserted in order."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(30)

    assert linked_list.get_items() == [10, 20, 30]


def test_search_existing_value(linked_list):
    """Test searching for a value that exists."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(30)

    assert linked_list.search(20) is True


def test_search_non_existing_value(linked_list):
    """Test searching for a value that does not exist."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(30)

    assert linked_list.search(40) is False


def test_search_empty_list(linked_list):
    """Searching an empty list should return False."""
    assert linked_list.search(10) is False


def test_delete_first_element(linked_list):
    """Test deleting the first element."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(30)

    linked_list.delete(10)

    assert linked_list.get_items() == [20, 30]
    assert linked_list.head.value == 20


def test_delete_middle_element(linked_list):
    """Test deleting an element from the middle."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(30)

    linked_list.delete(20)

    assert linked_list.get_items() == [10, 30]


def test_delete_last_element(linked_list):
    """Test deleting the last element."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(30)

    linked_list.delete(30)

    assert linked_list.get_items() == [10, 20]


def test_delete_only_element(linked_list):
    """Test deleting the only element in the list."""
    linked_list.insert(10)

    linked_list.delete(10)

    assert linked_list.head is None
    assert linked_list.get_items() == []


def test_delete_from_empty_list(linked_list):
    """Deleting from an empty list should raise ValueError."""
    with pytest.raises(ValueError, match="Linked list is empty"):
        linked_list.delete(10)


def test_delete_non_existing_value(linked_list):
    """Deleting a value that does not exist should raise ValueError."""
    linked_list.insert(10)
    linked_list.insert(20)

    with pytest.raises(ValueError, match="Value not found"):
        linked_list.delete(30)


def test_clear(linked_list):
    """Test removing all elements from the linked list."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(30)

    linked_list.clear()

    assert linked_list.head is None
    assert linked_list.get_items() == []


def test_insert_duplicate_values(linked_list):
    """Test that duplicate values can be stored."""
    linked_list.insert(10)
    linked_list.insert(10)
    linked_list.insert(20)

    assert linked_list.get_items() == [10, 10, 20]


def test_delete_duplicate_value(linked_list):
    """Deleting a duplicate value should remove its first occurrence."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(10)

    linked_list.delete(10)

    assert linked_list.get_items() == [20, 10]


def test_insert_none(linked_list):
    """Test that None can be stored as a value."""
    linked_list.insert(None)

    assert linked_list.get_items() == [None]


def test_node_links(linked_list):
    """Verify that nodes are correctly connected."""
    linked_list.insert(10)
    linked_list.insert(20)
    linked_list.insert(30)

    assert linked_list.head.value == 10
    assert linked_list.head.next.value == 20
    assert linked_list.head.next.next.value == 30
    assert linked_list.head.next.next.next is None