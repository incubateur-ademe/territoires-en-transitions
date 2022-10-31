begin;
select plan(6);

truncate labellisation.action_audit_state;
truncate audit cascade;

-- En tant qu'auditeur
select test.identify_as('youlou@doudou.com');

-- Crée des audits de test
insert into audit(collectivite_id, referentiel, date_debut, date_fin)
values (1, 'eci', default, null),
       (1, 'cae', default, null),
       (2, 'eci', now() - interval '2 day', now() - interval '1 day');

-- Test fonction labellisation.current_audit - audit existant
select ok(
               (select a.id = current.id
                from audit a
                         left join lateral ( select *
                                             from labellisation.current_audit(a.collectivite_id, a.referentiel) ) as current
                                   on true
                where a.collectivite_id = 1
                    and a.referentiel = 'eci'
                    and a.date_fin is null
                   or a.date_fin >= now()),
               'labellisation.current_audit devrait retourner un audit existant'
           );

-- Test fonction get_current_audit - audit ferme
select ok(
               (select labellisation.current_audit(2, 'eci') is null),
               'labellisation.current_audit devrait retourner null car audit ferme'
           );
-- Test fonction get_current_audit - audit inexistant
select ok(
               (select labellisation.current_audit(26, 'eci') is null),
               'labellisation.current_audit devrait retourner null car audit inexistant'
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

rollback;
