"use client";

import { useState } from "react";
import type { ListNode } from "./type";
import {
  enqueue,
  dequeue,
  peekQueue,
  searchQueue,
  clearQueue,
} from "./queue-operation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Operation =
  | "enqueue"
  | "dequeue"
  | "peek"
  | "search"
  | "traverse"
  | "clear";