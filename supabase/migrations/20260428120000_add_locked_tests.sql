create table if not exists public.locked_tests (
  test_id uuid primary key references public.tests(id) on delete cascade,
  token text not null check (length(btrim(token)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists locked_tests_test_id_idx on public.locked_tests(test_id);

drop trigger if exists set_locked_tests_updated_at on public.locked_tests;
create trigger set_locked_tests_updated_at before update on public.locked_tests for each row execute function public.set_updated_at();

alter table public.locked_tests enable row level security;

drop policy if exists "locked_tests_admin_manage" on public.locked_tests;
create policy "locked_tests_admin_manage" on public.locked_tests
  for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');
