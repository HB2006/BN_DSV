from collections import defaultdict


class Graph:
    def __init__(self):
        self.adjacency_list = defaultdict(set)

    def add_vertex(self, vertex):
        self.adjacency_list[vertex]

    def add_edge(self, vertex1, vertex2):
        self.adjacency_list[vertex1].add(vertex2)
        self.adjacency_list[vertex2].add(vertex1)

    def remove_edge(self, vertex1, vertex2):
        if vertex2 in self.adjacency_list[vertex1]:
            self.adjacency_list[vertex1].remove(vertex2)

        if vertex1 in self.adjacency_list[vertex2]:
            self.adjacency_list[vertex2].remove(vertex1)

    def remove_vertex(self, vertex):
        if vertex not in self.adjacency_list:
            raise ValueError("Vertex does not exist")

        for neighbor in self.adjacency_list[vertex]:
            self.adjacency_list[neighbor].remove(vertex)

        del self.adjacency_list[vertex]

    def get_neighbors(self, vertex):
        if vertex not in self.adjacency_list:
            raise ValueError("Vertex does not exist")

        return list(self.adjacency_list[vertex])

    def get_vertices(self):
        return list(self.adjacency_list.keys())

    def clear(self):
        self.adjacency_list.clear()