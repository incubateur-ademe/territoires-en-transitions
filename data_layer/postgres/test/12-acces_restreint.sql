create or replace function test_changer_acces_restreint_collectivite(
collectivite_id integer,
access_restreint boolean
)
returns void
    as
$$
    update collectivite
    set access_restreint = test_changer_acces_restreint_collectivite.access_restreint
    where id = collectivite_id;
 $$
    language sql security definer;
comment on function test_changer_acces_restreint_collectivite is
    'Change l''acces restreint d''une collectivité';