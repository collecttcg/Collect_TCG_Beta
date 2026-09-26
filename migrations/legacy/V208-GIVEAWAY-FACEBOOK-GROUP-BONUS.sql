-- V208: per-giveaway Facebook Group bonus toggle
-- Safe to run more than once.

alter table public.giveaways
  add column if not exists bonus_join_facebook_group boolean not null default false;

comment on column public.giveaways.bonus_join_facebook_group is
  'When true, joining/following the Collect TCG Facebook Group grants +1 giveaway bonus entry.';
