-- Migration: add_password_resets_table.sql
-- This migration creates a table to store password reset requests.
-- Supabase's built-in auth handles sending reset emails, but storing
-- tokens/requests can be useful for auditing or custom workflows.

create table if not exists password_resets (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    request_time timestamptz not null default now(),
    token text not null,
    used boolean not null default false
);

-- Example RLS policy: allow users to insert their own reset requests
-- and select their own records.

-- enable row level security
alter table password_resets enable row level security;

create policy "Allow users to insert their own reset requests" on password_resets
    for insert
    with check (auth.uid() = user_id);

create policy "Allow users to view their own reset requests" on password_resets
    for select
    using (auth.uid() = user_id);
