-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

comment on function claim_collectivite is
    'Claims an EPCI : '
        'will succeed with a code 200 if this EPCI does not have referent yet.'
        'If the EPCI was already claimed it will fail with a code 409.';

drop function claim_collectivite(integer, membre_fonction, text, referentiel[], est_referent);

alter table private_collectivite_membre
    drop column est_referent;

COMMIT;
