from collections import deque


def bfs(graph, start):
    if start not in graph.adjacency_list:
        raise ValueError("Starting vertex does not exist")

    visited = set()
    queue = deque([start])
    result = []

    visited.add(start)

    while queue:
        current = queue.popleft()
        result.append(current)

        for neighbor in graph.adjacency_list[current]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return result