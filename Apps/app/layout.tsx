
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../global.css";

import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/global/theme-provider";
import { AppSidebar } from "@/components/global/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DS Visualizer",
  description: "DS Visualizer is a tool for visualizing data structures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Breadcrumbs />
              <main className="flex-1 p-3 sm:p-10">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
