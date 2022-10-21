begin;
select plan(6);

truncate audit cascade;

-- Crée des audits de test
insert into audit(collectivite_id, referentiel, statut)
values
    (23, 'eci', 'en cours'),
    (23, 'eci', 'audite'),
    (23, 'cae', 'en cours'),
    (24, 'eci', 'en cours'),
    (25, 'eci', 'audite');

-- Test fonction get_current_audit - audit existant
select ok(
    (
        select a.id = get_current_audit(23, 'eci')
        from audit a
        where a.collectivite_id = 23
        and a.referentiel = 'eci'
        and a.statut = 'en cours'
    ),
    'Test fonction get_current_audit - audit existant'
);
-- Test fonction get_current_audit - audit ferme
select ok(
    (select get_current_audit(25, 'eci') is null),
    'Test fonction get_current_audit - audit ferme'
);
-- Test fonction get_current_audit - audit inexistant
select ok(
    (select get_current_audit(26, 'eci') is null),
    'Test fonction get_current_audit - audit inexistant'
);


-- Crée des action_audit_state
insert into action_audit_state (action_id, collectivite_id, modified_by)
values
    ('eci_2.2.1.1', '23', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'),
    ('eci_2.2.1.2', '23', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'),
    ('cae_2.1.1.1', '23', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'),
    ('eci_2.2.1.1', '24', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561');

-- Test trigger get_audit_id - audit trouve
select ok(
    (
        select a.audit_id is not null
        from action_audit_state a
        where a.collectivite_id = 23
        and a.action_id = 'eci_2.2.1.1'
    ),
    'Test trigger get_audit_id - audit trouve'
);

-- Test trigger get_audit_id - audit pas trouve

prepare my_thrower as
    insert into action_audit_state (action_id, collectivite_id, modified_by)
    values ('eci_2.2.1.1', '25', '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561');
select throws_ok(
    'my_thrower',
    'Pas d audit en cours ou existant à rattacher',
    'Test trigger get_audit_id - audit pas trouve'
);

-- Test vue pour une collectivite et un referentiel
select ok(
    (
        select count(*) = 2
        from get_action_audit_state_list
        where collectivite_id = 23
        and referentiel = 'eci'
    ),
    'Test vue pour une collectivite et un referentiel'
);


rollback;