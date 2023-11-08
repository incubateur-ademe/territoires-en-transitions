-- Deploy tet:indicateur/filtre to pg

BEGIN;

create or replace function
    thematique(indicateur_definitions)
    returns setof thematique
    language sql
    stable
begin
    atomic
    select case
               when $1.indicateur_id is not null -- indicateur prédéfini
                   then
                   (select thematique
                    from indicateur_definition definition
                             join thematique
                                  on thematique.md_id = any (definition.thematiques)
                    where definition.id = $1.indicateur_id)
               else -- indicateur personnalisé
                   (select thematique
                    from indicateur_personnalise_definition definition
                             join indicateur_personnalise_thematique it
                                  on definition.id = it.indicateur_id
                             join thematique on it.thematique_id = thematique.id
                    where definition.id = $1.indicateur_perso_id)
               end;
end;
comment on function thematique is
    'La thématique d''un indicateur, pour filtrer.';

create or replace function
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

-- todo fusionner indicateur_pilote et indicateur_personnalise_pilote

create or replace function
    pilote(indicateur_definitions)
    returns setof indicateur_pilote
    language sql
    stable
begin
    atomic
    select ip
    from indicateur_pilote ip
    where ip.indicateur_id = $1.indicateur_id;
end;
comment on function pilote is
    'Le pilote d''un indicateur, pour filtrer par son user_id ou son tag_id.';

-- todo fusionner indicateur_service_tag et indicateur_perso_service_tag

create or replace function
    service(indicateur_definitions)
    returns setof indicateur_service_tag
    language sql
    stable
begin
    atomic
    select ist
    from indicateur_service_tag ist
    where ist.indicateur_id = $1.indicateur_id;
end;
comment on function service is
    'Le service d''un indicateur, pour filtrer par son tag_id.';

create or replace function
    definition_referentiel(indicateur_definitions)
    returns setof indicateur_definition
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

create or replace function
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

COMMIT;
