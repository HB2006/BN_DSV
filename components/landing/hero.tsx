
"use client";

import { MoveRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export const Hero = () => (
  <section className="relative w-full overflow-hidden py-20 lg:py-40">
    {/* Background dot pattern using CSS */}
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      aria-hidden="true"
      style={{
        backgroundImage:
          "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        maskImage:
          "radial-gradient(800px circle at center, black, transparent)",
        WebkitMaskImage:
          "radial-gradient(800px circle at center, black, transparent)",
      }}
    />

    <div className="container relative mx-auto">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        {/* Hero text */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h1 className="max-w-lg text-left text-5xl font-normal tracking-tighter md:text-7xl">
              Data Structure Visualizer
            </h1>

            <p className="max-w-md text-left text-xl leading-relaxed tracking-tight text-muted-foreground">
              Interactive tool for learning and understanding data structures
              through visual animations and step-by-step operations.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline" className="gap-4">
              <Link
                href="https://github.com/HB2006/BN_DSV"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
                <Github className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild className="gap-4">
              <Link href="/visualizer">
                Visualizer
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Preview image */}
        <div className="relative aspect-video overflow-hidden rounded-lg border">
          <Image
            src="/ds-bst.png"
            alt="Data Structure Visualizer preview"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  </section>
);