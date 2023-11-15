-- Deploy tet:indicateur/filtre to pg

BEGIN;

create or replace function
    thematiques(indicateur_definitions)
    returns setof thematique
    language sql
    stable
begin
    atomic
    select thematique
    from indicateur_definition definition
             join thematique
                  on thematique.md_id = any (definition.thematiques)
    where definition.id = $1.indicateur_id
    union
    select thematique
    from indicateur_personnalise_definition definition
             join indicateur_personnalise_thematique it
                  on definition.id = it.indicateur_id
             join thematique on it.thematique_id = thematique.id
    where definition.id = $1.indicateur_perso_id;
end;
comment on function thematiques(indicateur_definitions) is
    'La thématique d''un indicateur, pour filtrer.';

create function
    axe(indicateur_definitions)
    returns setof axe
    language sql
    stable
begin
    atomic
    select axe
    from fiche_action_indicateur fai
             join fiche_action_axe faa using (fiche_id)
             join axe on faa.axe_id = axe.id
    where fai.indicateur_id = $1.indicateur_id
       or fai.indicateur_personnalise_id = $1.indicateur_perso_id;
end;
comment on function axe is
    'L''axe d''un indicateur, pour filtrer par son plan.';

create function
    pilote(indicateur_definitions)
    returns setof indicateur_pilote
    language sql
    stable
begin
    atomic
    -- indicateur prédéfini
    select ip
    from indicateur_pilote ip
    where ($1.indicateur_id is not null
        and ip.indicateur_id = $1.indicateur_id
        and collectivite_id = $1.collectivite_id)
       or ($1.indicateur_perso_id is not null
        and ip.indicateur_perso_id = $1.indicateur_perso_id);
end;
comment on function pilote is
    'Le pilote d''un indicateur, pour filtrer par son user_id ou son tag_id.';

create function
    personne(indicateur_pilote)
    returns setof personne
    language sql
    stable
begin
    atomic
    select private.get_personne($1);
end;
comment on function personne(indicateur_pilote) is
    'Les personnes associée à un indicateur.';

create function
    service(indicateur_definitions)
    returns setof indicateur_service_tag
    language sql
    stable
begin
    atomic
    select ist
    from indicateur_service_tag ist
    where ist.indicateur_id = $1.indicateur_id
       or ist.indicateur_perso_id = $1.indicateur_perso_id;
end;
comment on function service is
    'Le service d''un indicateur, pour filtrer par son tag_id.';

create function
    definition_referentiel(indicateur_definitions)
    returns setof indicateur_definition rows 1
    language sql
    stable
begin
    atomic
    select ist
    from indicateur_definition ist
    where ist.id = $1.indicateur_id;
end;
comment on function definition_referentiel is
    'La définition de l''indicateur provenant du référentiel.';

create function
    rempli(indicateur_definitions)
    returns bool
    language sql
    stable
begin
    atomic
    select rempli
    from indicateur_rempli ir
    where ir.indicateur_id = $1.indicateur_id
       or ir.perso_id = $1.indicateur_perso_id;
end;
comment on function rempli is
    'Vrai si l''indicateur est rempli.';

create function
    enfants(indicateur_definitions)
    returns setof indicateur_definition
    language sql
    stable
begin
    atomic
    select ist
    from indicateur_definition ist
    where ist.parent = $1.indicateur_id;
end;
comment on function enfants is
    'Définitions des indicateurs enfants d''un indicateur composé.';

COMMIT;
