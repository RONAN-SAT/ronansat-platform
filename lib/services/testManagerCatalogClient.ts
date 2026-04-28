import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";
import type {
  TestManagerCatalogPage,
  TestManagerCatalogSearchScope,
  TestManagerCatalogSortOption,
  TestManagerLockedTestsPayload,
} from "@/types/testManager";

type FetchTestManagerCatalogPageOptions = {
  query?: string;
  searchScope?: TestManagerCatalogSearchScope;
  sort?: TestManagerCatalogSortOption;
  offset?: number;
  limit?: number;
};

export async function fetchTestManagerCatalogPage({
  query = "",
  searchScope = "testTitle",
  sort = "updated_desc",
  offset = 0,
  limit = 20,
}: FetchTestManagerCatalogPageOptions) {
  const params = new URLSearchParams({
    query,
    searchScope,
    sort,
    offset: String(offset),
    limit: String(limit),
  });

  const res = await api.get(`${API_PATHS.TEST_MANAGER_TESTS}?${params.toString()}`);
  return res.data as TestManagerCatalogPage;
}

export async function fetchLockedTestsForManager() {
  const res = await api.get(API_PATHS.TEST_MANAGER_LOCKED_TESTS);
  return res.data as TestManagerLockedTestsPayload;
}

export async function saveLockedTestForManager(testId: string, token: string) {
  const res = await api.put(API_PATHS.TEST_MANAGER_LOCKED_TESTS, { testId, token });
  return res.data as TestManagerLockedTestsPayload;
}

export async function removeLockedTestForManager(testId: string) {
  const params = new URLSearchParams({ testId });
  const res = await api.delete(`${API_PATHS.TEST_MANAGER_LOCKED_TESTS}?${params.toString()}`);
  return res.data as TestManagerLockedTestsPayload;
}
