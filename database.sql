-- Bee Farma | PostgreSQL / Supabase. Aman dijalankan kembali.
begin;
create schema if not exists figiha;
revoke all on schema figiha from public, anon, authenticated;
create table if not exists figiha.staff (
 id uuid primary key default gen_random_uuid(), email text unique not null check(email=lower(trim(email))),
 name text not null, owner boolean not null default false, active boolean not null default true,
 menus text[] not null default array['kasir'], rev int not null default 1
);
-- Identitas versi login. Data produk, transaksi dan profil lama tetap tersedia.
alter table figiha.staff add column if not exists username text;
alter table figiha.staff add column if not exists employee_code text;
alter table figiha.staff add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
alter table figiha.staff add column if not exists managed_password boolean not null default false;
update figiha.staff set username=replace(id::text,'-','') where username is null;
update figiha.staff set employee_code='PG-'||substr(replace(id::text,'-',''),1,24) where employee_code is null;
update figiha.staff s set auth_user_id=u.id
 from auth.users u where s.auth_user_id is null and lower(u.email)=s.email and u.email_confirmed_at is not null
 and s.email not like '%@pegawai.apotek.invalid';
alter table figiha.staff alter column username set not null, alter column employee_code set not null;
create unique index if not exists figiha_auth_uid on figiha.staff(auth_user_id);
create table if not exists figiha.login_alias (
 alias text primary key, staff_id uuid not null references figiha.staff(id) on delete cascade
);
alter table figiha.login_alias enable row level security;
create or replace function figiha.sync_aliases() returns trigger language plpgsql set search_path='' as $$
begin
 if new.username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$' or new.employee_code !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$' then
  raise exception 'Username dan ID harus 1–32 karakter berupa huruf, angka, titik, garis bawah, atau tanda hubung.';
 end if;
 delete from figiha.login_alias where staff_id=new.id;
 insert into figiha.login_alias(alias,staff_id)
 select distinct lower(value),new.id from unnest(array[new.username,new.employee_code]) value;
 return new;
exception when unique_violation then raise exception 'Username atau ID sudah dipakai akun lain.';
end $$;
drop trigger if exists figiha_sync_aliases on figiha.staff;
create trigger figiha_sync_aliases after insert or update of username,employee_code on figiha.staff for each row execute function figiha.sync_aliases();
update figiha.staff s set username=s.username where not exists(select 1 from figiha.login_alias a where a.staff_id=s.id);

-- Jalankan sekali dari SQL Editor untuk mengatur pemilik pertama atau username pemilik versi lama.
create or replace function figiha.setup_owner(p_email text,p_username text,p_code text,p_name text)
returns void language plpgsql set search_path='' as $$
declare uid uuid; existing figiha.staff;
begin
 perform pg_advisory_xact_lock(31810402);
 select id into uid from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null;
 if uid is null then raise exception 'Buat akun email terkonfirmasi di Authentication terlebih dahulu.'; end if;
 select * into existing from figiha.staff where auth_user_id=uid or email=lower(trim(p_email)) limit 1;
 if exists(select 1 from figiha.staff where owner) and existing.owner is distinct from true then
  raise exception 'Pemilik sudah ada. Gunakan email pemilik yang terdaftar.'; end if;
 if existing.id is null then
  insert into figiha.staff(email,name,owner,username,employee_code,auth_user_id)
  values(lower(trim(p_email)),trim(p_name),true,lower(trim(p_username)),trim(p_code),uid);
 else
  update figiha.staff set username=lower(trim(p_username)),employee_code=trim(p_code),auth_user_id=uid,
  name=trim(p_name),owner=true,active=true,rev=rev+1 where id=existing.id; end if;
end $$;
revoke all on function figiha.setup_owner(text,text,text,text) from public,anon,authenticated;
create table if not exists figiha.records (
 kind text not null check(kind in ('products','suppliers','settings')), id uuid not null,
 data jsonb not null, rev int not null default 1, primary key(kind,id)
);
create table if not exists figiha.sales (
 id uuid primary key, number bigint generated always as identity unique, created_at timestamptz not null default now(),
 cashier uuid not null references figiha.staff, data jsonb not null
);
create table if not exists figiha.receipt_logos (id text primary key, image text not null);
alter table figiha.receipt_logos enable row level security;
alter table figiha.staff enable row level security;
alter table figiha.records enable row level security;
alter table figiha.sales enable row level security;
insert into figiha.records values ('settings','00000000-0000-0000-0000-000000000001','{"name":"Bee Farma","address":"","phone":"","footer":"Terima kasih atas kunjungan Anda.","width":"80"}',1) on conflict do nothing;
create or replace function figiha.me() returns figiha.staff language plpgsql stable security definer set search_path='' as $$
declare s figiha.staff;
begin
 select f.* into s from figiha.staff f where f.auth_user_id=auth.uid() and f.active;
 if s.id is null then raise exception 'Akun belum terdaftar atau telah dinonaktifkan.'; end if;
 return s;
end $$;
-- Hanya fungsi server yang dapat mencari alamat Auth berdasarkan alias login.
create or replace function public.figiha_login_identity(p_identifier text)
returns text language sql stable security definer set search_path='' as $$
 select u.email::text from figiha.login_alias a join figiha.staff s on s.id=a.staff_id
 join auth.users u on u.id=s.auth_user_id where a.alias=lower(trim(p_identifier)) and s.active and u.email_confirmed_at is not null;
$$;
revoke all on function public.figiha_login_identity(text) from public,anon,authenticated;
grant execute on function public.figiha_login_identity(text) to service_role;

create or replace function public.figiha_branding() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',data->>'name','logo',data->>'logo') from figiha.records where kind='settings';
$$;
revoke all on function public.figiha_branding() from public;
grant execute on function public.figiha_branding() to anon,authenticated;

-- Periksa izin pemilik dengan sesi pengguna, termasuk ketika permintaan berasal dari Edge Function.
create or replace function public.figiha_password_target(p_staff_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor figiha.staff:=figiha.me(); target figiha.staff; mailbox text; uid uuid;
begin
 if not actor.owner then raise exception 'Hanya pemilik yang dapat mengatur akun.'; end if;
 select * into strict target from figiha.staff where id=p_staff_id;
 if target.auth_user_id is not null and not target.managed_password then
  raise exception 'Kata sandi akun lama ini dikelola melalui Supabase Authentication.'; end if;
 mailbox:='staff-'||target.id::text||'@pegawai.apotek.invalid';
 select u.id into uid from auth.users u where lower(u.email)=mailbox and u.raw_app_meta_data->>'figiha_staff_id'=target.id::text;
 if target.auth_user_id is not null and target.auth_user_id is distinct from uid then raise exception 'Identitas Auth tidak cocok.'; end if;
 return jsonb_build_object('email',mailbox,'uid',uid);
end $$;
create or replace function public.figiha_bind_staff(p_staff_id uuid,p_user_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare actor figiha.staff:=figiha.me();
begin
 if not actor.owner then raise exception 'Hanya pemilik yang dapat mengatur akun.'; end if;
 if not exists(select 1 from auth.users u where u.id=p_user_id and lower(u.email)='staff-'||p_staff_id::text||'@pegawai.apotek.invalid'
 and u.raw_app_meta_data->>'figiha_staff_id'=p_staff_id::text and u.email_confirmed_at is not null) then raise exception 'Identitas Auth tidak cocok.'; end if;
 update figiha.staff set auth_user_id=p_user_id,managed_password=true
 where id=p_staff_id and (auth_user_id is null or auth_user_id=p_user_id);
 if not found then raise exception 'Akun tidak dapat diaktifkan.'; end if;
end $$;
revoke all on function public.figiha_password_target(uuid),public.figiha_bind_staff(uuid,uuid) from public,anon;
grant execute on function public.figiha_password_target(uuid),public.figiha_bind_staff(uuid,uuid) to authenticated;
create or replace function public.figiha_state() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s figiha.staff:=figiha.me(); result jsonb; canstock bool:=s.owner or 'stok'=any(s.menus);
begin
 select jsonb_build_object(
 'me',(to_jsonb(s)-'email'-'auth_user_id')||jsonb_build_object('provisioned',s.auth_user_id is not null),
 'settings',(select data||jsonb_build_object('id',id,'rev',rev) from figiha.records where kind='settings'),
 'products',coalesce((select jsonb_agg((case when canstock then data else data-'cost'-'batch'-'expiry' end)||jsonb_build_object('id',id,'rev',rev) order by data->>'name') from figiha.records where kind='products' and (canstock or s.menus&&array['kasir','suplier'])),'[]'),
 'suppliers',coalesce((select jsonb_agg(data||jsonb_build_object('id',id,'rev',rev)) from figiha.records where kind='suppliers' and (canstock or 'suplier'=any(s.menus))),'[]'),
 'staff',coalesce((select jsonb_agg((to_jsonb(f)-'email'-'auth_user_id')||jsonb_build_object('provisioned',f.auth_user_id is not null) order by f.name) from figiha.staff f where s.owner),'[]'),
 'receiptLogos',coalesce((select jsonb_object_agg(id,image) from figiha.receipt_logos where s.owner or s.menus&&array['riwayat','laporan']),'{}'),
 'sales',coalesce((select jsonb_agg((case when s.owner or 'laporan'=any(s.menus) then data else data-'cost' end)||jsonb_build_object('id',id,'number',number,'at',created_at) order by created_at desc) from figiha.sales where s.owner or s.menus&&array['riwayat','laporan']),'[]')
 ) into result;return result;
end $$;
create or replace function public.figiha_save(p_kind text,p_id uuid,p_rev int,p_data jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare s figiha.staff:=figiha.me(); n text:=trim(p_data->>'name'); allowed text[]:=array['kasir','stok','suplier','laporan','riwayat','pengaturan']; perms text[];
begin
 if n is null or n='' then raise exception 'Nama wajib diisi.'; end if;
 if p_kind='staff' then
  if not s.owner then raise exception 'Hanya pemilik yang dapat mengatur akun.'; end if;
  if coalesce(p_data->>'username','')='' or coalesce(p_data->>'employee_code','')='' then raise exception 'Isi username dan ID pegawai.'; end if;
  select coalesce(array_agg(v),'{}') into perms from jsonb_array_elements_text(p_data->'menus') as x(v);
  if not perms <@ allowed then raise exception 'Menu tidak valid.'; end if;
  if p_rev=0 then
   insert into figiha.staff(id,name,email,username,employee_code,menus,active)
   values(p_id,n,'staff-'||p_id::text||'@pegawai.apotek.invalid',lower(trim(p_data->>'username')),trim(p_data->>'employee_code'),perms,(p_data->>'active')::boolean)
   on conflict (id) do nothing;
   if not found and not exists(select 1 from figiha.staff f where f.id=p_id and not f.owner and f.name=n
    and f.username=lower(trim(p_data->>'username')) and f.employee_code=trim(p_data->>'employee_code')
    and f.active=(p_data->>'active')::boolean and f.menus=perms) then raise exception 'Profil sudah berubah. Muat ulang halaman.'; end if;
  else
   update figiha.staff set name=n,username=lower(trim(p_data->>'username')),employee_code=trim(p_data->>'employee_code'),
   menus=case when owner then menus else perms end,active=case when owner then true else (p_data->>'active')::boolean end,rev=rev+1
   where id=p_id and rev=p_rev;
   if not found then raise exception 'Data pegawai telah berubah. Muat ulang untuk melihat isian terbaru.'; end if;
  end if;
  return;
 end if;
 if not (case p_kind when 'products' then s.owner or 'stok'=any(s.menus) when 'suppliers' then s.owner or 'suplier'=any(s.menus) when 'settings' then s.owner or 'pengaturan'=any(s.menus) else false end) then raise exception 'Akses ditolak.'; end if;
 p_data:=p_data-'id'-'rev'||jsonb_build_object('name',n);
 if p_kind='products' then
  if not(p_data ?& array['price','cost','stock','minimum','unit','category','sku']) or least((p_data->>'price')::bigint,(p_data->>'cost')::bigint,(p_data->>'stock')::integer,(p_data->>'minimum')::integer)<0 then raise exception 'Data stok atau harga tidak valid.'; end if;
  if coalesce(p_data->>'supplier','')<>'' and not exists(select 1 from figiha.records where kind='suppliers' and id=(p_data->>'supplier')::uuid) then raise exception 'Suplier tidak ditemukan.'; end if;
 end if;
 if p_kind='settings' and p_id<>'00000000-0000-0000-0000-000000000001' then raise exception 'Pengaturan tidak valid.'; end if;
 if p_rev=0 then insert into figiha.records(kind,id,data) values(p_kind,p_id,p_data);
 else update figiha.records set data=p_data,rev=rev+1 where kind=p_kind and id=p_id and rev=p_rev;
 if not found then raise exception 'Data telah berubah. Muat ulang dan coba lagi.'; end if;end if;
end $$;
create unique index if not exists figiha_sku on figiha.records(lower(data->>'sku')) where kind='products';
create or replace function public.figiha_checkout(p_id uuid,p_items jsonb,p_discount bigint,p_paid bigint,p_method text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s figiha.staff:=figiha.me(); line record; r figiha.records; old figiha.sales; items jsonb:='[]'; subtotal bigint:=0; cost bigint:=0; total bigint; receipt jsonb; settings jsonb; logo_ref text; logo_image text;
begin
 if not(s.owner or 'kasir'=any(s.menus)) then raise exception 'Akses ditolak.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into old from figiha.sales where id=p_id;
 if found then
  if old.cashier<>s.id then raise exception 'Nomor transaksi sudah dipakai.'; end if;
  receipt:=old.data-'cost';
  if receipt->'business' ? 'logoRef' then
   select image into logo_image from figiha.receipt_logos where id=(receipt#>>'{business,logoRef}');
   receipt:=jsonb_set(receipt,'{business,logo}',to_jsonb(coalesce(logo_image,'')));
  end if;
  return receipt||jsonb_build_object('id',old.id,'number',old.number,'at',old.created_at);
 end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or p_method is null or p_method not in ('Tunai','QRIS','Debit','Transfer') or p_discount is null or p_paid is null then raise exception 'Transaksi tidak lengkap.'; end if;
 for line in select x.id,sum(x.qty)::integer qty,min(x.qty) minqty from jsonb_to_recordset(p_items) as x(id uuid,qty integer) group by x.id order by x.id loop
  select * into r from figiha.records where kind='products' and id=line.id for update;
  if not found or line.minqty<1 or line.qty is null or line.qty>(r.data->>'stock')::integer then raise exception 'Stok telah berubah atau jumlah tidak valid.'; end if;
  subtotal:=subtotal+(r.data->>'price')::bigint*line.qty;
  cost:=cost+(r.data->>'cost')::bigint*line.qty;
  items:=items||jsonb_build_array(jsonb_build_object('id',line.id,'qty',line.qty,'name',r.data->>'name','unit',r.data->>'unit','price',(r.data->>'price')::bigint));
  update figiha.records set data=jsonb_set(data,'{stock}',to_jsonb((data->>'stock')::integer-line.qty)),rev=rev+1 where kind='products' and id=line.id;
 end loop;
 total:=subtotal-p_discount;
 if p_discount<0 or total<0 or p_paid<total or (p_method<>'Tunai' and p_paid<>total) then raise exception 'Jumlah pembayaran tidak sesuai. Periksa kembali total transaksi.'; end if;
 select data into settings from figiha.records where kind='settings';
 logo_image:=settings->>'logo';
 if coalesce(logo_image,'')<>'' then
  logo_ref:=encode(sha256(convert_to(logo_image,'UTF8')),'hex');
  insert into figiha.receipt_logos(id,image) values(logo_ref,logo_image) on conflict do nothing;
  settings:=(settings-'logo')||jsonb_build_object('logoRef',logo_ref);
 end if;
 receipt:=jsonb_build_object('cashier',s.name,'items',items,'subtotal',subtotal,'discount',p_discount,'total',total,'cost',cost,'paid',p_paid,'change',p_paid-total,'method',p_method,'business',settings);
 insert into figiha.sales(id,cashier,data) values(p_id,s.id,receipt) returning * into old;
 if logo_ref is not null then receipt:=jsonb_set(receipt,'{business,logo}',to_jsonb(logo_image)); end if;
 return (receipt-'cost')||jsonb_build_object('id',old.id,'number',old.number,'at',old.created_at);
end $$;
revoke all on function public.figiha_state(),public.figiha_save(text,uuid,int,jsonb),public.figiha_checkout(uuid,jsonb,bigint,bigint,text) from public,anon;
grant execute on function public.figiha_state(),public.figiha_save(text,uuid,int,jsonb),public.figiha_checkout(uuid,jsonb,bigint,bigint,text) to authenticated;
notify pgrst, 'reload schema';
commit;
-- Jalankan perintah berikut secara terpisah setelah mengganti email dengan email Auth pemilik yang terkonfirmasi.
-- select figiha.setup_owner('email-pemilik@contoh.id','pemilik','AP-001','Pemilik');
-- Akun bawaan Bee Farma (login: Bee Farma / admin123): buat pengguna Auth beefarma@pegawai.apotek.invalid dengan kata sandi admin123 (email dikonfirmasi), lalu jalankan:
-- select figiha.setup_owner('beefarma@pegawai.apotek.invalid','beefarma','BF-001','Bee Farma');

