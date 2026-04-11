"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { getClientCache, setClientCache } from "@/lib/clientCache";
import { fetchDashboardUserResults } from "@/lib/services/dashboardService";
import {
  fetchAllTests,
  filterTestsByPeriod,
  getTestsClientCacheKey,
  getUniqueTestPeriods,
} from "@/lib/services/testLibraryService";
import type {
  CachedTestsPayload,
  SortOption,
  TestListItem,
  UserResultSummary,
} from "@/types/testLibrary";

export function useFullLengthDashboardController() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pageSize = 15;
  const initialTestsCacheRef = useRef<CachedTestsPayload | undefined>(undefined);
  const initialTestsCache = initialTestsCacheRef.current;

  const [hasHydratedClientCache, setHasHydratedClientCache] = useState(false);
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [testsRefreshing, setTestsRefreshing] = useState(false);
  const [userResults, setUserResults] = useState<UserResultSummary[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState("All");

  const hasCachedDashboardView = hasHydratedClientCache && Boolean(initialTestsCache);
  const uniquePeriods = useMemo(() => getUniqueTestPeriods(tests), [tests]);
  const filteredTests = useMemo(() => filterTestsByPeriod(tests, selectedPeriod), [selectedPeriod, tests]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredTests.length / pageSize)), [filteredTests.length, pageSize]);
  const paginatedTests = useMemo(
    () => filteredTests.slice((page - 1) * pageSize, page * pageSize),
    [filteredTests, page, pageSize],
  );

  useEffect(() => {
    const testsCache = getClientCache<CachedTestsPayload>(getTestsClientCacheKey(1, 0, "newest"));

    initialTestsCacheRef.current = testsCache;

    if (testsCache) {
      setTests(testsCache.tests);
      setTestsLoading(false);
    }

    setHasHydratedClientCache(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [router, status]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadUserResults = async () => {
      try {
        const nextResults = await fetchDashboardUserResults();
        setUserResults(nextResults);
      } catch (error) {
        console.error("Failed to fetch user results", error);
      }
    };

    void loadUserResults();
  }, [session]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    let cancelled = false;

    const loadTests = async () => {
      const cacheKey = getTestsClientCacheKey(1, 0, sortOption);
      const cachedTests = getClientCache<CachedTestsPayload>(cacheKey);

      if (cachedTests) {
        setTests(cachedTests.tests);
        setTestsLoading(false);
        setTestsRefreshing(true);
      } else {
        setTestsLoading(true);
        setTestsRefreshing(false);
      }

      try {
        const nextPayload = await fetchAllTests(sortOption);

        if (cancelled) {
          return;
        }

        setTests(nextPayload.tests);
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
  }, [sortOption]);

  return {
    session,
    status,
    hasCachedDashboardView,
    testsLoading,
    testsRefreshing,
    userResults,
    sortOption,
    page,
    totalPages,
    selectedPeriod,
    uniquePeriods,
    filteredTests: paginatedTests,
    setSortOption,
    setPage,
    setSelectedPeriod,
  };
}
