"use client";

import { useSyncExternalStore } from "react";

import PrettyLoading from "@/components/PrettyLoading";
import SimpleLoading from "@/components/SimpleLoading";
import {
  INITIAL_TAB_BOOT_CHANGE_EVENT,
  isInitialTabBootPending,
  isInitialTabPreloadReady,
} from "@/lib/initialTabLoad";

type LoadingProps = {
  showQuote?: boolean;
};

function subscribeToInitialTabLoad(callback: () => void) {
  window.addEventListener(INITIAL_TAB_BOOT_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener(INITIAL_TAB_BOOT_CHANGE_EVENT, callback);
  };
}

function getInitialTabLoadSnapshot() {
  return isInitialTabBootPending() || !isInitialTabPreloadReady();
}

export default function Loading({ showQuote = false }: LoadingProps) {
  const shouldShowPrettyLoading = useSyncExternalStore(
    subscribeToInitialTabLoad,
    getInitialTabLoadSnapshot,
    () => true,
  );

  if (shouldShowPrettyLoading) {
    return <PrettyLoading />;
  }

  return <SimpleLoading showQuote={showQuote} />;
}
