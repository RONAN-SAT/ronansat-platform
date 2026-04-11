"use client";

import { Medal, Sparkles } from "lucide-react";

interface LeaderboardTableProps {
  leaderboard: Array<{
    _id: string;
    name: string;
    testsCompleted: number;
    highestScore: number;
  }>;
}

export default function LeaderboardTable({ leaderboard }: LeaderboardTableProps) {
  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-yellow-100 p-3">
            <Medal className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Weekly Top Achievers</h2>
            <p className="mt-1 text-sm text-slate-500">Students scoring above 1450 this week.</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
          <Sparkles className="h-4 w-4" />
          Updated weekly
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-slate-800">
              <tr>
                <th className="w-24 px-6 py-4 font-bold">Rank</th>
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 text-center font-bold">Tests Completed</th>
                <th className="px-6 py-4 text-center font-bold">Highest Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center italic text-slate-500">
                    No students have scored above 1450 this week.
                  </td>
                </tr>
              ) : (
                leaderboard.map((student, index) => (
                  <tr key={student._id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-semibold">
                      {index === 0 ? (
                        <span className="text-xl text-yellow-500" title="Top 1">🥇 1</span>
                      ) : index === 1 ? (
                        <span className="text-xl text-slate-400" title="Top 2">🥈 2</span>
                      ) : index === 2 ? (
                        <span className="text-xl text-amber-600" title="Top 3">🥉 3</span>
                      ) : (
                        <span className="ml-1 text-slate-500">#{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">{student.testsCompleted}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{student.highestScore}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
