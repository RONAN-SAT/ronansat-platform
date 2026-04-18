"use client";

import { useEffect, useLayoutEffect, useState } from "react";

import PrettyLoading from "@/components/PrettyLoading";
import SimpleLoading from "@/components/SimpleLoading";
import { hasSeenInitialTabLoad, isInitialTabBootPending } from "@/lib/initialTabLoad";

export default function AppRouteLoading() {
  const [shouldShowPrettyLoader, setShouldShowPrettyLoader] = useState(true);
  const [showSimpleLoading, setShowSimpleLoading] = useState(false);

  useLayoutEffect(() => {
    setShouldShowPrettyLoader(!hasSeenInitialTabLoad() || isInitialTabBootPending());
  }, []);

  useEffect(() => {
    if (shouldShowPrettyLoader) {
      setShowSimpleLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSimpleLoading(true);
    }, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shouldShowPrettyLoader]);

  if (shouldShowPrettyLoader) {
    return <PrettyLoading />;
  }

  if (showSimpleLoading) {
    return <SimpleLoading showQuote={false} />;
  }

  return null;
}
