export default function VisualizersPage() {
  return (
    <div className="valley-scene">
      {/* Title + welcome message at the top of the page */}
      <div className="relative z-10 mx-auto max-w-xl px-6 pt-10 text-center">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          DSA Visualizers
        </h1>

        <h2 className="mt-8 text-2xl font-bold text-white">
          Hey, fellow ninja! 👋
        </h2>
        <p className="mt-3 leading-7 text-white/80">
          Ready to master Data Structures and Algorithms? Choose a data
          structure from the sidebar and let&apos;s start exploring!
        </p>
        <p className="mt-3 text-sm font-semibold text-white/60">
          Your Binary Ninjas team
        </p>
      </div>

      {/* Valley + floating items, pinned to the bottom of the page */}
      <div className="valley-stage">
        <svg
          className="valley-hills"
          viewBox="0 0 1280 372"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,55 L130,55 C230,55 250,170 330,190 C430,210 470,300 560,330 C620,350 660,350 720,335 C800,315 840,240 880,200 C940,150 1000,160 1030,120 C1060,75 1110,55 1180,55 L1280,55 L1280,372 L0,372 Z"
            fill="hsl(var(--primary))"
          />
        </svg>

        <span
          className="valley-item float-a"
          style={{ left: "19%", top: "20%", fontSize: "clamp(2rem,5vw,3.5rem)" }}
          role="img"
          aria-label="Treasure"
        >
          🧰
        </span>

        <span
          className="valley-item float-b"
          style={{ left: "32%", top: "14%", fontSize: "clamp(1.5rem,3.5vw,2.5rem)" }}
          role="img"
          aria-label="Tree"
        >
          🌳
        </span>

        <span
          className="valley-item float-c"
          style={{ left: "27%", top: "42%", fontSize: "clamp(1.25rem,3vw,2rem)" }}
          role="img"
          aria-label="Link"
        >
          🔗
        </span>

        <span
          className="valley-item float-b"
          style={{ left: "62%", top: "32%", fontSize: "clamp(1.5rem,3.5vw,2.5rem)" }}
          role="img"
          aria-label="Streak"
        >
          🔥
        </span>

        <span
          className="valley-item float-a"
          style={{ left: "71%", top: "12%", fontSize: "clamp(2rem,5vw,3.5rem)" }}
          role="img"
          aria-label="Strength"
        >
          🏋️
        </span>

        <span
          className="valley-item float-c"
          style={{ left: "70%", top: "46%", fontSize: "clamp(2rem,4.5vw,3.25rem)" }}
          role="img"
          aria-label="Done"
        >
          ✅
        </span>

        {/* Mascot */}
        <div className="valley-mascot">
          <span className="flame flame-left" aria-hidden="true">🔥</span>

          <div className="flex items-end gap-1">
            <span
              className="ninja-pop mascot-bob text-6xl sm:text-8xl"
              role="img"
              aria-label="Binary Ninja"
            >
              🥷
            </span>
            <span
              className="ninja-pop ninja-pop-delay mascot-bob mascot-bob-delay text-6xl sm:text-8xl"
              role="img"
              aria-label="Binary Ninja"
            >
              🥷
            </span>
          </div>

          <span className="flame flame-right" aria-hidden="true">🔥</span>

          <div className="mascot-shadow" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}