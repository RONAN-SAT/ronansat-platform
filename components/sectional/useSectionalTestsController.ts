"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";

import { getClientCache, setClientCache } from "@/lib/clientCache";
import { fetchDashboardUserResults } from "@/lib/services/dashboardService";
import {
  fetchAllTests,
  filterSectionalTestsBySubject,
  filterTestsByPeriod,
  getTestsClientCacheKey,
  getUniqueTestPeriods,
} from "@/lib/services/testLibraryService";
import type { CachedTestsPayload, SortOption, TestListItem, UserResultSummary } from "@/types/testLibrary";

export function useSectionalTestsController() {
  const { data: session, status } = useSession();
  const pageSize = 15;
  const initialTestsCacheRef = useRef<CachedTestsPayload | undefined>(undefined);
  const [hasHydratedClientCache, setHasHydratedClientCache] = useState(false);
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testsRefreshing, setTestsRefreshing] = useState(false);
  const [userResults, setUserResults] = useState<UserResultSummary[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState<"reading" | "math">("reading");

  const hasCachedSectionalView = hasHydratedClientCache && Boolean(initialTestsCacheRef.current);

  useEffect(() => {
    const cachedTests = getClientCache<CachedTestsPayload>(getTestsClientCacheKey(1, 0, "newest"));
    initialTestsCacheRef.current = cachedTests;

    if (cachedTests) {
      setTests(cachedTests.tests);
      setLoading(false);
    }

    setHasHydratedClientCache(true);
  }, []);

  useEffect(() => {
    setSelectedPeriod("All");
    setPage(1);
  }, [subjectFilter]);

  const testsWithSubject = useMemo(
    () => filterSectionalTestsBySubject(tests, subjectFilter),
    [subjectFilter, tests],
  );
  const uniquePeriods = useMemo(() => getUniqueTestPeriods(testsWithSubject), [testsWithSubject]);
  const filteredTests = useMemo(
    () => filterTestsByPeriod(testsWithSubject, selectedPeriod),
    [selectedPeriod, testsWithSubject],
  );
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredTests.length / pageSize)), [filteredTests.length, pageSize]);
  const paginatedTests = useMemo(
    () => filteredTests.slice((page - 1) * pageSize, page * pageSize),
    [filteredTests, page, pageSize],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadUserResults = async () => {
      try {
        const nextResults = await fetchDashboardUserResults();
        setUserResults(nextResults);
      } catch (error) {
        console.error("Failed to load results", error);
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
    if (!hasHydratedClientCache) {
      return;
    }

    let cancelled = false;

    const loadTests = async () => {
      const cacheKey = getTestsClientCacheKey(1, 0, sortOption);
      const cachedTests = getClientCache<CachedTestsPayload>(cacheKey);

      if (cachedTests) {
        setTests(cachedTests.tests);
        setLoading(false);
        setTestsRefreshing(true);
      } else {
        setLoading(true);
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
          setLoading(false);
          setTestsRefreshing(false);
        }
      }
    };

    void loadTests();

    return () => {
      cancelled = true;
    };
  }, [hasHydratedClientCache, sortOption]);

  return {
    status,
    hasCachedSectionalView,
    loading,
    testsRefreshing,
    userResults,
    sortOption,
    page,
    totalPages,
    selectedPeriod,
    subjectFilter,
    uniquePeriods,
    filteredTests: paginatedTests,
    setSortOption,
    setPage,
    setSelectedPeriod,
    setSubjectFilter,
  };
}
