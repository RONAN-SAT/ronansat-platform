import { createHash } from "node:crypto";

import { MongoClient } from "mongodb";

import { createSupabaseAdminClient } from "../../../lib/supabase/admin";

type MongoUser = {
  _id: { toString(): string };
  email?: string;
  name?: string;
  username?: string;
  birthDate?: string;
  role?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeRole(role: string | undefined) {
  if (role?.trim().toUpperCase() === "ADMIN") {
    return "admin";
  }

  if (role?.trim().toUpperCase() === "TEACHER") {
    return "teacher";
  }

  return "student";
}

function normalizeBirthDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function buildTemporaryPassword(email: string, legacyUserId: string) {
  const hash = createHash("sha256").update(`${email}:${legacyUserId}`).digest("hex").slice(0, 16);
  return `Tmp-${hash}-Aa1!`;
}

async function main() {
  const mongoUri = getRequiredEnv("MONGODB_URI");
  const mongoClient = new MongoClient(mongoUri);
  const supabase = createSupabaseAdminClient();

  await mongoClient.connect();

  try {
    const users = (await mongoClient
      .db()
      .collection("users")
      .find({}, { projection: { email: 1, name: 1, username: 1, birthDate: 1, role: 1 } })
      .toArray()) as MongoUser[];

    const { data: roleRows, error: roleError } = await supabase.from("roles").select("id,code");
    if (roleError || !roleRows) {
      throw new Error(`Failed to load role ids: ${roleError?.message ?? "unknown error"}`);
    }

    const roleMap = new Map(roleRows.map((role) => [role.code, role.id]));
    const listResponse = await supabase.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (listResponse.error) {
      throw new Error(`Failed to list existing auth users: ${listResponse.error.message}`);
    }

    const authUsersByEmail = new Map(
      listResponse.data.users
        .filter((user) => typeof user.email === "string" && user.email.length > 0)
        .map((user) => [user.email!.toLowerCase(), user])
    );

    let createdCount = 0;
    let updatedCount = 0;

    for (const user of users) {
      const email = user.email?.trim().toLowerCase();
      if (!email) {
        console.warn(`Skipping user ${user._id.toString()} because email is missing.`);
        continue;
      }

      const legacyUserId = user._id.toString();
      let authUser = authUsersByEmail.get(email) ?? null;

      if (!authUser) {
        const createResponse = await supabase.auth.admin.createUser({
          email,
          password: buildTemporaryPassword(email, legacyUserId),
          email_confirm: true,
          user_metadata: {
            legacy_mongo_id: legacyUserId,
          },
        });

        if (createResponse.error || !createResponse.data.user) {
          throw new Error(`Failed to create auth user for ${email}: ${createResponse.error?.message ?? "unknown error"}`);
        }

        authUser = createResponse.data.user;
        authUsersByEmail.set(email, authUser);
        createdCount += 1;
      } else {
        updatedCount += 1;
      }

      const targetRole = normalizeRole(user.role);
      const targetRoleId = roleMap.get(targetRole);
      if (!targetRoleId) {
        throw new Error(`Missing seeded role ${targetRole}`);
      }

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: authUser.id,
          legacy_mongo_id: legacyUserId,
          username: user.username?.trim().toLowerCase() || null,
          display_name: user.name?.trim() || null,
          birth_date: normalizeBirthDate(user.birthDate),
        },
        { onConflict: "id" }
      );

      if (profileError) {
        throw new Error(`Failed to upsert profile for ${email}: ${profileError.message}`);
      }

      const { error: deleteRoleError } = await supabase.from("user_roles").delete().eq("user_id", authUser.id);
      if (deleteRoleError) {
        throw new Error(`Failed to reset roles for ${email}: ${deleteRoleError.message}`);
      }

      const { error: roleAssignError } = await supabase.from("user_roles").insert({
        user_id: authUser.id,
        role_id: targetRoleId,
      });

      if (roleAssignError) {
        throw new Error(`Failed to assign role for ${email}: ${roleAssignError.message}`);
      }
    }

    console.log(`Created ${createdCount} auth users and refreshed ${createdCount + updatedCount} profiles/roles.`);
  } finally {
    await mongoClient.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
