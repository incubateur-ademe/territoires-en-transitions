-- Verify tet:collectivite/preuve_rls_insert_serveur on pg

BEGIN;

do $$
declare
    nom_table  text;
    permissive boolean;
    commande   "char";
    roles      text[];
    check_expr text;
begin
    foreach nom_table in array array ['preuve_audit', 'preuve_rapport']
        loop
            select p.polpermissive,
                   p.polcmd,
                   array(select r.rolname
                           from pg_roles r
                          where r.oid = any (p.polroles)
                          order by r.rolname),
                   pg_get_expr(p.polwithcheck, p.polrelid)
              into permissive, commande, roles, check_expr
              from pg_policy p
                       join pg_class c on c.oid = p.polrelid
                       join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public'
               and c.relname = nom_table
               and p.polname = 'deny_insert_client';

            assert found,
                format('La policy deny_insert_client doit exister sur %s', nom_table);
            assert not permissive,
                format('La policy deny_insert_client sur %s doit être restrictive', nom_table);
            assert commande = 'a',
                format('La policy deny_insert_client sur %s doit porter sur l''insertion', nom_table);
            assert roles = array ['anon', 'authenticated'],
                format('La policy deny_insert_client sur %s doit viser anon et authenticated (actuel: %s)', nom_table, roles);
            assert check_expr = 'false',
                format('La policy deny_insert_client sur %s doit refuser toute insertion (actuel: %s)', nom_table, check_expr);
        end loop;
end
$$;

ROLLBACK;
