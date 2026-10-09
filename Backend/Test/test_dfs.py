import pytest

from Data_Structures.graph import Graph
from Data_Structures.dfs import dfs


def test_dfs_single_vertex():
    graph = Graph()
    graph.add_vertex("A")

    assert dfs(graph, "A") == ["A"]


def test_dfs_simple_graph():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("B", "D")

    result = dfs(graph, "A")

    # A must always be visited first.
    assert result[0] == "A"

    # B and C are reachable from A.
    assert set(result) == {"A", "B", "C", "D"}

    # Every vertex is visited exactly once.
    assert len(result) == len(set(result))


def test_dfs_visits_all_reachable_vertices():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("B", "D")
    graph.add_edge("C", "E")
    graph.add_edge("D", "F")

    result = dfs(graph, "A")

    assert result[0] == "A"
    assert set(result) == {"A", "B", "C", "D", "E", "F"}
    assert len(result) == 6
    assert len(result) == len(set(result))


def test_dfs_disconnected_graph():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("B", "C")

    graph.add_edge("X", "Y")

    result = dfs(graph, "A")

    # DFS should only visit vertices reachable from A.
    assert set(result) == {"A", "B", "C"}

    assert "X" not in result
    assert "Y" not in result


def test_dfs_from_different_start_vertex():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("B", "C")
    graph.add_edge("C", "D")

    result = dfs(graph, "C")

    # All vertices reachable from C should be visited.
    assert result[0] == "C"
    assert set(result) == {"A", "B", "C", "D"}
    assert len(result) == 4


def test_dfs_invalid_start_vertex():
    graph = Graph()

    graph.add_edge("A", "B")

    with pytest.raises(
        ValueError,
        match="Starting vertex does not exist"
    ):
        dfs(graph, "X")


def test_dfs_empty_graph():
    graph = Graph()

    with pytest.raises(
        ValueError,
        match="Starting vertex does not exist"
    ):
        dfs(graph, "A")


def test_dfs_cycle():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("B", "C")
    graph.add_edge("C", "A")

    result = dfs(graph, "A")

    # DFS should not get stuck in the cycle.
    assert set(result) == {"A", "B", "C"}
    assert len(result) == 3
    assert len(result) == len(set(result))


def test_dfs_graph_with_self_loop():
    graph = Graph()

    graph.add_edge("A", "A")
    graph.add_edge("A", "B")

    result = dfs(graph, "A")

    # Self-loop should not cause A to be visited twice.
    assert set(result) == {"A", "B"}
    assert len(result) == 2
    assert len(result) == len(set(result))


def test_dfs_visits_each_vertex_once():
    graph = Graph()

    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("B", "C")
    graph.add_edge("B", "D")
    graph.add_edge("C", "D")

    result = dfs(graph, "A")

    assert len(result) == len(set(result))
    assert set(result) == {"A", "B", "C", "D"}