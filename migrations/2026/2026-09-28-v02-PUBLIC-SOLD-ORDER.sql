-- Collect TCG Development 2026-09-28-v02
-- Public Sold ordering without exposing private sold_at timestamps.
-- Rerunnable: CREATE OR REPLACE + idempotent grants.
--
-- This function returns only live Sold card IDs and their chronological rank.
-- It does not expose sold_at, owner-private metadata, hidden/draft listings,
-- costs, certificates, analytics, or any other owner-only field.

create or replace function public.get_public_sold_order()
returns table (
  id text,
  sold_order bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id::text,
    row_number() over (
      order by
        c.sold_at desc nulls last,
        c.updated_at desc nulls last,
        c.created_at desc nulls last,
        c.id asc
    )::bigint as sold_order
  from public.cards c
  where coalesce(c.lifecycle_status::text,'live') = 'live'
    and lower(coalesce(c.availability::text,'')) = 'sold';
$$;

revoke all on function public.get_public_sold_order() from public;
grant execute on function public.get_public_sold_order() to anon;
grant execute on function public.get_public_sold_order() to authenticated;
