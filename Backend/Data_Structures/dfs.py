def dfs(graph, start):
    if start not in graph.adjacency_list:
        raise ValueError("Starting vertex does not exist")

    visited = set()
    stack = [start]
    result = []

    while stack:
        current = stack.pop()

        if current in visited:
            continue

        visited.add(current)
        result.append(current)

        for neighbor in graph.adjacency_list[current]:
            if neighbor not in visited:
                stack.append(neighbor)

    return result