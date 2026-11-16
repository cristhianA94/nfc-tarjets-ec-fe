-- CREACION COMPLETA DE LA APLICACION NFC
-- Ejecutar una vez en Supabase SQL Editor sobre una base sin objetos NFC.
-- Requiere los roles anon/authenticated y auth.users/auth.uid() de Supabase.
-- Incluye clientes, tarjetas, administradores, indices, RLS, funciones y triggers.
-- Admite destinos HTTP/HTTPS de cualquier dominio.
-- No elimina datos ni objetos existentes. Si ya existe el esquema, usar las
-- migraciones pendientes en lugar de este archivo.
-- No ejecutar junto con las tres migraciones sobre la misma base.
-- El usuario inicial de Auth y su fila en admin_users se crean manualmente.
-- Este archivo no modifica el historial de migraciones de Supabase CLI.

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
 select coalesce(
   length(value) between 1 and 2048
   and value ~ '^https?://[^/?#[:space:]]+([/?#][^[:space:]]*)?$'
   and value !~ '[[:cntrl:]]',
   false
 );
$$;
revoke all on function public.valid_review_url(text) from public;
grant execute on function public.valid_review_url(text) to authenticated;

create table public.clients (
 id uuid primary key default gen_random_uuid(),
 business_name varchar(160) not null check(length(trim(business_name)) between 1 and 160),
 google_review_url text check(google_review_url is null or public.valid_review_url(google_review_url)),
 notes text check(notes is null or length(notes)<=2000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  public_code varchar(16) not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  client_id uuid references public.clients(id) on delete restrict,
  label varchar(80),
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
create index cards_client_idx on public.cards(client_id);
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
grant insert (client_id, label, status, notes) on public.cards to authenticated;
grant update (client_id, label, status, notes) on public.cards to authenticated;
create policy admins_read_cards on public.cards for select to authenticated using ((select public.is_admin()));
create policy admins_create_cards on public.cards for insert to authenticated with check ((select public.is_admin()));
create policy admins_update_cards on public.cards for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admins_delete_cards on public.cards for delete to authenticated using ((select public.is_admin()));

alter table public.clients enable row level security;
revoke all on public.clients from anon, authenticated;
grant select,delete on public.clients to authenticated;
grant insert(business_name,google_review_url,notes), update(business_name,google_review_url,notes) on public.clients to authenticated;
create policy admins_clients on public.clients for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

create function public.sync_card_client() returns trigger language plpgsql set search_path='' as $$
begin
 if NEW.client_id is not null then
   select business_name,google_review_url into NEW.business_name,NEW.google_review_url from public.clients where id=NEW.client_id;
   if not found then raise exception 'Cliente inexistente' using errcode='23503'; end if;
 else
   NEW.business_name:=null; NEW.google_review_url:=null;
 end if;
 if NEW.status='ACTIVE' and NEW.client_id is null then
   raise exception 'Una tarjeta activa requiere un cliente' using errcode='23514';
 end if;
 return NEW;
end; $$;
revoke all on function public.sync_card_client() from public;
create trigger cards_sync_client before insert or update on public.cards for each row execute function public.sync_card_client();
-- AFTER UPDATE must see the stored new client row when card triggers read it.
create or replace function public.sync_client_cards() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.cards set business_name=NEW.business_name,google_review_url=NEW.google_review_url where client_id=NEW.id;
 return NEW;
end; $$;
revoke all on function public.sync_client_cards() from public;
create trigger clients_sync_cards after update of business_name,google_review_url on public.clients for each row execute function public.sync_client_cards();
create function public.touch_client() returns trigger language plpgsql set search_path='' as $$
begin NEW.updated_at:=now(); return NEW; end; $$;
revoke all on function public.touch_client() from public;
create trigger clients_touch before update on public.clients for each row execute function public.touch_client();

create function public.resolve_card(code text)
returns table(status public.card_status,google_review_url text)
language sql stable security definer set search_path='' as $$
 select c.status,case when c.status='ACTIVE' then x.google_review_url else null end
 from public.cards c left join public.clients x on x.id=c.client_id
 where code ~ '^[A-Z0-9]{6,16}$' and c.public_code=code limit 1;
$$;
revoke all on function public.resolve_card(text) from public;
grant execute on function public.resolve_card(text) to anon, authenticated;

-- One round trip for all report counters and the requested activation page.
create function public.get_card_report(p_from date default null, p_to date default null, p_page integer default 1)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if not public.is_admin() then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
 if p_page < 1 or p_page > 1000000 or p_page is null or (p_from is not null and p_to is not null and p_from>p_to) then
  raise exception 'Periodo o pagina invalida' using errcode='22023';
 end if;
 with totals as (
 select count(*) as total,
 count(*) filter(where status='AVAILABLE') as available,
 count(*) filter(where status='ACTIVE') as active,
 count(*) filter(where status='SUSPENDED') as suspended,
 count(*) filter(where activated_at is not null
   and (p_from is null or activated_at >= (p_from::timestamp at time zone 'UTC'))
   and (p_to is null or activated_at < ((p_to+1)::timestamp at time zone 'UTC'))) as activations
 from public.cards
 ), entries as (
 select id,public_code,business_name,label,status,activated_at from public.cards
 where activated_at is not null
 and (p_from is null or activated_at >= (p_from::timestamp at time zone 'UTC'))
 and (p_to is null or activated_at < ((p_to+1)::timestamp at time zone 'UTC'))
 order by activated_at desc,public_code
 limit 25 offset ((p_page-1)*25)
 )
 select jsonb_build_object(
 'total',t.total,'available',t.available,'active',t.active,'suspended',t.suspended,
 'activations',t.activations,'page',p_page,'pages',greatest(1,ceil(t.activations/25.0)),
 'cards',coalesce((select jsonb_agg(to_jsonb(e) order by e.activated_at desc,e.public_code) from entries e),'[]'::jsonb)
 ) into result from totals t;
 return result;
end; $$;
revoke all on function public.get_card_report(date,date,integer) from public,anon;
grant execute on function public.get_card_report(date,date,integer) to authenticated;

drop index public.cards_activated_at_idx;
create index cards_activated_at_idx on public.cards(activated_at desc,public_code) where activated_at is not null;
create index cards_created_id_idx on public.cards(created_at desc,id);
create index clients_business_id_idx on public.clients(business_name,id);

-- Do not rewrite every child card when only client notes change, or when
-- a form submits the same name and URL again.
drop trigger clients_sync_cards on public.clients;
create trigger clients_sync_cards after update of business_name,google_review_url on public.clients
for each row when (OLD.business_name is distinct from NEW.business_name or OLD.google_review_url is distinct from NEW.google_review_url)
execute function public.sync_client_cards();
create or replace function public.sync_client_cards() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update public.cards set business_name=NEW.business_name,google_review_url=NEW.google_review_url
 where client_id=NEW.id
 and (business_name is distinct from NEW.business_name or google_review_url is distinct from NEW.google_review_url);
 return NEW;
end; $$;

commit;

-- Despues de crear el usuario en Supabase Auth, registrar su UUID real:
-- insert into public.admin_users(user_id) values ('UUID_DEL_USUARIO');
