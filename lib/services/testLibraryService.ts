import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";
import type { CachedTestsPayload, SortOption, TestListItem } from "@/types/testLibrary";

const MONTH_INDEX: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export function getTestsQueryParams(sortOption: SortOption) {
  let sortBy = "createdAt";
  let sortOrder = "desc";

  if (sortOption === "oldest") {
    sortOrder = "asc";
  } else if (sortOption === "title_asc") {
    sortBy = "title";
    sortOrder = "asc";
  } else if (sortOption === "title_desc") {
    sortBy = "title";
    sortOrder = "desc";
  }

  return { sortBy, sortOrder };
}

export function getTestsClientCacheKey(page: number, limit: number, sortOption: SortOption) {
  const { sortBy, sortOrder } = getTestsQueryParams(sortOption);
  return `tests:${page}:${limit}:${sortBy}:${sortOrder}`;
}

export function getTestPeriodLabel(title: string) {
  const parts = title.split(" ");
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }

  return "Other";
}

function getPeriodSortValue(period: string) {
  if (period === "Other") {
    return -1;
  }

  const [monthLabel, yearLabel] = period.split(" ");
  const month = MONTH_INDEX[monthLabel?.toLowerCase?.() ?? ""] ?? 0;
  const year = Number.parseInt(yearLabel ?? "", 10);

  if (!Number.isFinite(year)) {
    return -1;
  }

  return year * 100 + month;
}

export function sortPeriods(periods: string[]) {
  return [...periods].sort((left, right) => {
    const diff = getPeriodSortValue(right) - getPeriodSortValue(left);
    if (diff !== 0) {
      return diff;
    }

    return left.localeCompare(right);
  });
}

export function getUniqueTestPeriods(tests: TestListItem[]) {
  return ["All", ...sortPeriods(Array.from(new Set(tests.map((test) => getTestPeriodLabel(test.title)))))];
}

function compareByPeriod(left: TestListItem, right: TestListItem, direction: "asc" | "desc") {
  const leftValue = getPeriodSortValue(getTestPeriodLabel(left.title));
  const rightValue = getPeriodSortValue(getTestPeriodLabel(right.title));
  const diff = direction === "desc" ? rightValue - leftValue : leftValue - rightValue;

  if (diff !== 0) {
    return diff;
  }

  return left.title.localeCompare(right.title);
}

export function sortTests(tests: TestListItem[], sortOption: SortOption) {
  const nextTests = [...tests];

  if (sortOption === "newest") {
    return nextTests.sort((left, right) => compareByPeriod(left, right, "desc"));
  }

  if (sortOption === "oldest") {
    return nextTests.sort((left, right) => compareByPeriod(left, right, "asc"));
  }

  if (sortOption === "title_asc") {
    return nextTests.sort((left, right) => left.title.localeCompare(right.title));
  }

  if (sortOption === "title_desc") {
    return nextTests.sort((left, right) => right.title.localeCompare(left.title));
  }

  return nextTests;
}

export function filterTestsByPeriod(tests: TestListItem[], selectedPeriod: string) {
  return tests.filter((test) => {
    if (selectedPeriod === "All") {
      return true;
    }

    if (selectedPeriod === "Other") {
      return test.title.split(" ").length < 2;
    }

    return test.title.startsWith(selectedPeriod);
  });
}

export function filterSectionalTestsBySubject(tests: TestListItem[], subjectFilter: "reading" | "math") {
  return tests.filter((test) => {
    if (!Array.isArray(test.sections)) {
      return false;
    }

    const targetSectionName = subjectFilter === "reading" ? "Reading and Writing" : "Math";
    const section = test.sections.find((item) => item.name === targetSectionName);
    if (!section) {
      return false;
    }

    if (test.questionCounts) {
      if (subjectFilter === "reading") {
        return (test.questionCounts.rw_1 ?? 0) > 0 || (test.questionCounts.rw_2 ?? 0) > 0;
      }

      return (test.questionCounts.math_1 ?? 0) > 0 || (test.questionCounts.math_2 ?? 0) > 0;
    }

    return (section.questionsCount ?? 0) > 0;
  });
}

export async function fetchTestsPage(page: number, limit: number, sortOption: SortOption): Promise<CachedTestsPayload> {
  const { sortBy, sortOrder } = getTestsQueryParams(sortOption);
  const res = await api.get(`${API_PATHS.TESTS}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`);

  return {
    tests: sortTests((res.data.tests || []) as TestListItem[], sortOption),
    totalPages: (res.data.pagination?.totalPages || 1) as number,
  };
}

export async function fetchAllTests(sortOption: SortOption): Promise<CachedTestsPayload> {
  const { sortBy, sortOrder } = getTestsQueryParams(sortOption);
  const res = await api.get(`${API_PATHS.TESTS}?page=1&limit=0&sortBy=${sortBy}&sortOrder=${sortOrder}`);

  return {
    tests: sortTests((res.data.tests || []) as TestListItem[], sortOption),
    totalPages: 1,
  };
}
