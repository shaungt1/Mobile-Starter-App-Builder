begin;
select plan(8);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.app_records'::regclass), 'app_records has RLS');
select has_policy('public', 'profiles', 'profiles_select_own');
select has_policy('public', 'profiles', 'profiles_update_own');
select has_policy('public', 'app_records', 'app_records_select_own');
select has_policy('public', 'app_records', 'app_records_insert_own');
select has_policy('public', 'app_records', 'app_records_update_own');
select has_policy('public', 'app_records', 'app_records_delete_own');

select * from finish();
rollback;
