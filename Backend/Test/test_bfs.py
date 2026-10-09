import pytest

from Data_Structures.graph import Graph
from Data_Structures.bfs import bfs


def test_bfs_single_vertex():
    graph = Graph()
    graph.add_vertex("A")

    assert bfs(graph, "A") == ["A"]


def test_bfs_simple_graph():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("B", "D")

    result = bfs(graph, "A")

    # A is first
    assert result[0] == "A"

    # B and C are both one level away from A,
    # so their order is not guaranteed because Graph uses a set.
    assert set(result[1:3]) == {"B", "C"}

    # D is at the next level.
    assert result[3] == "D"


def test_bfs_level_order():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("B", "D")
    graph.add_edge("B", "E")
    graph.add_edge("C", "F")

    result = bfs(graph, "A")

    # A is the starting vertex.
    assert result[0] == "A"

    # B and C are at level 1.
    assert set(result[1:3]) == {"B", "C"}

    # D, E and F are at level 2.
    assert set(result[3:]) == {"D", "E", "F"}


def test_bfs_visits_each_vertex_once():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("B", "C")
    graph.add_edge("B", "D")
    graph.add_edge("C", "D")

    result = bfs(graph, "A")

    # No vertex should be visited more than once.
    assert len(result) == len(set(result))

    # All four vertices should be visited.
    assert set(result) == {"A", "B", "C", "D"}


def test_bfs_disconnected_graph():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("B", "C")

    graph.add_edge("X", "Y")

    result = bfs(graph, "A")

    # BFS should only visit vertices reachable from A.
    assert set(result) == {"A", "B", "C"}

    assert "X" not in result
    assert "Y" not in result


def test_bfs_from_different_start_vertex():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("B", "C")
    graph.add_edge("C", "D")

    result = bfs(graph, "C")

    # Starting from C:
    # C -> B and D -> A
    assert result[0] == "C"
    assert set(result[1:3]) == {"B", "D"}
    assert result[3] == "A"


def test_bfs_invalid_start_vertex():
    graph = Graph()

    graph.add_edge("A", "B")

    with pytest.raises(
        ValueError,
        match="Starting vertex does not exist"
    ):
        bfs(graph, "X")


def test_bfs_empty_graph():
    graph = Graph()

    with pytest.raises(
        ValueError,
        match="Starting vertex does not exist"
    ):
        bfs(graph, "A")


def test_bfs_cycle():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("B", "C")
    graph.add_edge("C", "A")

    result = bfs(graph, "A")

    # All three vertices should be visited exactly once.
    assert len(result) == 3
    assert len(result) == len(set(result))
    assert set(result) == {"A", "B", "C"}


def test_bfs_graph_with_self_loop():
    graph = Graph()

    graph.add_edge("A", "A")
    graph.add_edge("A", "B")

    result = bfs(graph, "A")

    # Self-loop should not cause A to be visited twice.
    assert len(result) == 2
    assert len(result) == len(set(result))
    assert set(result) == {"A", "B"}