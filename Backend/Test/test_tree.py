import pytest

from Data_Structures.trees import Tree


def test_initial_tree():
    tree = Tree()

    assert tree.root is None
    assert tree.preorder() == []
    assert tree.postorder() == []


def test_insert_root():
    tree = Tree()

    tree.insert("A")

    assert tree.root is not None
    assert tree.root.value == "A"
    assert tree.preorder() == ["A"]
    assert tree.postorder() == ["A"]


def test_insert_child():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")

    assert tree.preorder() == ["A", "B"]
    assert tree.postorder() == ["B", "A"]


def test_insert_multiple_children():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")
    tree.insert("C", "A")
    tree.insert("D", "A")

    assert tree.preorder() == ["A", "B", "C", "D"]
    assert tree.postorder() == ["B", "C", "D", "A"]


def test_nested_tree_traversals():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")
    tree.insert("C", "A")
    tree.insert("D", "A")
    tree.insert("E", "B")
    tree.insert("F", "B")

    assert tree.preorder() == [
        "A",
        "B",
        "E",
        "F",
        "C",
        "D"
    ]

    assert tree.postorder() == [
        "E",
        "F",
        "B",
        "C",
        "D",
        "A"
    ]


def test_deeper_tree():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")
    tree.insert("C", "B")
    tree.insert("D", "C")
    tree.insert("E", "D")

    assert tree.preorder() == [
        "A",
        "B",
        "C",
        "D",
        "E"
    ]

    assert tree.postorder() == [
        "E",
        "D",
        "C",
        "B",
        "A"
    ]


def test_single_node_traversals():
    tree = Tree()

    tree.insert("A")

    assert tree.preorder() == ["A"]
    assert tree.postorder() == ["A"]


def test_empty_tree_traversals():
    tree = Tree()

    assert tree.preorder() == []
    assert tree.postorder() == []


def test_search_existing_value():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")
    tree.insert("C", "A")
    tree.insert("D", "B")

    assert tree.search("A")
    assert tree.search("B")
    assert tree.search("C")
    assert tree.search("D")


def test_search_non_existing_value():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")

    assert not tree.search("C")


def test_search_empty_tree():
    tree = Tree()

    assert not tree.search("A")


def test_insert_without_parent():
    tree = Tree()

    tree.insert("A")

    with pytest.raises(
        ValueError,
        match="Parent value must be specified"
    ):
        tree.insert("B")


def test_insert_with_invalid_parent():
    tree = Tree()

    tree.insert("A")

    with pytest.raises(
        ValueError,
        match="Parent node not found"
    ):
        tree.insert("B", "X")


def test_clear_tree():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")
    tree.insert("C", "A")

    tree.clear()

    assert tree.root is None
    assert tree.preorder() == []
    assert tree.postorder() == []


def test_duplicate_values():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")
    tree.insert("B", "A")

    assert tree.preorder() == ["A", "B", "B"]
    assert tree.postorder() == ["B", "B", "A"]


def test_tree_structure():
    tree = Tree()

    tree.insert("A")
    tree.insert("B", "A")
    tree.insert("C", "A")
    tree.insert("D", "B")

    assert tree.root.value == "A"
    assert len(tree.root.children) == 2

    assert tree.root.children[0].value == "B"
    assert tree.root.children[1].value == "C"

    assert len(tree.root.children[0].children) == 1
    assert tree.root.children[0].children[0].value == "D"