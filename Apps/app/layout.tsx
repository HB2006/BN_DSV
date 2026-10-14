import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import "../global.css";

import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/global/theme-provider";
import SidebarWrapper from "@/components/global/sidebar-wrapper";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
  title: "DS Visualizer",
  description: "DS Visualizer is a tool for visualizing data structures",
};

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={nunito.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <SidebarWrapper />

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