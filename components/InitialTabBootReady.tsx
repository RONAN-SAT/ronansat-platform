"use client";

import { useEffect } from "react";

import { clearInitialTabBootPending } from "@/lib/initialTabLoad";

type InitialTabBootReadyProps = {
  when?: boolean;
};

export default function InitialTabBootReady({ when = true }: InitialTabBootReadyProps) {
  useEffect(() => {
    if (!when) {
      return;
    }

    let firstFrameId = 0;
    let secondFrameId = 0;

    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        clearInitialTabBootPending();
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, [when]);

  return null;
}
