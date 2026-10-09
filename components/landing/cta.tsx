
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";

export const CTA = () => (
  <section className="w-full py-20 lg:py-40">
    <div className="container mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-muted/50 to-muted p-8 sm:p-12 lg:p-16">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse at center, black, transparent 85%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black, transparent 85%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-5xl">
            Ready to Start Learning?
          </h2>

          <p className="max-w-2xl text-xl text-muted-foreground">
            Explore data structures through interactive visualizations and
            hands-on examples.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild className="gap-3">
              <Link href="/visualizers">
                Start Exploring
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Decorative gradient effects */}
        <div
          className="pointer-events-none absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-1/4 -right-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-secondary/20 to-primary/20 blur-3xl"
          aria-hidden="true"
        />
      </div>
    </div>
  </section>
);