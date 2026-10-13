import { BrainCircuit, ArrowLeft } from "lucide-react";

export default function VisualizerHomePage() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <BrainCircuit className="h-9 w-9 text-primary" />
      </div>

      <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome to DS Visualizer
      </h1>

      <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
        Choose the data structure you want to learn about from the navigation
        bar. Explore its operations, understand how it works, and watch
        algorithms come to life through interactive visualizations.
      </p>

      <p className="mt-6 text-sm text-muted-foreground">
        Select a data structure from the sidebar to get started.
      </p>
    </div>
  );
<<<<<<< HEAD
}
=======
}


>>>>>>> f9472cbf1c19b0463644e105f74decb715593748
