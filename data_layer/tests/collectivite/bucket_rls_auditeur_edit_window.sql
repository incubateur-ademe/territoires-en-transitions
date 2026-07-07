begin;
select plan(4);

-- Un auditeur externe (aucun droit sur la collectivite 1) affecte a deux audits
-- clos : l'un dans la fenetre d'edition de 15 jours, l'autre au-dela.
do $$
declare
    auditeur_id uuid := '33333333-3333-3333-3333-333333333333';
    v_in_window int;
    v_out_window int;
begin
    perform test_create_user(auditeur_id, 'Audi', 'Teur', 'audi.teur@example.com');

    insert into labellisation.audit(collectivite_id, referentiel, date_debut, date_fin, clos)
    values (1, 'eci', now() - interval '40 days', now() - interval '2 days', true)
    returning id into v_in_window;

    insert into labellisation.audit(collectivite_id, referentiel, date_debut, date_fin, clos)
    values (1, 'te', now() - interval '40 days', now() - interval '20 days', true)
    returning id into v_out_window;

    insert into audit_auditeur(audit_id, auditeur)
    values (v_in_window, auditeur_id), (v_out_window, auditeur_id);

    create temporary table t_audit(label text primary key, id int) on commit drop;
    insert into t_audit values ('in_window', v_in_window), ('out_window', v_out_window);
end
$$;

select test.identify_as('audi.teur@example.com');

select ok(
       private.est_auditeur_audit_dans_fenetre_edition(
           (select id from t_audit where label = 'in_window')),
       'Un auditeur peut ecrire une preuve d''un audit clos depuis moins de 15 jours'
   );

select ok(
       not private.est_auditeur_audit_dans_fenetre_edition(
           (select id from t_audit where label = 'out_window')),
       'Un auditeur ne peut plus ecrire une preuve d''un audit clos depuis plus de 15 jours'
   );

select ok(
       private.est_auditeur_bucket_dans_fenetre_edition(
           (select cb.bucket_id from collectivite_bucket cb where cb.collectivite_id = 1)),
       'Un auditeur dans la fenetre de 15 jours peut ecrire dans le bucket storage de la collectivite'
   );

-- Controle negatif : un utilisateur verifie qui n'est pas auditeur ne beneficie
-- jamais de la fenetre d'edition.
do $$
declare
    outsider_id uuid := '44444444-4444-4444-4444-444444444444';
begin
    perform test_create_user(outsider_id, 'Lambda', 'Verifie', 'lambda.fenetre@example.com');
end
$$;

select test.identify_as('lambda.fenetre@example.com');

select ok(
       not private.est_auditeur_audit_dans_fenetre_edition(
           (select id from t_audit where label = 'in_window')),
       'Un utilisateur non auditeur ne beneficie pas de la fenetre d''edition'
   );

rollback;
