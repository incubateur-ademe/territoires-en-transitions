begin;
select plan(6);

truncate action_audit_state;
truncate audit cascade;

-- Crée des audits de test
insert into audit(collectivite_id, referentiel, date_debut, date_fin)
values
    (23, 'eci', default, null),
    (23, 'eci', now() - interval'2 day' ,now() - interval'1 day'),
    (23, 'cae', default, null),
    (24, 'eci', default, null),
    (25, 'eci', now() - interval'2 day' ,now() - interval'1 day');

-- Test fonction labellisation.current_audit - audit existant
select ok(
    (
        select a.id = labellisation.current_audit(23, 'eci')
        from audit a
        where a.collectivite_id = 23
        and a.referentiel = 'eci'
        and a.date_fin is null or a.date_fin >= now()
    ),
    'labellisation.current_audit devrait retourner un audit existant'
);
-- Test fonction get_current_audit - audit ferme
select ok(
    (select labellisation.current_audit(25, 'eci') is null),
    'labellisation.current_audit devrait retourner null car audit ferme'
);
-- Test fonction get_current_audit - audit inexistant
select ok(
    (select labellisation.current_audit(26, 'eci') is null),
    'labellisation.current_audit devrait retourner null car audit inexistant'
);


-- Crée des action_audit_state
insert into action_audit_state (action_id, collectivite_id, modified_by)
values
    ('eci_2.2', '23', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'),
    ('eci_2.3', '23', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'),
    ('cae_2.2', '23', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'),
    ('eci_2.4', '24', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561');

-- Test trigger audit_id - audit trouve
select ok(
    (
        select a.audit_id is not null
        from action_audit_state a
        where a.collectivite_id = 23
        and a.action_id = 'eci_2.2'
    ),
    'audit_id devrait trouver un audit'
);

-- Test trigger get_audit_id - audit pas trouve

prepare my_thrower as
    insert into action_audit_state (action_id, collectivite_id, modified_by)
    values ('eci_2.2.1.1', '25', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561');
select throws_ok(
    'my_thrower',
    'Pas d audit en cours ou existant à rattacher',
    'audit_id ne devrait pas trouver d audit'
);

-- Test vue pour une collectivite et un referentiel
select ok(
    (
        select count(*) = 2
        from action_audit_state_list a
        where collectivite_id = 23
        and referentiel = 'eci'
        and state_id is not null
    ),
    'La vue doit retourner deux résultats'
);


rollback;