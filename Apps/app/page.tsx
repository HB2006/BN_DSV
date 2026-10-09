
import Link from "next/link"
import { BrainCircuit, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-primary/10 p-4">
            <BrainCircuit className="h-12 w-12 text-primary" />
          </div>
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Welcome
        </p>

        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Data Structure Visualizer
        </h1>

        <p className="mx-auto mb-8 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
          Explore data structures through interactive visualizations.
          Understand how they work, perform operations, and learn
          their time and space complexities.
        </p>

        <Link
          href="/visualizers/stack"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="mt-10 text-sm text-muted-foreground">
          More features coming soon.
        </p>
      </div>
    </main>
  )
}