-- Bee Farma | DATA AWAL (jalankan SETELAH database.sql). Aman dijalankan berulang.
-- Isi: akun pemilik (login Bee Farma / admin123), identitas apotek, suplier, dan 8 produk awal.
-- Riwayat transaksi tidak diisi manual: setiap pembayaran di kasir otomatis tersimpan di tabel figiha.sales.
begin;

-- 1) Akun pemilik: username beefarma / ID BF-001 / kata sandi admin123 (di halaman masuk cukup ketik "Bee Farma").
do $$
declare sid uuid; uid uuid; mail text;
begin
 select id into sid from figiha.staff where owner order by name limit 1;
 if sid is null then sid:='20000000-0000-0000-0000-000000000001'; end if;
 mail:='staff-'||sid::text||'@pegawai.apotek.invalid';
 select id into uid from auth.users where lower(email)=mail;
 if uid is null then
  uid:=gen_random_uuid();
  insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
   raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
  values('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',mail,crypt('admin123',gen_salt('bf')),now(),
   jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'figiha_staff_id',sid::text),'{}'::jsonb,now(),now(),'','','','');
  insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values(gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',mail,'email_verified',true),'email',now(),now(),now());
 else
  update auth.users set encrypted_password=crypt('admin123',gen_salt('bf')),email_confirmed_at=coalesce(email_confirmed_at,now()),
   raw_app_meta_data=raw_app_meta_data||jsonb_build_object('figiha_staff_id',sid::text),updated_at=now() where id=uid;
 end if;
 insert into figiha.staff(id,email,name,owner,active,menus,username,employee_code,auth_user_id,managed_password)
 values(sid,mail,'Bee Farma',true,true,array['kasir','stok','suplier','laporan','riwayat','pengaturan'],'beefarma','BF-001',uid,true)
 on conflict (id) do update set name='Bee Farma',owner=true,active=true,username='beefarma',employee_code='BF-001',
  auth_user_id=uid,managed_password=true,rev=figiha.staff.rev+1;
end $$;

-- 2) Identitas apotek (nama lama "Apotek Figiha" diganti; logo dan alamat yang sudah diisi tidak disentuh).
insert into figiha.records(kind,id,data) values ('settings','00000000-0000-0000-0000-000000000001',
 '{"name":"Bee Farma","address":"","phone":"","footer":"Terima kasih atas kunjungan Anda.","width":"80"}') on conflict do nothing;
update figiha.records set data=data||'{"name":"Bee Farma"}'::jsonb,rev=rev+1
 where kind='settings' and data->>'name' in ('Apotek Figiha','Apotek');

-- 3) Suplier
insert into figiha.records(kind,id,data) values
 ('suppliers','10000000-0000-0000-0000-000000000001','{"name":"Sehat Sentosa","phone":"","wa":"","address":"","contact":"","email":""}'),
 ('suppliers','10000000-0000-0000-0000-000000000002','{"name":"Mitra Medika","phone":"","wa":"","address":"","contact":"","email":""}')
on conflict do nothing;

-- 4) Produk / obat
insert into figiha.records(kind,id,data)
select 'products',v.id::uuid,jsonb_build_object('name',v.name,'category',v.category,'unit',v.unit,'detail',v.detail,
 'price',v.price,'cost',v.cost,'stock',v.stock,'image','assets/'||v.img||'.jpg','sku',v.sku,'minimum',10,
 'supplier',v.supplier,'batch','','expiry','')
from (values
 ('30000000-0000-0000-0000-000000000001','Paracetamol 500 mg','Obat','Strip','10 tablet',6500,4200,128,'paracetamol','AF-001','10000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000002','Vitamin C 500 mg','Vitamin','Botol','Tablet vitamin C',35000,26000,45,'vitamin-c','AF-002','10000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000003','Minyak Kayu Putih','Herbal','Botol','120 ml',32000,24000,36,'minyak-kayu-putih','AF-003','10000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000004','Plester Luka','Alat kesehatan','Kotak','10 lembar',12000,7500,64,'plester','AF-004','10000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000005','Antiseptik Cair','Perawatan','Botol','60 ml',18500,12500,28,'antiseptik','AF-005','10000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000006','Masker Medis','Alat kesehatan','Kotak','Masker sekali pakai',25000,18000,52,'masker','AF-006','10000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000007','Oralit','Obat','Sachet','Serbuk oralit',2500,1500,75,'oralit','AF-007','10000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000008','Hand Sanitizer','Perawatan','Botol','500 ml',42500,30000,8,'hand-sanitizer','AF-008','10000000-0000-0000-0000-000000000002')
) as v(id,name,category,unit,detail,price,cost,stock,img,sku,supplier)
on conflict do nothing;

commit;

-- Pemeriksaan (jalankan terpisah bila perlu):
-- select kind,count(*) from figiha.records group by kind;                 -- settings 1, suppliers 2, products 8
-- select name,username,employee_code,owner,active from figiha.staff;      -- akun pemilik
-- select data->>'name' nama,data->>'sku' sku,(data->>'stock')::int stok,(data->>'price')::int harga from figiha.records where kind='products' order by 1;
-- select number,created_at,data->>'cashier' kasir,(data->>'total')::bigint total from figiha.sales order by created_at desc;   -- riwayat transaksi
