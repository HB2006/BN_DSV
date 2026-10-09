import pytest

from metadata.operations import (
    OPERATIONS,
    get_metadata,
    get_category_metadata
)


def test_stack_push_metadata():
    metadata = get_metadata("stack", "push")

    assert metadata["name"] == "Push"
    assert metadata["time_complexity"] == "O(1)"
    assert metadata["space_complexity"] == "O(1)"
    assert len(metadata["pseudocode"]) > 0


def test_queue_enqueue_metadata():
    metadata = get_metadata("queue", "enqueue")

    assert metadata["name"] == "Enqueue"
    assert metadata["time_complexity"] == "O(1)"
    assert len(metadata["pseudocode"]) > 0


def test_linked_list_search_metadata():
    metadata = get_metadata("linked_list", "search")

    assert metadata["name"] == "Search"
    assert metadata["time_complexity"] == "O(n)"


def test_priority_queue_enqueue_metadata():
    metadata = get_metadata("priority_queue", "enqueue")

    assert metadata["name"] == "Enqueue"
    assert metadata["time_complexity"] == "O(log n)"


def test_graph_bfs_metadata():
    metadata = get_metadata("algorithms", "bfs")

    assert metadata["name"] == "Breadth-First Search"
    assert metadata["time_complexity"] == "O(V + E)"
    assert metadata["space_complexity"] == "O(V)"


def test_graph_dfs_metadata():
    metadata = get_metadata("algorithms", "dfs")

    assert metadata["name"] == "Depth-First Search"
    assert metadata["time_complexity"] == "O(V + E)"
    assert metadata["space_complexity"] == "O(V)"


def test_tree_preorder_metadata():
    metadata = get_metadata("tree", "preorder")

    assert metadata["name"] == "Preorder Traversal"
    assert metadata["time_complexity"] == "O(n)"
    assert len(metadata["pseudocode"]) > 0


def test_tree_postorder_metadata():
    metadata = get_metadata("tree", "postorder")

    assert metadata["name"] == "Postorder Traversal"
    assert metadata["time_complexity"] == "O(n)"


def test_invalid_category():
    with pytest.raises(ValueError, match="Category does not exist"):
        get_metadata("invalid", "push")


def test_invalid_operation():
    with pytest.raises(ValueError, match="Operation does not exist"):
        get_metadata("stack", "invalid")


def test_get_category_metadata():
    metadata = get_category_metadata("stack")

    assert "push" in metadata
    assert "pop" in metadata
    assert "peek" in metadata


def test_all_operations_have_required_fields():
    required_fields = {
        "name",
        "description",
        "time_complexity",
        "space_complexity",
        "pseudocode"
    }

    for category in OPERATIONS.values():
        for operation in category.values():
            assert required_fields.issubset(operation.keys())
            assert len(operation["pseudocode"]) > 0