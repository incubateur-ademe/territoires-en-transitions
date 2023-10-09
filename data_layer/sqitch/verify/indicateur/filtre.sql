-- Verify tet:indicateur/filtre on pg

BEGIN;

select collectivite_id,
       indicateur_referentiel,
       indicateur_personnalise,
       titre,
       description,
       unite,
       services,
       pilotes,
       thematiques,
       plans
from private.indicateur_resume
where false;

select collectivite_id,
       indicateur_referentiel,
       indicateur_personnalise,
       titre,
       description,
       unite,
       services,
       pilotes,
       thematiques,
       plans
from public.indicateur_resume
where false;

select has_function_privilege('filter_indicateurs(integer ,boolean, integer[], boolean, personne[], boolean, service_tag[], boolean, thematique[], integer)', 'execute');

ROLLBACK;
