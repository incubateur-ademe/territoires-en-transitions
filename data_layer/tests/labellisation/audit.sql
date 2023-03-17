begin;
select plan(6);

truncate labellisation.action_audit_state;
truncate labellisation.audit cascade;

-- En tant qu'auditeur
select test.identify_as('youlou@doudou.com');

-- Crée des audits de test
insert into labellisation.audit(collectivite_id, referentiel, date_debut, date_fin)
values (1, 'eci', now(), null),
       (1, 'cae', now(), null),
       (2, 'eci', now() - interval '3 day', now() - interval '1 day');

-- Test fonction labellisation.current_audit - audit existant
select ok(
               (select a.id = current.id
                from labellisation.audit a
                         left join lateral ( select *
                                             from labellisation.current_audit(a.collectivite_id, a.referentiel) ) as current
                                   on true
                where a.collectivite_id = 1
                    and a.referentiel = 'eci'
                    and a.date_fin is null
                   or a.date_fin >= now()),
               'labellisation.current_audit devrait retourner un audit existant'
           );

-- Crée des action_audit_state
insert into public.action_audit_state (action_id, collectivite_id, statut, ordre_du_jour, avis)
values ('eci_2.2', 1, 'audite', true, ''),
       ('eci_2.3', 1, 'non_audite', false, ''),
       ('cae_2.2.2', 1, 'non_audite', true, ''),
       ('eci_2.4', 1, 'en_cours', true, '');


-- Test trigger audit_id - audit trouve
select isnt_empty(
               'select *
                from labellisation.action_audit_state a
                where a.collectivite_id = 1
                  and a.action_id = ''eci_2.2''',
               'audit_id devrait trouver un audit'
           );

-- Test trigger get_audit_id - audit pas trouve
prepare my_thrower as
    insert into public.action_audit_state (action_id, collectivite_id, statut, ordre_du_jour, avis)
    values ('eci_2.2', 2, 'audite', true, '');
select throws_ok(
               'my_thrower',
               'Pas d''audit en cours.',
               'On ne devrait pas pouvoir insérer de state quand l''audit est fermé'
           );

-- Test vue pour une collectivite et un referentiel
select bag_eq(
               'select audit_id,
                      action_id,
                      id,
                      collectivite_id,
                      ordre_du_jour,
                      avis,
                      statut
               from labellisation.action_audit_state;',
               'select audit_id,
                      action_id,
                      state_id,
                      collectivite_id,
                      ordre_du_jour,
                      avis,
                      statut
               from public.action_audit_state;',
               'La vue devrait contenir les données de la table.'
           );

-- Test contrainte audit_existant - creation impossible - nouveau maintenant et audit en cours
-- prepare my_thrower_audit_en_cours as
--     insert into labellisation.audit(collectivite_id, referentiel, date_debut, date_fin)
--     values (1, 'eci', default, null);
-- select throws_ok(
--                'my_thrower_audit_en_cours',
--                'conflicting key value violates exclusion constraint "audit_existant"',
--                'On ne devrait pas pouvoir insérer un nouvel audit quand il en existe un en cours'
--            );
-- -- Test contrainte audit_existant - creation impossible - nouveau début avant-hier, et audit terminé hier
-- prepare my_thrower_audit_existant as
--     insert into labellisation.audit(collectivite_id, referentiel, date_debut, date_fin)
--     values (2, 'eci', now() - interval '2 day', null);
-- select throws_ok(
--                'my_thrower_audit_existant',
--                'conflicting key value violates exclusion constraint "audit_existant"',
--                'On ne devrait pas pouvoir insérer un audit en même temps qu''un audit existant'
--            );


-- Teste la clôture d'un audit COT
truncate labellisation.audit cascade;
truncate cot;

-- La collectivité 1 est COT
insert into cot
values (1, true);

-- On crée un audit COT (1) et un non-COT (2).
insert into labellisation.audit(id, collectivite_id, referentiel, date_debut, date_fin)
values (1, 1, 'eci', now() - interval '1 day', null),
       (2, 2, 'eci', now() - interval '1 day', null);

-- On valide les deux audits en tant qu'auditeur.
select test.identify_as('youlou@doudou.com');
update labellisation.audit
set valide = true
where true;

select bag_eq(
               'select date_fin, valide from labellisation.audit where id = 1',
               'select now(), true',
               'La date de fin de l''audit devrait être égale à now après la validation d''un audit COT.'
           );

select bag_eq(
               'select date_fin, valide from labellisation.audit where id = 2',
               'select null::timestamp with time zone, true',
               'La date de fin devrait être null après la validation d''un audit non-COT.'
           );

rollback;
