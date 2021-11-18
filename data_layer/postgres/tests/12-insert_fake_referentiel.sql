-- Insert a fake referentiel
-- root
insert into action_relation
values ('cae', 'cae', null);

-- axe 1
insert into action_relation
values ('cae_1', 'cae', 'cae');

-- sous-axe
insert into action_relation
values ('cae_1.2', 'cae', 'cae_1');

-- action
insert into action_relation
values ('cae_1.2.3', 'cae', 'cae_1.2');

-- sous-action
insert into action_relation
values ('cae_1.2.3.4', 'cae', 'cae_1.2.3');

-- tache
insert into action_relation
values ('cae_1.2.3.4.5', 'cae', 'cae_1.2.3.4');


-- axe 2
insert into action_relation
values ('cae_2', 'cae', 'cae');

-- sous-axe
insert into action_relation
values ('cae_2.2', 'cae', 'cae_2');

-- action
insert into action_relation
values ('cae_2.2.3', 'cae', 'cae_2.2');

