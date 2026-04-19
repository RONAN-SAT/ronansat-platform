"use client";

import { useLayoutEffect, useState, type CSSProperties } from "react";

type LoadingWindow = Window & {
  __ronanAppLoadingStartedAt?: number;
};

function getSharedAnimationOffset() {
  if (typeof window === "undefined") {
    return "0ms";
  }

  const loadingWindow = window as LoadingWindow;

  if (loadingWindow.__ronanAppLoadingStartedAt === undefined) {
    loadingWindow.__ronanAppLoadingStartedAt = window.performance.now();
    return "0ms";
  }

  return `${-Math.round(window.performance.now() - loadingWindow.__ronanAppLoadingStartedAt)}ms`;
}

export default function PrettyLoading() {
  const [animationStyle, setAnimationStyle] = useState<CSSProperties>(
    () => ({ "--app-loading-animation-offset": "0ms" }) as CSSProperties,
  );

  useLayoutEffect(() => {
    setAnimationStyle({
      "--app-loading-animation-offset": getSharedAnimationOffset(),
    } as CSSProperties);
  }, []);

  return (
    <div
      className="app-loading-scene bg-dot-pattern fixed inset-0 z-[80] overflow-hidden bg-paper-bg px-4 py-5 text-ink-fg sm:px-6 sm:py-10"
      style={animationStyle}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="app-loading-orbit app-loading-orbit-a" />
        <div className="app-loading-orbit app-loading-orbit-b" />
        <div className="app-loading-confetti absolute left-[9%] top-[16%] h-5 w-5 rounded-md border-2 border-ink-fg bg-accent-1" />
        <div className="app-loading-confetti app-loading-confetti-delay-1 absolute right-[10%] top-[14%] h-4 w-4 rounded-full border-2 border-ink-fg bg-accent-2" />
        <div className="app-loading-confetti app-loading-confetti-delay-2 absolute bottom-[16%] left-[12%] h-6 w-6 rotate-12 rounded-full border-2 border-ink-fg bg-primary" />
        <div className="app-loading-confetti app-loading-confetti-delay-3 absolute bottom-[14%] right-[16%] h-5 w-5 -rotate-6 rounded-md border-2 border-ink-fg bg-accent-3" />
      </div>

      <section className="relative mx-auto flex min-h-full w-full max-w-6xl items-center justify-center">
        <div className="flex w-full justify-center">
          <div className="relative flex w-full max-w-[22rem] justify-center px-2 pt-2 sm:max-w-[34rem] sm:px-6 sm:pt-4">
            <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2">
              <div className="app-loading-sticker inline-flex rounded-full border-2 border-ink-fg bg-primary px-4 py-1.5 text-[0.78rem] font-black uppercase tracking-[0.22em] sm:px-5 sm:py-2 sm:text-base">
                Ronan SAT
              </div>
            </div>

            <div className="app-loading-stack relative w-full px-2 pb-3 pt-12 sm:px-6 sm:pb-4 sm:pt-14">
              <div className="app-loading-sheet app-loading-sheet-back absolute inset-x-4 top-4 h-[18.5rem] rounded-[2rem] border-2 border-ink-fg bg-accent-2/20 sm:inset-x-10 sm:h-[28rem]" />
              <div className="app-loading-sheet app-loading-sheet-mid absolute inset-x-2 top-2 h-[18.5rem] rounded-[2rem] border-2 border-ink-fg bg-accent-1/15 sm:inset-x-6 sm:h-[28rem]" />

              <article className="app-loading-card relative overflow-hidden rounded-[2rem] border-2 border-ink-fg bg-surface-white brutal-shadow-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-9 border-r-2 border-dashed border-ink-fg/25 bg-paper-bg/85 sm:w-14" />
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex flex-col justify-evenly sm:left-6">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-ink-fg bg-surface-white sm:h-3.5 sm:w-3.5" />
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-ink-fg bg-surface-white sm:h-3.5 sm:w-3.5" />
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-ink-fg bg-surface-white sm:h-3.5 sm:w-3.5" />
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-ink-fg bg-surface-white sm:h-3.5 sm:w-3.5" />
                </div>

                <div className="absolute -right-2 top-6 h-9 w-4 rounded-r-2xl border-2 border-l-0 border-ink-fg bg-accent-1 sm:top-8 sm:h-14 sm:w-6" />
                <div className="absolute -right-2 top-[4.5rem] h-9 w-4 rounded-r-2xl border-2 border-l-0 border-ink-fg bg-primary sm:top-28 sm:h-14 sm:w-6" />
                <div className="absolute -right-2 top-[7.5rem] h-9 w-4 rounded-r-2xl border-2 border-l-0 border-ink-fg bg-accent-2 sm:top-48 sm:h-14 sm:w-6" />

                <div className="relative z-10 pl-12 pr-3 pt-3 pb-4 sm:pl-20 sm:pr-7 sm:pt-7 sm:pb-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.52rem] font-bold uppercase tracking-[0.18em] text-ink-fg/55 sm:text-[0.68rem] sm:tracking-[0.24em]">
                        Session Setup
                      </p>
                      <h2 className="mt-1.5 font-display text-[1.35rem] font-black uppercase leading-[0.95] sm:mt-2 sm:text-[2rem]">
                        Your next page is taking shape.
                      </h2>
                    </div>
                    <div className="app-loading-note rotate-3 rounded-2xl border-2 border-ink-fg bg-primary px-2 py-1.5 text-right brutal-shadow-sm sm:px-3 sm:py-2">
                      <p className="text-[0.48rem] font-bold uppercase tracking-[0.14em] text-ink-fg/65 sm:text-[0.62rem] sm:tracking-[0.18em]">
                        Focus
                      </p>
                      <p className="font-display text-[1rem] font-black uppercase leading-none sm:text-xl">
                        1600
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                    <div className="app-loading-line app-loading-line-delay-0">
                      <span className="app-loading-line-label bg-accent-1">
                        Words in motion
                      </span>
                    </div>
                    <div className="app-loading-line app-loading-line-delay-1">
                      <span className="app-loading-line-label bg-primary">
                        Collecting Insights
                      </span>
                    </div>
                    <div className="app-loading-line app-loading-line-delay-2">
                      <span className="app-loading-line-label bg-accent-2 text-white">
                        Asking Ronan
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2.5 sm:mt-6 sm:gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="rounded-[1.2rem] border-2 border-ink-fg bg-paper-bg p-3 sm:rounded-[1.5rem] sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[0.52rem] font-bold uppercase tracking-[0.16em] text-ink-fg/60 sm:text-[0.68rem] sm:tracking-[0.2em]">
                          Preparing modules
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center text-[0.52rem] font-bold uppercase tracking-[0.14em] text-ink-fg/62 sm:mt-3 sm:text-[0.62rem] sm:tracking-[0.16em]">
                        <div className="flex gap-1.5">
                          <span className="app-loading-dot bg-accent-1" />
                          <span className="app-loading-dot app-loading-dot-delay-1 bg-primary" />
                          <span className="app-loading-dot app-loading-dot-delay-2 bg-accent-2" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[0.52rem] font-bold uppercase tracking-[0.14em] text-ink-fg/62 sm:mt-5 sm:gap-2 sm:text-[0.66rem] sm:tracking-[0.18em]">
                    <span className="rounded-full border-2 border-ink-fg bg-paper-bg px-2 py-0.5 sm:px-3 sm:py-1">
                      Parents
                    </span>
                    <span className="rounded-full border-2 border-ink-fg bg-paper-bg px-2 py-0.5 sm:px-3 sm:py-1">
                      Students
                    </span>
                    <span className="rounded-full border-2 border-ink-fg bg-paper-bg px-2 py-0.5 sm:px-3 sm:py-1">
                      Teachers
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
