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
    'Les thématiques associées à un indicateur.';

create function
    axes(indicateur_definitions)
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
comment on function axes(indicateur_definitions) is
    'Les axes (plans d''action) associés à un indicateur.';

create function
    pilotes(indicateur_definitions)
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
comment on function pilotes(indicateur_definitions) is
    'Les personnes pilotes associées à un indicateur.';

create function
    personne(indicateur_pilote)
    returns setof personne rows 1
    language sql
    stable
begin
    atomic
    select private.get_personne($1);
end;
comment on function personne(indicateur_pilote) is
    'Une personne associée comme personne pilote d''un indicateur.';

create function
    services(indicateur_definitions)
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
comment on function services(indicateur_definitions) is
    'Les services associés à un indicateur.';

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
comment on function definition_referentiel(indicateur_definitions) is
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
comment on function rempli(indicateur_definitions) is
    'Vrai si l''indicateur est rempli.';

create function
    enfants(indicateur_definitions)
    returns setof indicateur_definition
    language sql
    stable
begin
    atomic
    select def
    from indicateur_definition def
    where def.parent = $1.indicateur_id;
end;
comment on function enfants(indicateur_definitions) is
    'Définitions des indicateurs enfants d''un indicateur composé.';

create function
    rempli(indicateur_definition)
    returns bool
    language sql
    stable
begin
    atomic
    select rempli
    from indicateur_rempli ir
    where ir.indicateur_id = $1.id;
end;
comment on function rempli(indicateur_definition) is
    'Vrai si l''indicateur prédéfini est rempli.';

create function
    action_ids(indicateur_definitions)
    returns action_id[]
    language sql
    stable
begin
    atomic
    select array_agg(action_id)
    from indicateur_action ia
    where ia.indicateur_id = $1.indicateur_id;
end;
comment on function action_ids(indicateur_definitions) is
    'Les ids des actions associées à un indicateur.';

drop function action_ids(indicateur_definition);
create function
    action_ids(indicateur_definition)
    returns action_id[]
    language sql
    stable
begin
    atomic
    select array_agg(action_id)
    from indicateur_action ia
    where ia.indicateur_id = $1.id;
end;
comment on function action_ids(indicateur_definition) is
    'Les ids des actions associées à un indicateur.';

COMMIT;
