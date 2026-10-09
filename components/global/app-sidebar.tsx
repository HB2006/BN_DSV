
"use client"

import {
  Binary,
  Database,
  BrainCircuit,
  TreePine,
  List,
  SquareChevronLeft,
  SquareStack,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { NavProjects } from "@/components/navigation/nav-projects"

const dataStructures = [
  {
    name: "Stack",
    url: "/visualizers/stack",
    icon: SquareStack,
    description: "LIFO data structure with push and pop operations",
  },
  {
    name: "Queue",
    url: "/visualizers/queue",
    icon: SquareChevronLeft,
    description: "FIFO data structure with enqueue and dequeue operations",
  },
  {
    name: "Linked List",
    url: "/visualizers/linked-list",
    icon: List,
    description: "Linear data structure with elements linked using pointers",
  },
  {
    name: "Binary Search Tree",
    url: "/visualizers/binary-tree",
    icon: Binary,
    description: "Binary search tree with BST properties",
  },
  {
    name: "Graph",
    url: "/visualizers/graph",
    icon: TreePine,
    description: "Graph data structure with vertices and edges",
  },
  {
    name: "Heap",
    url: "/visualizers/priorityQheap",
    icon: Database,
    description: "Binary heap with max-heap and min-heap variants",
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <BrainCircuit className="h-6 w-6" />
          <h1 className="text-sm font-semibold">
            Data Structure Visualizer
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavProjects
          title="Data Structures"
          projects={dataStructures.map((ds) => ({
            name: ds.name,
            url: ds.url,
            icon: ds.icon,
            description: ds.description,
          }))}
        />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}