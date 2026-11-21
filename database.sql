-- Apotek Figiha | PostgreSQL / Supabase. Aman dijalankan kembali.
begin;
create schema if not exists figiha;
revoke all on schema figiha from public, anon, authenticated;
create table if not exists figiha.staff (
 id uuid primary key default gen_random_uuid(), email text unique not null check(email=lower(trim(email))),
 name text not null, owner boolean not null default false, active boolean not null default true,
 menus text[] not null default array['kasir'], rev int not null default 1
);
create table if not exists figiha.records (
 kind text not null check(kind in ('products','suppliers','settings')), id uuid not null,
 data jsonb not null, rev int not null default 1, primary key(kind,id)
);
create table if not exists figiha.sales (
 id uuid primary key, number bigint generated always as identity unique, created_at timestamptz not null default now(),
 cashier uuid not null references figiha.staff, data jsonb not null
);
alter table figiha.staff enable row level security;
alter table figiha.records enable row level security;
alter table figiha.sales enable row level security;
insert into figiha.records values ('settings','00000000-0000-0000-0000-000000000001','{"name":"Apotek Figiha","address":"","phone":"","footer":"Terima kasih atas kunjungan Anda.","width":"80"}',1) on conflict do nothing;
create or replace function figiha.me() returns figiha.staff language plpgsql stable security definer set search_path='' as $$
declare s figiha.staff;
begin
 select f.* into s from figiha.staff f join auth.users u on lower(u.email)=f.email
 where u.id=auth.uid() and u.email_confirmed_at is not null and f.active;
 if s.id is null then raise exception 'Akun belum aktif atau email belum terdaftar sebagai pegawai.'; end if;
 return s;
end $$;
create or replace function public.figiha_state() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s figiha.staff:=figiha.me(); result jsonb; canstock bool:=s.owner or 'stok'=any(s.menus);
begin
 select jsonb_build_object(
 'me',to_jsonb(s),
 'settings',(select data||jsonb_build_object('id',id,'rev',rev) from figiha.records where kind='settings'),
 'products',coalesce((select jsonb_agg((case when canstock then data else data-'cost'-'batch'-'expiry' end)||jsonb_build_object('id',id,'rev',rev) order by data->>'name') from figiha.records where kind='products' and (canstock or s.menus&&array['kasir','suplier'])),'[]'),
 'suppliers',coalesce((select jsonb_agg(data||jsonb_build_object('id',id,'rev',rev)) from figiha.records where kind='suppliers' and (canstock or 'suplier'=any(s.menus))),'[]'),
 'staff',coalesce((select jsonb_agg(to_jsonb(f) order by f.name) from figiha.staff f where s.owner),'[]'),
 'sales',coalesce((select jsonb_agg((case when s.owner or 'laporan'=any(s.menus) then data else data-'cost' end)||jsonb_build_object('id',id,'number',number,'at',created_at) order by created_at desc) from figiha.sales where s.owner or s.menus&&array['riwayat','laporan']),'[]')
 ) into result;return result;
end $$;
create or replace function public.figiha_save(p_kind text,p_id uuid,p_rev int,p_data jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare s figiha.staff:=figiha.me(); n text:=trim(p_data->>'name'); allowed text[]:=array['kasir','stok','suplier','laporan','riwayat','pengaturan']; perms text[];
begin
 if n is null or n='' then raise exception 'Nama wajib diisi.'; end if;
 if p_kind='staff' and s.owner then
  select coalesce(array_agg(v),'{}') into perms from jsonb_array_elements_text(p_data->'menus') as x(v);
  if not perms <@ allowed or p_data->>'email' !~ '^[^ @]+@[^ @]+[.][^ @]+$' then raise exception 'Email atau menu tidak valid.'; end if;
  if p_rev=0 then insert into figiha.staff(id,name,email,menus,active) values(p_id,n,lower(trim(p_data->>'email')),perms,(p_data->>'active')::boolean);
  else update figiha.staff set name=n,email=lower(trim(p_data->>'email')),menus=perms,active=(p_data->>'active')::boolean,rev=rev+1 where id=p_id and rev=p_rev and not owner;
   if not found then raise exception 'Pemilik dilindungi atau data telah berubah.'; end if;
  end if;return;
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
declare s figiha.staff:=figiha.me(); line record; r figiha.records; old figiha.sales; items jsonb:='[]'; subtotal bigint:=0; cost bigint:=0; total bigint; receipt jsonb; settings jsonb;
begin
 if not(s.owner or 'kasir'=any(s.menus)) then raise exception 'Akses ditolak.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into old from figiha.sales where id=p_id;
 if found then
  if old.cashier<>s.id then raise exception 'Nomor transaksi sudah dipakai.'; end if;
  return (old.data-'cost')||jsonb_build_object('id',old.id,'number',old.number,'at',old.created_at);
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
 receipt:=jsonb_build_object('cashier',s.name,'items',items,'subtotal',subtotal,'discount',p_discount,'total',total,'cost',cost,'paid',p_paid,'change',p_paid-total,'method',p_method,'business',settings);
 insert into figiha.sales(id,cashier,data) values(p_id,s.id,receipt) returning * into old;
 return (receipt-'cost')||jsonb_build_object('id',old.id,'number',old.number,'at',old.created_at);
end $$;
revoke all on function public.figiha_state(),public.figiha_save(text,uuid,int,jsonb),public.figiha_checkout(uuid,jsonb,bigint,bigint,text) from public,anon;
grant execute on function public.figiha_state(),public.figiha_save(text,uuid,int,jsonb),public.figiha_checkout(uuid,jsonb,bigint,bigint,text) to authenticated;
commit;
-- Sesudah migrasi: buat akun pemilik di Authentication > Users (email terkonfirmasi).
-- Ganti alamat email dan jalankan baris INSERT berikut secara terpisah di SQL Editor.
-- insert into figiha.staff(email,name,owner) values ('email-anda@contoh.id','Pemilik',true);

