OPERATIONS = {
    "stack": {
        "push": {
            "name": "Push",
            "description": "Adds an element to the top of the stack.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Create the new element.",
                "2. Add the element to the top of the stack.",
                "3. Return the updated stack."
            ]
        },

        "pop": {
            "name": "Pop",
            "description": "Removes and returns the top element of the stack.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Check if the stack is empty.",
                "2. Remove the top element.",
                "3. Return the removed element."
            ]
        },

        "peek": {
            "name": "Peek",
            "description": "Returns the top element without removing it.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Check if the stack is empty.",
                "2. Access the top element.",
                "3. Return the element."
            ]
        }
    },

    "queue": {
        "enqueue": {
            "name": "Enqueue",
            "description": "Adds an element to the rear of the queue.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Create the new element.",
                "2. Add the element to the rear of the queue.",
                "3. Return the updated queue."
            ]
        },

        "dequeue": {
            "name": "Dequeue",
            "description": "Removes and returns the front element of the queue.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Check if the queue is empty.",
                "2. Remove the front element.",
                "3. Return the removed element."
            ]
        },

        "peek": {
            "name": "Peek",
            "description": "Returns the front element without removing it.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Check if the queue is empty.",
                "2. Access the front element.",
                "3. Return the element."
            ]
        }
    },

    "linked_list": {
        "insert": {
            "name": "Insert",
            "description": "Adds a new element to the end of the linked list.",
            "time_complexity": "O(n)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Create a new node.",
                "2. If the list is empty, make it the head.",
                "3. Otherwise, traverse to the last node.",
                "4. Link the last node to the new node."
            ]
        },

        "delete": {
            "name": "Delete",
            "description": "Removes the first node containing the specified value.",
            "time_complexity": "O(n)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Check if the list is empty.",
                "2. Check whether the head contains the value.",
                "3. Otherwise, traverse the list.",
                "4. Update the links to remove the node."
            ]
        },

        "search": {
            "name": "Search",
            "description": "Searches the linked list for a specified value.",
            "time_complexity": "O(n)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Start at the head.",
                "2. Compare the current node with the target.",
                "3. Move to the next node.",
                "4. Return true if found, otherwise false."
            ]
        }
    },

    "priority_queue": {
        "enqueue": {
            "name": "Enqueue",
            "description": "Adds an element with a specified priority.",
            "time_complexity": "O(log n)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Create the element with its priority.",
                "2. Insert it into the min-heap.",
                "3. Restore the heap property."
            ]
        },

        "dequeue": {
            "name": "Dequeue",
            "description": "Removes and returns the highest-priority element.",
            "time_complexity": "O(log n)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Check if the priority queue is empty.",
                "2. Remove the root of the heap.",
                "3. Restore the heap property.",
                "4. Return the removed element."
            ]
        },

        "peek": {
            "name": "Peek",
            "description": "Returns the highest-priority element without removing it.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Check if the priority queue is empty.",
                "2. Access the root of the heap.",
                "3. Return the element."
            ]
        }
    },

    "graph": {
        "add_vertex": {
            "name": "Add Vertex",
            "description": "Adds a vertex to the graph.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Create an empty adjacency list for the vertex.",
                "2. Add the vertex to the graph."
            ]
        },

        "add_edge": {
            "name": "Add Edge",
            "description": "Adds an edge between two vertices.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Add vertex 2 to vertex 1's neighbors.",
                "2. Add vertex 1 to vertex 2's neighbors."
            ]
        },

        "remove_edge": {
            "name": "Remove Edge",
            "description": "Removes the edge between two vertices.",
            "time_complexity": "O(1)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Remove vertex 2 from vertex 1's neighbors.",
                "2. Remove vertex 1 from vertex 2's neighbors."
            ]
        },

        "remove_vertex": {
            "name": "Remove Vertex",
            "description": "Removes a vertex and all of its connections.",
            "time_complexity": "O(V + E)",
            "space_complexity": "O(1)",
            "pseudocode": [
                "1. Find the vertex.",
                "2. Remove the vertex from all neighboring vertices.",
                "3. Delete the vertex from the graph."
            ]
        }
    },

    "tree": {
        "insert": {
            "name": "Insert",
            "description": "Adds a node as a child of a specified parent.",
            "time_complexity": "O(n)",
            "space_complexity": "O(n)",
            "pseudocode": [
                "1. Create a new node.",
                "2. Find the specified parent node.",
                "3. Add the new node to the parent's children."
            ]
        },

        "search": {
            "name": "Search",
            "description": "Searches the tree for a specified value.",
            "time_complexity": "O(n)",
            "space_complexity": "O(n)",
            "pseudocode": [
                "1. Start at the root.",
                "2. Compare the current node with the target.",
                "3. Recursively search each child.",
                "4. Return true if the value is found."
            ]
        },

        "preorder": {
            "name": "Preorder Traversal",
            "description": "Visits each node before visiting its children.",
            "time_complexity": "O(n)",
            "space_complexity": "O(n)",
            "pseudocode": [
                "1. Visit the current node.",
                "2. Traverse each child recursively."
            ]
        },

        "postorder": {
            "name": "Postorder Traversal",
            "description": "Visits all children before visiting the current node.",
            "time_complexity": "O(n)",
            "space_complexity": "O(n)",
            "pseudocode": [
                "1. Traverse each child recursively.",
                "2. Visit the current node."
            ]
        }
    },

    "algorithms": {
        "bfs": {
            "name": "Breadth-First Search",
            "description": "Visits vertices level by level using a queue.",
            "time_complexity": "O(V + E)",
            "space_complexity": "O(V)",
            "pseudocode": [
                "1. Add the starting vertex to the queue.",
                "2. Mark the vertex as visited.",
                "3. Remove a vertex from the queue.",
                "4. Visit all unvisited neighbors.",
                "5. Add newly visited neighbors to the queue.",
                "6. Repeat until the queue is empty."
            ]
        },

        "dfs": {
            "name": "Depth-First Search",
            "description": "Explores as far as possible along each branch before backtracking.",
            "time_complexity": "O(V + E)",
            "space_complexity": "O(V)",
            "pseudocode": [
                "1. Add the starting vertex to the stack.",
                "2. Remove the top vertex from the stack.",
                "3. If it has not been visited, mark it visited.",
                "4. Add its unvisited neighbors to the stack.",
                "5. Repeat until the stack is empty."
            ]
        }
    }
}


def get_metadata(category, operation):
    """
    Return metadata for a specific operation.
    """

    if category not in OPERATIONS:
        raise ValueError("Category does not exist")

    if operation not in OPERATIONS[category]:
        raise ValueError("Operation does not exist")

    return OPERATIONS[category][operation]


def get_category_metadata(category):
    """
    Return all operations for a category.
    """

    if category not in OPERATIONS:
        raise ValueError("Category does not exist")

    return OPERATIONS[category]