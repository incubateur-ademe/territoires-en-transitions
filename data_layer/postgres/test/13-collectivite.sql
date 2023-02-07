create function
    test_create_collectivite(
    nom varchar(300)
)
    returns collectivite_test
    security definer
begin
    atomic
    insert into collectivite_test (nom)
    values (test_create_collectivite.nom)
    returning *;
end;
comment on function test_create_collectivite is
    'Crée une collectivite de test, avec pour identité EPCI avec 0 habitant.';

create function
    test_set_cot(collectivite_id integer, actif bool)
    returns cot
    security definer
begin
    atomic
    insert into cot
    values (test_set_cot.collectivite_id, test_set_cot.actif)
    on conflict (collectivite_id) do update set actif = excluded.actif
    returning *;
end;
comment on function test_set_cot is
    'Change le statut COT d''une collectivité.';

create function
    test_set_auditeur(demande_id integer, user_id uuid, audit_en_cours bool default false)
    returns audit_auditeur
    security definer
begin
    atomic
    with new_audit as (
        insert into audit (collectivite_id, referentiel, demande_id, date_debut)
            select collectivite_id,
                   referentiel,
                   id,
                   case when audit_en_cours then now() - interval '1 day' end
            from labellisation.demande ld
            where ld.id = test_set_auditeur.demande_id
            returning *)
    insert
    into audit_auditeur (audit_id, auditeur)
    select id, test_set_auditeur.user_id
    from new_audit
    returning *;
end;
comment on function test_set_auditeur is
    'Ajoute un utilisateur en tant qu''auditeur à une collectivité. '
        'L''utilisateur doit avoir des droits en écriture et une demande d''audit doit être validé. '
        'Dans le cas ou l''audit demandé est cours, l''audit date de la veille.';
