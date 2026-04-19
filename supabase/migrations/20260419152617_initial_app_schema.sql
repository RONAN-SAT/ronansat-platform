create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'teacher', 'admin');
create type public.membership_type as enum ('student');
create type public.exam_visibility as enum ('public', 'private');
create type public.exam_status as enum ('draft', 'published', 'archived');
create type public.question_type as enum ('multiple_choice', 'spr');
create type public.question_difficulty as enum ('easy', 'medium', 'hard');
create type public.attempt_mode as enum ('full', 'sectional');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_mongo_id text unique,
  username text,
  display_name text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_username_lower_unique on public.profiles (lower(username)) where username is not null;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.app_role not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.teacher_groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_memberships (
  group_id uuid not null references public.teacher_groups(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  membership_type public.membership_type not null default 'student',
  created_at timestamptz not null default now(),
  primary key (group_id, student_user_id)
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  title text not null,
  difficulty text,
  time_limit_minutes integer not null check (time_limit_minutes > 0),
  visibility public.exam_visibility not null default 'public',
  status public.exam_status not null default 'published',
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.test_sections (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  name text not null,
  module_number integer,
  display_order integer not null check (display_order > 0),
  question_count integer not null default 0 check (question_count >= 0),
  time_limit_minutes integer not null check (time_limit_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (test_id, display_order),
  unique (test_id, name, module_number)
);

create table public.test_group_assignments (
  test_id uuid not null references public.tests(id) on delete cascade,
  group_id uuid not null references public.teacher_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (test_id, group_id)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  section_id uuid not null references public.test_sections(id) on delete cascade,
  position integer not null check (position > 0),
  question_type public.question_type not null,
  question_text text not null,
  passage text,
  explanation text not null,
  difficulty public.question_difficulty not null default 'medium',
  points integer not null default 10 check (points >= 0),
  domain text,
  skill text,
  image_url text,
  extra jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_id, position)
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_code text not null,
  option_text text not null,
  display_order integer not null check (display_order > 0),
  created_at timestamptz not null default now(),
  unique (question_id, option_code),
  unique (question_id, display_order),
  unique (question_id, id)
);

create table public.question_correct_options (
  question_id uuid primary key references public.questions(id) on delete cascade,
  option_id uuid not null unique,
  created_at timestamptz not null default now(),
  foreign key (question_id, option_id) references public.question_options(question_id, id) on delete cascade
);

create table public.question_spr_accepted_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  accepted_answer text not null,
  display_order integer not null check (display_order > 0),
  created_at timestamptz not null default now(),
  unique (question_id, accepted_answer),
  unique (question_id, display_order)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  legacy_mongo_id text unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_id uuid not null references public.tests(id) on delete restrict,
  mode public.attempt_mode not null default 'full',
  section_id uuid references public.test_sections(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  score integer,
  total_score integer,
  reading_score integer,
  math_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index test_attempts_user_submitted_at_idx on public.test_attempts (user_id, submitted_at desc);
create index test_attempts_test_submitted_at_idx on public.test_attempts (test_id, submitted_at desc);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option_id uuid,
  text_answer text,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id),
  unique (question_id, id),
  foreign key (question_id, selected_option_id) references public.question_options(question_id, id) on delete restrict,
  check (selected_option_id is null or text_answer is null)
);

create index attempt_answers_attempt_idx on public.attempt_answers (attempt_id);
create index attempt_answers_question_idx on public.attempt_answers (question_id);

create table public.user_review_reasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  color text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, label)
);

create table public.attempt_answer_reasons (
  attempt_answer_id uuid primary key references public.attempt_answers(id) on delete cascade,
  review_reason_id uuid not null references public.user_review_reasons(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  testing_room_theme text not null default 'ronan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak_days integer not null default 0 check (current_streak_days >= 0),
  longest_streak_days integer not null default 0 check (longest_streak_days >= 0),
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vocab_columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  color_key text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title)
);

create table public.vocab_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_question_id uuid references public.questions(id) on delete set null,
  term text not null,
  definition text not null,
  audio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vocab_card_positions (
  card_id uuid primary key references public.vocab_cards(id) on delete cascade,
  column_id uuid references public.vocab_columns(id) on delete cascade,
  is_inbox boolean not null default true,
  position_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.code = 'admin'
    ) then 'admin'::public.app_role
    when exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid() and r.code = 'teacher'
    ) then 'teacher'::public.app_role
    else 'student'::public.app_role
  end;
$$;

create or replace function public.has_app_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and p.code = permission_code
  );
$$;

create or replace function public.can_manage_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    public.current_app_role() = 'admin'
    or exists (
      select 1
      from public.teacher_groups g
      where g.id = target_group_id
        and g.owner_user_id = auth.uid()
    )
  );
$$;

create or replace function public.can_read_test(target_test_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.tests t
    where t.id = target_test_id
      and (
        public.current_app_role() = 'admin'
        or (t.visibility = 'public' and t.status = 'published')
        or t.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.test_group_assignments tga
          join public.group_memberships gm on gm.group_id = tga.group_id
          where tga.test_id = t.id
            and gm.student_user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.can_edit_test(target_test_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.tests t
    where t.id = target_test_id
      and (
        public.current_app_role() = 'admin'
        or (
          t.owner_user_id = auth.uid()
          and t.visibility = 'private'
          and public.has_app_permission('edit_private_exams')
        )
      )
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_role_id uuid;
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  select id into student_role_id
  from public.roles
  where code = 'student';

  if student_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, student_role_id)
    on conflict do nothing;
  end if;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.enforce_group_owner_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = new.owner_user_id
      and r.code in ('teacher', 'admin')
  ) then
    raise exception 'Group owners must be teachers or admins';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_group_membership_student()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = new.student_user_id
      and r.code = 'student'
  ) then
    raise exception 'Group memberships only support student members';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_question_answer_key_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_type public.question_type;
begin
  select q.question_type into target_type
  from public.questions q
  where q.id = new.question_id;

  if target_type <> 'multiple_choice' then
    raise exception 'Only multiple_choice questions may store correct options';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_question_spr_answer_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_type public.question_type;
begin
  select q.question_type into target_type
  from public.questions q
  where q.id = new.question_id;

  if target_type <> 'spr' then
    raise exception 'Only spr questions may store accepted answers';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_attempt_answer_shape()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_type public.question_type;
begin
  select q.question_type into target_type
  from public.questions q
  where q.id = new.question_id;

  if target_type = 'multiple_choice' and new.text_answer is not null then
    raise exception 'Multiple choice answers may not store text_answer';
  end if;

  if target_type = 'spr' and new.selected_option_id is not null then
    raise exception 'SPR answers may not store selected_option_id';
  end if;

  return new;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_teacher_groups_updated_at before update on public.teacher_groups for each row execute function public.set_updated_at();
create trigger set_tests_updated_at before update on public.tests for each row execute function public.set_updated_at();
create trigger set_test_sections_updated_at before update on public.test_sections for each row execute function public.set_updated_at();
create trigger set_questions_updated_at before update on public.questions for each row execute function public.set_updated_at();
create trigger set_test_attempts_updated_at before update on public.test_attempts for each row execute function public.set_updated_at();
create trigger set_user_review_reasons_updated_at before update on public.user_review_reasons for each row execute function public.set_updated_at();
create trigger set_attempt_answer_reasons_updated_at before update on public.attempt_answer_reasons for each row execute function public.set_updated_at();
create trigger set_user_settings_updated_at before update on public.user_settings for each row execute function public.set_updated_at();
create trigger set_user_streaks_updated_at before update on public.user_streaks for each row execute function public.set_updated_at();
create trigger set_vocab_columns_updated_at before update on public.vocab_columns for each row execute function public.set_updated_at();
create trigger set_vocab_cards_updated_at before update on public.vocab_cards for each row execute function public.set_updated_at();
create trigger set_vocab_card_positions_updated_at before update on public.vocab_card_positions for each row execute function public.set_updated_at();
create trigger enforce_teacher_group_owner_role before insert or update on public.teacher_groups for each row execute function public.enforce_group_owner_role();
create trigger enforce_group_membership_student_role before insert or update on public.group_memberships for each row execute function public.enforce_group_membership_student();
create trigger enforce_correct_option_consistency before insert or update on public.question_correct_options for each row execute function public.enforce_question_answer_key_consistency();
create trigger enforce_spr_answer_consistency before insert or update on public.question_spr_accepted_answers for each row execute function public.enforce_question_spr_answer_consistency();
create trigger enforce_attempt_answer_consistency before insert or update on public.attempt_answers for each row execute function public.enforce_attempt_answer_shape();

insert into public.roles (code, label)
values
  ('admin', 'Admin'),
  ('student', 'Student'),
  ('teacher', 'Teacher')
on conflict (code) do update set label = excluded.label;

insert into public.permissions (code, label)
values
  ('read_public_exams', 'Read Public Exams'),
  ('manage_students', 'Manage Students'),
  ('create_remove_groups', 'Create/Remove Groups'),
  ('edit_groups', 'Edit Groups'),
  ('edit_public_exams', 'Edit Public Exams'),
  ('edit_private_exams', 'Edit Private Exams')
on conflict (code) do update set label = excluded.label;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  (r.code = 'admin')
  or (r.code = 'student' and p.code = 'read_public_exams')
  or (r.code = 'teacher' and p.code in (
    'read_public_exams',
    'manage_students',
    'create_remove_groups',
    'edit_groups',
    'edit_private_exams'
  ))
)
on conflict do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.teacher_groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.tests enable row level security;
alter table public.test_sections enable row level security;
alter table public.test_group_assignments enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_correct_options enable row level security;
alter table public.question_spr_accepted_answers enable row level security;
alter table public.test_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.user_review_reasons enable row level security;
alter table public.attempt_answer_reasons enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_streaks enable row level security;
alter table public.vocab_columns enable row level security;
alter table public.vocab_cards enable row level security;
alter table public.vocab_card_positions enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles for select using (auth.uid() = id or public.current_app_role() = 'admin');
create policy "profiles_update_own_or_admin" on public.profiles for update using (auth.uid() = id or public.current_app_role() = 'admin') with check (auth.uid() = id or public.current_app_role() = 'admin');
create policy "roles_read_authenticated" on public.roles for select using (auth.uid() is not null);
create policy "permissions_read_authenticated" on public.permissions for select using (auth.uid() is not null);
create policy "role_permissions_read_authenticated" on public.role_permissions for select using (auth.uid() is not null);
create policy "user_roles_read_own_or_admin" on public.user_roles for select using (auth.uid() = user_id or public.current_app_role() = 'admin');

create policy "teacher_groups_read_managed_or_member" on public.teacher_groups
for select using (
  public.current_app_role() = 'admin'
  or owner_user_id = auth.uid()
  or exists (
    select 1 from public.group_memberships gm where gm.group_id = id and gm.student_user_id = auth.uid()
  )
);

create policy "teacher_groups_insert_owner" on public.teacher_groups
for insert with check (auth.uid() = owner_user_id and public.current_app_role() in ('teacher', 'admin'));

create policy "teacher_groups_update_managed" on public.teacher_groups
for update using (public.can_manage_group(id)) with check (public.can_manage_group(id));

create policy "teacher_groups_delete_managed" on public.teacher_groups for delete using (public.can_manage_group(id));

create policy "group_memberships_read_managed_or_self" on public.group_memberships
for select using (public.current_app_role() = 'admin' or student_user_id = auth.uid() or public.can_manage_group(group_id));

create policy "group_memberships_manage_managed" on public.group_memberships
for all using (public.can_manage_group(group_id)) with check (public.can_manage_group(group_id));

create policy "tests_read_authorized" on public.tests for select using (public.can_read_test(id));

create policy "tests_insert_authorized" on public.tests
for insert with check (
  auth.uid() is not null and (
    public.current_app_role() = 'admin'
    or (visibility = 'private' and owner_user_id = auth.uid() and public.has_app_permission('edit_private_exams'))
  )
);

create policy "tests_update_authorized_editor" on public.tests for update using (public.can_edit_test(id)) with check (public.can_edit_test(id));
create policy "tests_delete_authorized_editor" on public.tests for delete using (public.can_edit_test(id));
create policy "test_sections_read_authorized" on public.test_sections for select using (public.can_read_test(test_id));
create policy "test_sections_manage_authorized" on public.test_sections for all using (public.can_edit_test(test_id)) with check (public.can_edit_test(test_id));
create policy "test_group_assignments_read_authorized" on public.test_group_assignments for select using (public.can_read_test(test_id) or public.can_manage_group(group_id));
create policy "test_group_assignments_manage_authorized" on public.test_group_assignments for all using (public.can_edit_test(test_id) or public.can_manage_group(group_id)) with check (public.can_edit_test(test_id) or public.can_manage_group(group_id));

create policy "questions_read_authorized" on public.questions
for select using (exists (select 1 from public.test_sections ts where ts.id = section_id and public.can_read_test(ts.test_id)));

create policy "questions_manage_authorized" on public.questions
for all using (exists (select 1 from public.test_sections ts where ts.id = section_id and public.can_edit_test(ts.test_id)))
with check (exists (select 1 from public.test_sections ts where ts.id = section_id and public.can_edit_test(ts.test_id)));

create policy "question_options_read_authorized" on public.question_options
for select using (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_read_test(ts.test_id)
  )
);

create policy "question_options_manage_authorized" on public.question_options
for all using (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_edit_test(ts.test_id)
  )
)
with check (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_edit_test(ts.test_id)
  )
);

create policy "question_correct_options_read_editors_only" on public.question_correct_options
for select using (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_edit_test(ts.test_id)
  )
);

create policy "question_correct_options_manage_editors_only" on public.question_correct_options
for all using (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_edit_test(ts.test_id)
  )
)
with check (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_edit_test(ts.test_id)
  )
);

create policy "question_spr_answers_read_editors_only" on public.question_spr_accepted_answers
for select using (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_edit_test(ts.test_id)
  )
);

create policy "question_spr_answers_manage_editors_only" on public.question_spr_accepted_answers
for all using (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_edit_test(ts.test_id)
  )
)
with check (
  exists (
    select 1
    from public.questions q
    join public.test_sections ts on ts.id = q.section_id
    where q.id = question_id and public.can_edit_test(ts.test_id)
  )
);

create policy "test_attempts_read_own_or_admin" on public.test_attempts for select using (user_id = auth.uid() or public.current_app_role() = 'admin');
create policy "test_attempts_insert_own" on public.test_attempts for insert with check (user_id = auth.uid());
create policy "test_attempts_update_own_or_admin" on public.test_attempts for update using (user_id = auth.uid() or public.current_app_role() = 'admin') with check (user_id = auth.uid() or public.current_app_role() = 'admin');

create policy "attempt_answers_read_via_attempt" on public.attempt_answers
for select using (
  exists (
    select 1 from public.test_attempts ta where ta.id = attempt_id and (ta.user_id = auth.uid() or public.current_app_role() = 'admin')
  )
);

create policy "attempt_answers_insert_via_attempt" on public.attempt_answers
for insert with check (exists (select 1 from public.test_attempts ta where ta.id = attempt_id and ta.user_id = auth.uid()));

create policy "attempt_answers_update_via_attempt" on public.attempt_answers
for update using (
  exists (
    select 1 from public.test_attempts ta where ta.id = attempt_id and (ta.user_id = auth.uid() or public.current_app_role() = 'admin')
  )
)
with check (
  exists (
    select 1 from public.test_attempts ta where ta.id = attempt_id and (ta.user_id = auth.uid() or public.current_app_role() = 'admin')
  )
);

create policy "user_review_reasons_own_rows" on public.user_review_reasons for all using (user_id = auth.uid() or public.current_app_role() = 'admin') with check (user_id = auth.uid() or public.current_app_role() = 'admin');

create policy "attempt_answer_reasons_read_via_attempt" on public.attempt_answer_reasons
for select using (
  exists (
    select 1
    from public.attempt_answers aa
    join public.test_attempts ta on ta.id = aa.attempt_id
    where aa.id = attempt_answer_id and (ta.user_id = auth.uid() or public.current_app_role() = 'admin')
  )
);

create policy "attempt_answer_reasons_manage_via_attempt" on public.attempt_answer_reasons
for all using (
  exists (
    select 1
    from public.attempt_answers aa
    join public.test_attempts ta on ta.id = aa.attempt_id
    where aa.id = attempt_answer_id and (ta.user_id = auth.uid() or public.current_app_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.attempt_answers aa
    join public.test_attempts ta on ta.id = aa.attempt_id
    where aa.id = attempt_answer_id and (ta.user_id = auth.uid() or public.current_app_role() = 'admin')
  )
);

create policy "user_settings_own_row" on public.user_settings for all using (user_id = auth.uid() or public.current_app_role() = 'admin') with check (user_id = auth.uid() or public.current_app_role() = 'admin');
create policy "user_streaks_own_row" on public.user_streaks for all using (user_id = auth.uid() or public.current_app_role() = 'admin') with check (user_id = auth.uid() or public.current_app_role() = 'admin');
create policy "vocab_columns_own_rows" on public.vocab_columns for all using (user_id = auth.uid() or public.current_app_role() = 'admin') with check (user_id = auth.uid() or public.current_app_role() = 'admin');
create policy "vocab_cards_own_rows" on public.vocab_cards for all using (user_id = auth.uid() or public.current_app_role() = 'admin') with check (user_id = auth.uid() or public.current_app_role() = 'admin');

create policy "vocab_card_positions_own_rows" on public.vocab_card_positions
for all using (
  exists (
    select 1 from public.vocab_cards vc where vc.id = card_id and (vc.user_id = auth.uid() or public.current_app_role() = 'admin')
  )
)
with check (
  exists (
    select 1 from public.vocab_cards vc where vc.id = card_id and (vc.user_id = auth.uid() or public.current_app_role() = 'admin')
  )
);
