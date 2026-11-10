-- AI Lab + Evergreen TV course: student accounts + saved progress (run once in Supabase → SQL Editor → New query → Run)
-- Kids never get an email account. The teacher creates usernames and passwords.
-- Nobody can read the tables directly: everything goes through the functions below.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.ailab_teachers (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  pass_hash text not null,
  created_at timestamptz default now()
);
create table if not exists public.ailab_students (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null,
  class_name text not null default '',
  pass_hash text not null,
  data jsonb not null default '{}'::jsonb,
  course jsonb not null default '{}'::jsonb,
  course_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_login timestamptz
);
create table if not exists public.ailab_sessions (
  token uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('student','teacher')),
  user_id uuid not null,
  expires_at timestamptz not null default now() + interval '30 days'
);
create table if not exists public.ailab_failed (
  username text not null,
  at timestamptz not null default now()
);
alter table public.ailab_students add column if not exists course jsonb not null default '{}'::jsonb;
alter table public.ailab_students add column if not exists course_at timestamptz;
alter table public.ailab_teachers enable row level security;
alter table public.ailab_students enable row level security;
alter table public.ailab_sessions enable row level security;
alter table public.ailab_failed enable row level security;
revoke all on public.ailab_teachers, public.ailab_students, public.ailab_sessions, public.ailab_failed from anon, authenticated;

-- helpers -------------------------------------------------------------
create or replace function public.ailab_too_many(p_user text) returns boolean
language sql security definer set search_path = public as $$
  select count(*) >= 10 from ailab_failed where username = lower(p_user) and at > now() - interval '10 minutes';
$$;
create or replace function public.ailab_teacher_id(p_token uuid) returns uuid
language sql security definer set search_path = public as $$
  select user_id from ailab_sessions where token = p_token and kind = 'teacher' and expires_at > now();
$$;
create or replace function public.ailab_student_id(p_token uuid) returns uuid
language sql security definer set search_path = public as $$
  select user_id from ailab_sessions where token = p_token and kind = 'student' and expires_at > now();
$$;

-- teacher -------------------------------------------------------------
create or replace function public.ailab_has_teacher() returns boolean
language sql security definer set search_path = public as $$ select exists(select 1 from ailab_teachers); $$;

create or replace function public.ailab_setup_teacher(p_user text, p_pass text) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_tok uuid;
begin
  if exists(select 1 from ailab_teachers) then raise exception 'teacher_exists'; end if;
  if length(coalesce(p_pass,'')) < 6 or length(coalesce(p_user,'')) < 3 then raise exception 'too_short'; end if;
  insert into ailab_teachers(username, pass_hash) values (lower(trim(p_user)), crypt(p_pass, gen_salt('bf'))) returning id into v_id;
  insert into ailab_sessions(kind, user_id, expires_at) values ('teacher', v_id, now() + interval '12 hours') returning token into v_tok;
  return v_tok;
end $$;

create or replace function public.ailab_teacher_login(p_user text, p_pass text) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_tok uuid;
begin
  if ailab_too_many('t:' || p_user) then raise exception 'too_many_tries'; end if;
  select id into v_id from ailab_teachers where username = lower(trim(p_user)) and pass_hash = crypt(p_pass, pass_hash);
  if v_id is null then insert into ailab_failed(username) values (lower('t:' || p_user)); raise exception 'wrong_login'; end if;
  insert into ailab_sessions(kind, user_id, expires_at) values ('teacher', v_id, now() + interval '12 hours') returning token into v_tok;
  return v_tok;
end $$;

create or replace function public.ailab_add_students(p_token uuid, p_rows jsonb) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare r jsonb; n integer := 0;
begin
  if ailab_teacher_id(p_token) is null then raise exception 'not_teacher'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into ailab_students(username, display_name, class_name, pass_hash)
    values (lower(trim(r->>'username')), trim(r->>'name'), coalesce(trim(r->>'class'),''), crypt(r->>'password', gen_salt('bf')));
    n := n + 1;
  end loop;
  return n;
end $$;

drop function if exists public.ailab_list_students(uuid);
create or replace function public.ailab_list_students(p_token uuid)
returns table(username text, display_name text, class_name text, data jsonb, updated_at timestamptz, last_login timestamptz, course jsonb, course_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if ailab_teacher_id(p_token) is null then raise exception 'not_teacher'; end if;
  return query select s.username, s.display_name, s.class_name, s.data, s.updated_at, s.last_login, s.course, s.course_at from ailab_students s order by s.class_name, s.display_name;
end $$;

create or replace function public.ailab_reset_password(p_token uuid, p_user text, p_pass text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if ailab_teacher_id(p_token) is null then raise exception 'not_teacher'; end if;
  update ailab_students set pass_hash = crypt(p_pass, gen_salt('bf')) where username = lower(trim(p_user));
  delete from ailab_sessions where kind = 'student' and user_id = (select id from ailab_students where username = lower(trim(p_user)));
  return found;
end $$;

create or replace function public.ailab_delete_student(p_token uuid, p_user text) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if ailab_teacher_id(p_token) is null then raise exception 'not_teacher'; end if;
  delete from ailab_students where username = lower(trim(p_user)) returning id into v_id;
  delete from ailab_sessions where user_id = v_id;
  return v_id is not null;
end $$;

-- student -------------------------------------------------------------
create or replace function public.ailab_student_login(p_user text, p_pass text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare s ailab_students; v_tok uuid;
begin
  if ailab_too_many(p_user) then raise exception 'too_many_tries'; end if;
  select * into s from ailab_students where username = lower(trim(p_user)) and pass_hash = crypt(p_pass, pass_hash);
  if s.id is null then insert into ailab_failed(username) values (lower(trim(p_user))); raise exception 'wrong_login'; end if;
  delete from ailab_sessions where expires_at < now();
  insert into ailab_sessions(kind, user_id) values ('student', s.id) returning token into v_tok;
  update ailab_students set last_login = now() where id = s.id;
  return jsonb_build_object('token', v_tok, 'username', s.username, 'name', s.display_name, 'class', s.class_name, 'data', s.data, 'course', s.course);
end $$;

create or replace function public.ailab_load(p_token uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s ailab_students;
begin
  select * into s from ailab_students where id = ailab_student_id(p_token);
  if s.id is null then raise exception 'not_logged_in'; end if;
  return jsonb_build_object('username', s.username, 'name', s.display_name, 'class', s.class_name, 'data', s.data, 'course', s.course);
end $$;

create or replace function public.ailab_save(p_token uuid, p_data jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_id uuid := ailab_student_id(p_token);
begin
  if v_id is null then raise exception 'not_logged_in'; end if;
  if length(p_data::text) > 200000 then raise exception 'too_big'; end if;
  update ailab_students set data = p_data, updated_at = now() where id = v_id;
  return now();
end $$;

create or replace function public.ailab_course_save(p_token uuid, p_data jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_id uuid := ailab_student_id(p_token);
begin
  if v_id is null then raise exception 'not_logged_in'; end if;
  if length(p_data::text) > 400000 then raise exception 'too_big'; end if;
  update ailab_students set course = p_data, course_at = now() where id = v_id;
  return now();
end $$;

create or replace function public.ailab_logout(p_token uuid) returns void
language sql security definer set search_path = public as $$ delete from ailab_sessions where token = p_token; $$;

-- only these entry points are callable from the app
revoke execute on function public.ailab_too_many(text), public.ailab_teacher_id(uuid), public.ailab_student_id(uuid),
  public.ailab_has_teacher(), public.ailab_setup_teacher(text,text), public.ailab_teacher_login(text,text),
  public.ailab_add_students(uuid,jsonb), public.ailab_list_students(uuid), public.ailab_reset_password(uuid,text,text),
  public.ailab_delete_student(uuid,text), public.ailab_student_login(text,text), public.ailab_load(uuid),
  public.ailab_save(uuid,jsonb), public.ailab_course_save(uuid,jsonb), public.ailab_logout(uuid) from public, anon, authenticated;
grant execute on function public.ailab_has_teacher(), public.ailab_setup_teacher(text,text), public.ailab_teacher_login(text,text),
  public.ailab_add_students(uuid,jsonb), public.ailab_list_students(uuid), public.ailab_reset_password(uuid,text,text),
  public.ailab_delete_student(uuid,text), public.ailab_student_login(text,text), public.ailab_load(uuid),
  public.ailab_save(uuid,jsonb), public.ailab_course_save(uuid,jsonb), public.ailab_logout(uuid) to anon, authenticated;
