-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

drop function claim_collectivite(integer, membre_fonction, text, referentiel[], boolean);

alter table private_collectivite_membre
    drop column est_referent;

comment on function claim_collectivite(integer) is
    'Claims an EPCI : '
        'will succeed with a code 200 if this EPCI does not have referent yet.'
        'If the EPCI was already claimed it will fail with a code 409.';

COMMIT;
