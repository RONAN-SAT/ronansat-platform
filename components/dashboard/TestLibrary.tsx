"use client";

import { Dispatch, SetStateAction } from "react";
import { BookOpen } from "lucide-react";

import TestCard from "@/components/TestCard";
import TestCardSkeleton from "@/components/TestCardSkeleton";
import type { SortOption, TestListItem, UserResultSummary } from "@/types/testLibrary";

interface TestLibraryProps {
  uniquePeriods: string[];
  selectedPeriod: string;
  setSelectedPeriod: (val: string) => void;
  sortOption: SortOption;
  setSortOption: Dispatch<SetStateAction<SortOption>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  loading: boolean;
  syncing?: boolean;
  filteredTests: TestListItem[];
  totalPages: number;
  userResults: UserResultSummary[];
}

export default function TestLibrary({
  uniquePeriods,
  selectedPeriod,
  setSelectedPeriod,
  sortOption,
  setSortOption,
  page,
  setPage,
  loading,
  syncing = false,
  filteredTests,
  totalPages,
  userResults,
}: TestLibraryProps) {
  return (
    <section>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="w-full flex-shrink-0 md:w-1/4">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 border-b border-slate-100 pb-3 text-lg font-bold text-slate-800">
              Filter by Date
            </h2>
            <div className="flex flex-col gap-2">
              {uniquePeriods.map((period, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedPeriod(period);
                    setPage(1);
                  }}
                  className={`cursor-pointer rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? "border border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                      : "border border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {period === "All" ? "All Tests" : period}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full md:w-3/4">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-transparent sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">Practice Test Library</h2>
              {syncing ? <span className="animate-pulse text-sm text-slate-500">Syncing...</span> : null}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-tests" className="text-sm font-medium text-slate-600">
                Sort by:
              </label>
              <select
                id="sort-tests"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value as SortOption);
                  setPage(1);
                }}
                className="block cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <TestCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">No tests found for this period</h3>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredTests.map((test) => (
                  <TestCard key={test._id} test={test} userResults={userResults} />
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
