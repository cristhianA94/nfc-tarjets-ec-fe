begin;

create type public.card_status as enum ('AVAILABLE', 'ACTIVE', 'SUSPENDED');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create function public.valid_review_url(value text) returns boolean
language sql immutable set search_path = ''
as $$
  select coalesce(length(value) <= 2048 and (
    value ~ '^https://g[.]page/r/[A-Za-z0-9_-]+/review/?$'
    or value ~ '^https://search[.]google[.]com/local/writereview[?]placeid=[A-Za-z0-9_-]+$'
    or value ~ '^https://maps[.]app[.]goo[.]gl/[A-Za-z0-9_-]+/?([?]g_st=[A-Za-z0-9_-]+)?$'
  ), false);
$$;
revoke all on function public.valid_review_url(text) from public;
grant execute on function public.valid_review_url(text) to authenticated;

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  public_code varchar(16) not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  business_name varchar(160),
  google_review_url text,
  status public.card_status not null default 'AVAILABLE',
  notes text,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint cards_code_format check (public_code ~ '^[A-Z0-9]{6,16}$'),
  constraint cards_name_length check (business_name is null or length(trim(business_name)) between 1 and 160),
  constraint cards_notes_length check (notes is null or length(notes) <= 2000),
  constraint cards_review_url check (google_review_url is null or public.valid_review_url(google_review_url)),
  constraint cards_active_data check (status <> 'ACTIVE' or (business_name is not null and google_review_url is not null and activated_at is not null)),
  constraint cards_suspended_activation check (status <> 'SUSPENDED' or activated_at is not null)
);
create index cards_status_created_idx on public.cards(status, created_at desc);
create index cards_activated_at_idx on public.cards(activated_at desc) where activated_at is not null;

create function public.protect_card() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.status <> 'AVAILABLE' then
      raise exception 'Las tarjetas nuevas deben estar disponibles' using errcode = '23514';
    end if;
    NEW.activated_at := null;
    NEW.created_at := now();
  else
    if NEW.public_code is distinct from OLD.public_code or NEW.id is distinct from OLD.id then
      raise exception 'El identificador de tarjeta es inmutable' using errcode = '23514';
    end if;
    NEW.created_at := OLD.created_at;
    NEW.activated_at := OLD.activated_at;
    if NEW.status = 'ACTIVE' and OLD.activated_at is null then
      NEW.activated_at := now();
    end if;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$;
revoke all on function public.protect_card() from public;
create trigger cards_protect before insert or update on public.cards
for each row execute function public.protect_card();

alter table public.admin_users enable row level security;
alter table public.cards enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;
create policy admin_self_read on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.cards from anon, authenticated;
grant select, delete on table public.cards to authenticated;
grant insert (business_name, google_review_url, status, notes) on public.cards to authenticated;
grant update (business_name, google_review_url, status, notes) on public.cards to authenticated;
create policy admins_read_cards on public.cards for select to authenticated using ((select public.is_admin()));
create policy admins_create_cards on public.cards for insert to authenticated with check ((select public.is_admin()));
create policy admins_update_cards on public.cards for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admins_delete_cards on public.cards for delete to authenticated using ((select public.is_admin()));

-- Only an exact public code can be resolved. No names, dates, notes or table listing.
create function public.resolve_card(code text)
returns table (status public.card_status, google_review_url text)
language sql stable security definer set search_path = ''
as $$
  select c.status,
    case when c.status = 'ACTIVE' then c.google_review_url else null end
  from public.cards c
  where code ~ '^[A-Z0-9]{6,16}$' and c.public_code = code
  limit 1;
$$;
revoke all on function public.resolve_card(text) from public;
grant execute on function public.resolve_card(text) to anon, authenticated;

commit;
