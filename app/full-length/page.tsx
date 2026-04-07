"use client";

import TestLibrary from "@/components/dashboard/TestLibrary";
import { useFullLengthDashboardController } from "@/components/dashboard/useFullLengthDashboardController";

export default function FullLengthDashboard() {
  const {
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
  } = useFullLengthDashboardController();

  if (status === "loading" && !hasCachedDashboardView) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <TestLibrary
            uniquePeriods={["All", "March 2026", "May 2026"]}
            selectedPeriod="All"
            setSelectedPeriod={() => {}}
            sortOption="newest"
            setSortOption={() => {}}
            page={1}
            setPage={() => {}}
            loading
            filteredTests={[]}
            totalPages={1}
          />
        </main>
      </div>
    );
  }

  if (!session && status !== "loading") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Full-length Practice</h1>
          <p className="mt-2 text-slate-600">Experience the full SAT test to evaluate your strengths, improve timing, and track overall progress.</p>
        </div>

        <TestLibrary
          uniquePeriods={uniquePeriods}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          sortOption={sortOption}
          setSortOption={setSortOption}
          page={page}
          setPage={setPage}
          loading={testsLoading}
          syncing={testsRefreshing}
          filteredTests={filteredTests}
          totalPages={totalPages}
        />
      </main>
    </div>
  );
}
