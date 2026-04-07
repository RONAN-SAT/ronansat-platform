"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { getClientCache, setClientCache } from "@/lib/clientCache";
import {
  fetchTestsPage,
  filterTestsByPeriod,
  getTestsClientCacheKey,
  getUniqueTestPeriods,
} from "@/lib/services/testLibraryService";
import type {
  CachedTestsPayload,
  SortOption,
  TestListItem,
} from "@/types/testLibrary";

export function useFullLengthDashboardController() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const limit = 6;
  const initialTestsCacheRef = useRef<CachedTestsPayload | undefined>(undefined);
  const initialTestsCache = initialTestsCacheRef.current;

  const [hasHydratedClientCache, setHasHydratedClientCache] = useState(false);
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [testsRefreshing, setTestsRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState("All");

  const hasCachedDashboardView = hasHydratedClientCache && Boolean(initialTestsCache);
  const uniquePeriods = useMemo(() => getUniqueTestPeriods(tests), [tests]);
  const filteredTests = useMemo(() => filterTestsByPeriod(tests, selectedPeriod), [selectedPeriod, tests]);

  useEffect(() => {
    const testsCache = getClientCache<CachedTestsPayload>(getTestsClientCacheKey(1, limit, "newest"));

    initialTestsCacheRef.current = testsCache;

    if (testsCache) {
      setTests(testsCache.tests);
      setTotalPages(testsCache.totalPages);
      setTestsLoading(false);
    }

    setHasHydratedClientCache(true);
  }, [limit]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [router, status]);

  useEffect(() => {
    let cancelled = false;

    const loadTests = async () => {
      const cacheKey = getTestsClientCacheKey(page, limit, sortOption);
      const cachedTests = getClientCache<CachedTestsPayload>(cacheKey);

      if (cachedTests) {
        setTests(cachedTests.tests);
        setTotalPages(cachedTests.totalPages);
        setTestsLoading(false);
        setTestsRefreshing(true);
      } else {
        setTestsLoading(true);
        setTestsRefreshing(false);
      }

      try {
        const nextPayload = await fetchTestsPage(page, limit, sortOption);

        if (cancelled) {
          return;
        }

        setTests(nextPayload.tests);
        setTotalPages(nextPayload.totalPages);
        setClientCache(cacheKey, nextPayload);
      } catch (error) {
        console.error("Failed to fetch tests", error);
      } finally {
        if (!cancelled) {
          setTestsLoading(false);
          setTestsRefreshing(false);
        }
      }
    };

    void loadTests();

    return () => {
      cancelled = true;
    };
  }, [limit, page, sortOption]);

  return {
    session,
    status,
    hasCachedDashboardView,
    testsLoading,
    testsRefreshing,
    sortOption,
    page,
    totalPages,
    selectedPeriod,
    uniquePeriods,
    filteredTests,
    setSortOption,
    setPage,
    setSelectedPeriod,
  };
}
