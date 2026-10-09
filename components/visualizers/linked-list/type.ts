export interface ListNode {
    id: number;
    value: number;
  }
  
  export type ListOperation =
    | "insert-head"
    | "insert-tail"
    | "insert-position"
    | "delete-value"
    | "search"
    | "traverse";