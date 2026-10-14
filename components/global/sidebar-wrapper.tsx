"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/global/app-sidebar";

export default function SidebarWrapper() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <AppSidebar />;
}