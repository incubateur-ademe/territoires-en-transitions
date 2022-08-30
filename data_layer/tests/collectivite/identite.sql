begin;
select plan(6);

-- test the view used by the client.
select *
into nantes_display
from collectivite_carte_identite
where nom ilike 'nantes%';

select ok((select count(*) = 1 from nantes_display where type_collectivite = 'commune'),
          'Nantes est une commune'
           );


select ok((select count(*) = 1 from nantes_display where type_collectivite = 'EPCI' and nom ilike '%métropole'),
          'L''EPCI de Nantes est une métropole'
           );


-- test the view used by the business.
select *
into agen
from collectivite_identite
where id = (select collectivite_id
            from named_collectivite
            where nom ilike 'agen');


select ok((select count(*) = 1 from agen), 'Agen ne compte qu''une seule collectivité.');
select ok((select '{commune}' = type from agen), 'Agen est une commune');
select ok((select '{moins_de_100000}' = population from agen), 'Agen a moins de 100 000 habitants');

select *
into sictom
from collectivite_identite
where id = (select collectivite_id
            from named_collectivite
            where nom ilike 'SICTOM%' limit 1);

select ok((select '{EPCI, syndicat}' = type from sictom), 'Un SICTOM devrait être un syndicat');

rollback;
