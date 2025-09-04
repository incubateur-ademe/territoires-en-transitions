create function
    test_create_collectivite(
    nom varchar(300),
    type varchar(20) default 'epci'
)
    returns collectivite
    security definer
begin
    atomic
    insert into collectivite (nom, type)
    values (test_create_collectivite.nom, test_create_collectivite.type)
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
    insert into cot (collectivite_id, actif)
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
    insert
    into audit_auditeur (audit_id, auditeur)
    select a.id, test_set_auditeur.user_id
    from labellisation.demande d
             join labellisation.current_audit(d.collectivite_id, d.referentiel) a on true
    where d.id = test_set_auditeur.demande_id
    returning *;
end;
comment on function test_set_auditeur is
    'Ajoute un utilisateur en tant qu''auditeur à une collectivité. '
        'L''utilisateur doit avoir des droits en écriture et une demande d''audit doit être validé.';
