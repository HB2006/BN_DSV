import pytest

from Data_Structures.graph import Graph


@pytest.fixture
def graph():
    """Provides a fresh graph for each test."""
    return Graph()


def test_initial_state(graph):
    """A newly created graph should have no vertices."""
    assert graph.get_vertices() == []


def test_add_vertex(graph):
    """Test adding a single vertex."""
    graph.add_vertex("A")

    assert "A" in graph.get_vertices()


def test_add_multiple_vertices(graph):
    """Test adding multiple vertices."""
    graph.add_vertex("A")
    graph.add_vertex("B")
    graph.add_vertex("C")

    assert set(graph.get_vertices()) == {"A", "B", "C"}


def test_add_edge(graph):
    """Test adding an edge between two vertices."""
    graph.add_vertex("A")
    graph.add_vertex("B")

    graph.add_edge("A", "B")

    assert "B" in graph.get_neighbors("A")
    assert "A" in graph.get_neighbors("B")


def test_add_edge_without_explicit_vertices(graph):
    """add_edge should create the vertices automatically."""
    graph.add_edge("A", "B")

    assert "A" in graph.get_vertices()
    assert "B" in graph.get_vertices()
    assert "B" in graph.get_neighbors("A")
    assert "A" in graph.get_neighbors("B")


def test_add_multiple_edges(graph):
    """Test a vertex connected to multiple vertices."""
    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("A", "D")

    assert set(graph.get_neighbors("A")) == {"B", "C", "D"}


def test_remove_edge(graph):
    """Test removing an existing edge."""
    graph.add_edge("A", "B")

    graph.remove_edge("A", "B")

    assert "B" not in graph.get_neighbors("A")
    assert "A" not in graph.get_neighbors("B")


def test_remove_non_existing_edge(graph):
    """Removing a non-existing edge should not raise an error."""
    graph.add_edge("A", "B")

    graph.remove_edge("A", "C")

    assert "B" in graph.get_neighbors("A")


def test_remove_vertex(graph):
    """Test removing a vertex and its connections."""
    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("B", "C")

    graph.remove_vertex("A")

    assert "A" not in graph.get_vertices()
    assert "A" not in graph.get_neighbors("B")
    assert "A" not in graph.get_neighbors("C")


def test_remove_vertex_with_multiple_neighbors(graph):
    """Verify all edges connected to a removed vertex are deleted."""
    graph.add_edge("A", "B")
    graph.add_edge("A", "C")
    graph.add_edge("A", "D")

    graph.remove_vertex("A")

    assert "A" not in graph.get_vertices()
    assert "A" not in graph.get_neighbors("B")
    assert "A" not in graph.get_neighbors("C")
    assert "A" not in graph.get_neighbors("D")


def test_remove_non_existing_vertex(graph):
    """Removing a vertex that does not exist should raise ValueError."""
    with pytest.raises(ValueError, match="Vertex does not exist"):
        graph.remove_vertex("A")


def test_get_neighbors(graph):
    """Test retrieving the neighbors of a vertex."""
    graph.add_edge("A", "B")
    graph.add_edge("A", "C")

    assert set(graph.get_neighbors("A")) == {"B", "C"}


def test_get_neighbors_non_existing_vertex(graph):
    """Getting neighbors of a non-existing vertex should raise ValueError."""
    with pytest.raises(ValueError, match="Vertex does not exist"):
        graph.get_neighbors("A")


def test_get_vertices(graph):
    """Test retrieving all vertices."""
    graph.add_vertex("A")
    graph.add_vertex("B")
    graph.add_vertex("C")

    assert set(graph.get_vertices()) == {"A", "B", "C"}


def test_clear(graph):
    """Test clearing the entire graph."""
    graph.add_edge("A", "B")
    graph.add_edge("B", "C")

    graph.clear()

    assert graph.get_vertices() == []


def test_duplicate_vertex(graph):
    """Adding the same vertex twice should not create duplicates."""
    graph.add_vertex("A")
    graph.add_vertex("A")

    assert graph.get_vertices().count("A") == 1


def test_duplicate_edge(graph):
    """Adding the same edge twice should not create duplicate neighbors."""
    graph.add_edge("A", "B")
    graph.add_edge("A", "B")

    assert graph.get_neighbors("A").count("B") == 1
    assert graph.get_neighbors("B").count("A") == 1


def test_self_loop(graph):
    """Test an edge from a vertex to itself."""
    graph.add_edge("A", "A")

    assert "A" in graph.get_vertices()
    assert "A" in graph.get_neighbors("A")