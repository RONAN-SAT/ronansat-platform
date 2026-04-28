"use client";

import { useCallback, useEffect, useState } from "react";

import CreateQuestionForm, { type TestOption } from "@/components/admin/CreateQuestionForm";
import CreateTestForm from "@/components/admin/CreateTestForm";
import { API_PATHS } from "@/lib/apiPaths";
import api from "@/lib/axios";

type TestsResponse = {
  tests?: TestOption[];
};

export default function TestQuestionManagementPanel() {
  const [tests, setTests] = useState<TestOption[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [testsMessage, setTestsMessage] = useState("");

  const loadTests = useCallback(async () => {
    setIsLoadingTests(true);
    setTestsMessage("");

    try {
      const response = await api.get<TestsResponse>(API_PATHS.TESTS, {
        params: {
          limit: 250,
          sortBy: "title",
          sortOrder: "asc",
        },
      });

      setTests(response.data.tests ?? []);
    } catch {
      setTestsMessage("Could not load existing tests.");
      setTests([]);
    } finally {
      setIsLoadingTests(false);
    }
  }, []);

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  const handleTestCreated = (test: TestOption) => {
    setTests((currentTests) => {
      const existing = currentTests.some((currentTest) => currentTest._id === test._id);
      if (existing) {
        return currentTests;
      }

      return [test, ...currentTests];
    });
    void loadTests();
  };

  return (
    <div className="space-y-6">
      <section className="workbook-panel-muted overflow-hidden">
        <div className="border-b-4 border-ink-fg bg-paper-bg px-5 py-4">
          <h3 className="font-display text-2xl font-black uppercase tracking-tight text-ink-fg">Create a Test Shell</h3>
          <p className="mt-1 text-sm text-ink-fg/70">Create the test first, then use the question importer below to fill it.</p>
        </div>

        <CreateTestForm embedded onCreated={handleTestCreated} />
      </section>

      <section className="workbook-panel overflow-visible">
        {isLoadingTests ? (
          <div className="border-b-4 border-ink-fg bg-paper-bg px-5 py-4 text-sm font-bold text-ink-fg/70">Loading tests...</div>
        ) : null}

        {testsMessage ? (
          <div className="border-b-4 border-ink-fg bg-accent-3 px-5 py-4 text-sm font-bold text-white">{testsMessage}</div>
        ) : null}

        <CreateQuestionForm tests={tests} embedded />
      </section>
    </div>
  );
}
