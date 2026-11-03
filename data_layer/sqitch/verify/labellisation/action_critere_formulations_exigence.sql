-- Verify tet:labellisation/action_critere_formulations_exigence on pg

BEGIN;

select 1 / (case when count(*) = 0 then 1 else 0 end)
from labellisation_action_critere
where (referentiel::text = 'cae'
       and etoile::text = '2'
       and action_id in ('cae_1.1.2.0.1', 'cae_1.1.2.0.2')
       and formulation like '%ou programmer%')
   or (referentiel::text = 'eci'
       and etoile::text = '1'
       and action_id in ('eci_2.1.0', 'eci_2.2.0', 'eci_2.3.0', 'eci_2.4.0')
       and formulation not like '%ou programmer%');

ROLLBACK;
