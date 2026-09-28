-- Collect TCG Development 2026-09-28-v04
-- Minimal clean-route feed for owner-only Hidden/Archived listings.
-- Rerunnable. Does not relax cards-table RLS and does not expose card details.
--
-- The public build needs a filesystem path in order for an authenticated owner
-- to refresh/open a clean /cards/<slug>/ URL. This RPC exposes only the card ID
-- and the already-human-readable route slug. It intentionally does NOT return
-- prices, images, notes, grading JSON, lifecycle metadata, or other card fields.

create or replace function public.get_private_card_routes()
returns table (
  id text,
  route_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id::text,
    coalesce(
      nullif(
        trim(
          both '-' from
          left(
            regexp_replace(
              regexp_replace(
                replace(
                  replace(
                    replace(
                      lower(
                        concat_ws(
                          '-',
                          nullif(trim(c.year::text),''),
                          nullif(trim(c.game::text),''),
                          nullif(trim(c.series::text),''),
                          nullif(trim(c.name::text),''),
                          nullif(trim(c.card_code::text),''),
                          nullif(trim(
                            case
                              when jsonb_typeof(c.grading)='array' then c.grading->0->>'company'
                              else null
                            end
                          ),''),
                          nullif(trim(
                            case
                              when jsonb_typeof(c.grading)='array' then c.grading->0->>'grade'
                              else null
                            end
                          ),'')
                        )
                      ),
                      '&',
                      ' and '
                    ),
                    '''',
                    ''
                  ),
                  '’',
                  ''
                ),
                '[^a-z0-9]+',
                '-',
                'g'
              ),
              '-{2,}',
              '-',
              'g'
            ),
            120
          )
        ),
        ''
      ),
      'card'
    )::text as route_slug
  from public.cards c
  where c.id is not null
    and nullif(trim(c.name::text),'') is not null
    and (
      lower(coalesce(c.lifecycle_status::text,'live')) in ('draft','archived')
      or lower(coalesce(c.availability::text,'')) in ('hidden','archived')
    )
  order by c.created_at asc nulls last, c.id asc;
$$;

revoke all on function public.get_private_card_routes() from public;
grant execute on function public.get_private_card_routes() to anon;
grant execute on function public.get_private_card_routes() to authenticated;
