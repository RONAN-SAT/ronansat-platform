import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AttemptRow = {
  user_id: string;
  score: number | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
};

export const leaderboardService = {
  async getLeaderboard() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const supabase = createSupabaseAdminClient();
    const { data: attempts, error: attemptsError } = await supabase
      .from("test_attempts")
      .select("user_id,score")
      .gte("submitted_at", sevenDaysAgo.toISOString())
      .gt("score", 1450);

    if (attemptsError) {
      throw new Error(attemptsError.message);
    }

    const attemptRows = (attempts ?? []) as AttemptRow[];
    if (attemptRows.length === 0) {
      return [];
    }

    const entriesByUserId = new Map<string, { testsCompleted: number; highestScore: number }>();
    for (const attempt of attemptRows) {
      const score = attempt.score ?? 0;
      const existing = entriesByUserId.get(attempt.user_id);

      if (existing) {
        existing.testsCompleted += 1;
        existing.highestScore = Math.max(existing.highestScore, score);
        continue;
      }

      entriesByUserId.set(attempt.user_id, {
        testsCompleted: 1,
        highestScore: score,
      });
    }

    const userIds = Array.from(entriesByUserId.keys());
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,display_name,username")
      .in("id", userIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    const profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]));

    const hallOfFame = userIds
      .map((userId) => {
        const entry = entriesByUserId.get(userId);
        if (!entry) {
          return null;
        }

        const profile = profileMap.get(userId);
        return {
          _id: userId,
          name: profile?.display_name ?? profile?.username ?? "Student",
          testsCompleted: entry.testsCompleted,
          highestScore: entry.highestScore,
        };
      })
      .filter((entry): entry is { _id: string; name: string; testsCompleted: number; highestScore: number } => Boolean(entry))
      .sort((left, right) => {
        if (right.testsCompleted !== left.testsCompleted) {
          return right.testsCompleted - left.testsCompleted;
        }

        return right.highestScore - left.highestScore;
      })
      .slice(0, 10);

    return hallOfFame;
  },
};
