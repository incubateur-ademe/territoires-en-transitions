begin;
select plan(4);

truncate action_statut;

-----------------
-- Critère 1.1 --
-----------------
select ok((select labellisation.critere_1_1(1, 'cae') = false),
          'La collectivité 1 n''a pas renseigné tout les statuts cae');

-- insert tout les statuts cae
insert into action_statut
select 1, id, 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from action_relation
    where referentiel = 'cae';

select ok((select labellisation.critere_1_1(1, 'cae')),
          'La collectivité 1 a renseigné tout les statuts cae');

select ok((select labellisation.critere_1_1(1, 'eci') = false),
          'La collectivité 1 n''a pas renseigné tout les statuts eci');

-- insert tout les statuts eci
insert into action_statut
select 1, id, 'fait', null, true, '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'
from action_relation
where referentiel = 'eci';

select ok((select labellisation.critere_1_1(1, 'eci')),
          'La collectivité 1 a renseigné tout les statuts eci');


rollback;
