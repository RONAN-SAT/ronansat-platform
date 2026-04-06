"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Clock3, Flag, LineChart as LineChartIcon, Users } from "lucide-react";

import ActivityHeatmap from "@/components/ActivityHeatmap";

type ScoreTrendPoint = {
  date: string;
  total: number;
  math: number;
  rw: number;
};

type StrengthItem = {
  subject: string;
  correctRate: number;
};

type ActivitySummary = {
  testsCompleted: number;
  totalTimeSpent: number;
};

type ActivityLogItem = {
  date: string;
  testName: string;
  score: number;
  timeSpent: number;
  status: string;
};

type GoalData = {
  currentScore: number;
  targetScore: number;
};

type ParentDashboardResponse = {
  hasChildren: boolean;
  child: {
    id: string;
    name: string;
    email: string;
  } | null;
  scoreTrend: ScoreTrendPoint[];
  strengths: StrengthItem[];
  activity: ActivitySummary;
  activityLog: ActivityLogItem[];
  goal: GoalData;
  error?: string;
};

type SimpleLineChartSeries = {
  key: "total" | "math" | "rw";
  label: string;
  color: string;
};

const LINE_SERIES: SimpleLineChartSeries[] = [
  { key: "total", label: "Total", color: "#0f172a" },
  { key: "math", label: "Math", color: "#0284c7" },
  { key: "rw", label: "RW", color: "#10b981" },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-3xl bg-slate-200/70" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-3xl bg-slate-200/70" />
        <div className="h-80 rounded-3xl bg-slate-200/70" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="h-72 rounded-3xl bg-slate-200/70" />
        <div className="space-y-6">
          <div className="h-32 rounded-3xl bg-slate-200/70" />
          <div className="h-32 rounded-3xl bg-slate-200/70" />
        </div>
      </div>
      <div className="h-96 rounded-3xl bg-slate-200/70" />
    </div>
  );
}

function buildLinePath(values: number[], width: number, height: number, maxValue: number): string {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    const y = height - (values[0] / maxValue) * height;
    return `M 0 ${y} L ${width} ${y}`;
  }

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function SimpleLineChart({ data }: { data: ScoreTrendPoint[] }) {
  const width = 640;
  const height = 240;
  const chartData = data.length > 0 ? data : [{ date: "No Data", total: 0, math: 0, rw: 0 }];
  const maxValue = Math.max(1600, ...chartData.flatMap((item) => [item.total, item.math, item.rw]), 1);
  const yAxisTicks = [0, 400, 800, 1200, 1600];

  return (
    <div className="h-80 w-full rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
        {LINE_SERIES.map((series) => (
          <div key={series.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
            <span>{series.label}</span>
          </div>
        ))}
      </div>

      <div className="relative h-[calc(100%-2rem)]">
        <svg viewBox={`0 0 ${width} ${height + 32}`} className="h-full w-full">
          {yAxisTicks.map((tick) => {
            const y = height - (tick / maxValue) * height;
            return (
              <g key={tick}>
                <line x1="0" y1={y} x2={width} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
                <text x="0" y={Math.max(12, y - 6)} fontSize="11" fill="#64748b">
                  {tick}
                </text>
              </g>
            );
          })}

          {LINE_SERIES.map((series) => {
            const values = chartData.map((point) => point[series.key]);
            return (
              <path
                key={series.key}
                d={buildLinePath(values, width, height, maxValue)}
                fill="none"
                stroke={series.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {chartData.map((point, index) => {
            const x = chartData.length === 1 ? width / 2 : (index / (chartData.length - 1)) * width;
            return (
              <text key={`${point.date}-${index}`} x={x} y={height + 22} textAnchor="middle" fontSize="11" fill="#64748b">
                {point.date}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function StrengthBars({ data }: { data: StrengthItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        No subject performance data yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
      {data.map((item) => (
        <div key={item.subject}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{item.subject}</span>
            <span className="text-slate-500">{item.correctRate}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${
                item.correctRate >= 80 ? "bg-emerald-500" : item.correctRate >= 60 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${Math.max(4, item.correctRate)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ParentDashboardPage() {
  const [data, setData] = useState<ParentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/parent/dashboard", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json()) as ParentDashboardResponse;

        if (!response.ok) {
          throw new Error(payload.error || "Failed to fetch dashboard");
        }

        if (isMounted) {
          setData(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch dashboard");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const goalProgress = useMemo(() => {
    const current = data?.goal.currentScore ?? 0;
    const target = data?.goal.targetScore ?? 1500;
    return Math.min(100, Math.round((current / target) * 100));
  }, [data]);

  const goalBarClass =
    goalProgress >= 85 ? "bg-emerald-500" : goalProgress >= 65 ? "bg-amber-500" : "bg-sky-500";

  const heatmapResults = useMemo(
    () =>
      (data?.activityLog ?? []).map((item) => ({
        date: item.date,
        createdAt: new Date(item.date),
      })),
    [data]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_35%,_#ffffff_75%)] px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Unable to load the Parent Portal</h1>
          <p className="mt-3 text-slate-600">{error}</p>
          <Link
            href="/auth/parent"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
          >
            Return to Parent Link Page
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!data?.hasChildren) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_40%,_#ffffff_78%)] px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200/70 bg-white/90 p-10 shadow-xl shadow-slate-200/50 backdrop-blur">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Parent Portal</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              You have not linked a child account yet. Link your child&apos;s account to see score trends,
              study activity, and progress toward their SAT target.
            </p>
            <Link
              href="/auth/parent"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              Link a Child Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#ffffff_38%,_#f8fafc_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Parent Portal</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {data.child?.name ? `${data.child.name}'s Progress Dashboard` : "Student Progress Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{data.child?.email}</p>
          </div>
          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:block">
            View-only access for linked child accounts
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Current Score</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.goal.currentScore}</p>
              </div>
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <LineChartIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Tests Completed</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.activity.testsCompleted}</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Time Spent</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{data.activity.totalTimeSpent} min</p>
              </div>
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Score Trend</h2>
              <p className="mt-1 text-sm text-slate-500">Track Total, Math, and Reading & Writing performance over time.</p>
            </div>
            <SimpleLineChart data={data.scoreTrend} />
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Strengths & Weaknesses</h2>
              <p className="mt-1 text-sm text-slate-500">Correct-rate by subject area based on completed questions.</p>
            </div>
            <StrengthBars data={data.strengths} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Activity & Engagement</h2>
                <p className="mt-1 text-sm text-slate-500">Recent study consistency across the last 30 days.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                Last 30 days
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
              <ActivityHeatmap results={heatmapResults} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Time Spent</p>
                  <p className="text-2xl font-bold text-slate-900">{data.activity.totalTimeSpent} minutes</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tests Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{data.activity.testsCompleted}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <Flag className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-500">Goal Tracking</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {data.goal.currentScore} / {data.goal.targetScore}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${goalBarClass}`} style={{ width: `${goalProgress}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-500">{goalProgress}% of target score reached</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Activity Log</h2>
            <p className="mt-1 text-sm text-slate-500">Recent completed practice sessions for your linked child.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="text-left text-sm font-semibold text-slate-600">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Test Name</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Time Spent</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.activityLog.map((item, index) => (
                  <tr key={`${item.date}-${item.testName}-${index}`} className="text-sm text-slate-700">
                    <td className="px-4 py-4">{item.date}</td>
                    <td className="px-4 py-4 font-medium text-slate-900">{item.testName}</td>
                    <td className="px-4 py-4">{item.score}</td>
                    <td className="px-4 py-4">{item.timeSpent} min</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "Excellent"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "On Track"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
