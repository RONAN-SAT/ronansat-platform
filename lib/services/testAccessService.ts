import type { AppSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PUBLIC_EXAM_EDIT_PERMISSION = "edit_public_exams";

type LockedTestRow = {
  test_id: string;
  token: string;
  created_at?: string;
  updated_at?: string;
};

type PublicTestRow = {
  id: string;
  title: string;
  created_at: string;
};

function normalizeToken(token: string) {
  return token.trim();
}

function requirePublicExamEditor(session: AppSession) {
  if (session.user.permissions.includes(PUBLIC_EXAM_EDIT_PERMISSION)) {
    return;
  }

  throw new Error("You do not have permission to manage token locks.");
}

function isMissingLockedTestsTable(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };
  return maybeError.code === "42P01" || maybeError.message?.includes("locked_tests") === true;
}

export const testAccessService = {
  async getLockedTestIds(testIds: string[]) {
    const uniqueTestIds = Array.from(new Set(testIds.filter(Boolean)));

    if (uniqueTestIds.length === 0) {
      return new Set<string>();
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("locked_tests").select("test_id").in("test_id", uniqueTestIds);

    if (error) {
      if (isMissingLockedTestsTable(error)) {
        return new Set<string>();
      }

      throw new Error(error.message);
    }

    return new Set((data ?? []).map((row) => String(row.test_id)));
  },

  async getAccessStatus(testId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("locked_tests").select("test_id").eq("test_id", testId).maybeSingle();

    if (error) {
      if (isMissingLockedTestsTable(error)) {
        return {
          testId,
          requiresToken: false,
        };
      }

      throw new Error(error.message);
    }

    return {
      testId,
      requiresToken: Boolean(data),
    };
  },

  async verifyToken({ testId, token }: { testId: string; token: string }) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("locked_tests")
      .select("test_id, token")
      .eq("test_id", testId)
      .maybeSingle();

    if (error) {
      if (isMissingLockedTestsTable(error)) {
        return {
          testId,
          requiresToken: false,
          unlocked: true,
        };
      }

      throw new Error(error.message);
    }

    if (!data) {
      return {
        testId,
        requiresToken: false,
        unlocked: true,
      };
    }

    const row = data as LockedTestRow;
    const unlocked = normalizeToken(row.token) === normalizeToken(token);

    return {
      testId,
      requiresToken: true,
      unlocked,
    };
  },

  async getAdminLockedTests(session: AppSession) {
    requirePublicExamEditor(session);

    const supabase = createSupabaseAdminClient();
    const [{ data: tests, error: testsError }, { data: locks, error: locksError }] = await Promise.all([
      supabase
        .from("tests")
        .select("id, title, created_at")
        .eq("visibility", "public")
        .eq("status", "published")
        .order("title", { ascending: true }),
      supabase.from("locked_tests").select("test_id, token, created_at, updated_at"),
    ]);

    if (testsError) {
      throw new Error(testsError.message);
    }

    if (locksError) {
      if (isMissingLockedTestsTable(locksError)) {
        return {
          tests: ((tests ?? []) as PublicTestRow[]).map((test) => ({
            testId: test.id,
            title: test.title,
            createdAt: test.created_at,
            requiresToken: false,
            token: "",
          })),
        };
      }

      throw new Error(locksError.message);
    }

    const locksByTestId = new Map((locks ?? []).map((lock) => [String(lock.test_id), lock as LockedTestRow]));

    return {
      tests: ((tests ?? []) as PublicTestRow[]).map((test) => {
        const lock = locksByTestId.get(test.id);

        return {
          testId: test.id,
          title: test.title,
          createdAt: test.created_at,
          requiresToken: Boolean(lock),
          token: lock?.token ?? "",
          lockedAt: lock?.created_at,
          lockUpdatedAt: lock?.updated_at,
        };
      }),
    };
  },

  async upsertAdminLockedTest(session: AppSession, { testId, token }: { testId: string; token: string }) {
    requirePublicExamEditor(session);

    const normalizedToken = normalizeToken(token);
    const supabase = createSupabaseAdminClient();
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("id")
      .eq("id", testId)
      .eq("visibility", "public")
      .eq("status", "published")
      .maybeSingle();

    if (testError) {
      throw new Error(testError.message);
    }

    if (!test) {
      throw new Error("Published public test not found.");
    }

    const { error } = await supabase.from("locked_tests").upsert({
      test_id: testId,
      token: normalizedToken,
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.getAdminLockedTests(session);
  },

  async deleteAdminLockedTest(session: AppSession, testId: string) {
    requirePublicExamEditor(session);

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("locked_tests").delete().eq("test_id", testId);

    if (error) {
      throw new Error(error.message);
    }

    return this.getAdminLockedTests(session);
  },
};
