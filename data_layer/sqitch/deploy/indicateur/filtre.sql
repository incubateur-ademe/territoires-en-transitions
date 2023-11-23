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
    returns setof personne
    rows 1
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
    returns setof indicateur_definition
    rows 1
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
    definition_perso(indicateur_definitions)
    returns setof indicateur_personnalise_definition
    rows 1
    language sql
    stable
begin
    atomic
    select ipd
    from indicateur_personnalise_definition ipd
    where ipd.id = $1.indicateur_perso_id;
end;
comment on function definition_perso(indicateur_definitions) is
    'La définition de l''indicateur personnalisé.';

create function
    private.rempli(collectivite_id integer, indicateur_id indicateur_id)
    returns bool
    language sql
    stable
begin
    atomic
    with remplissage as (
        -- indicateur référentiel, résultats saisis
        select count(valeur) > 0 as rempli
        from indicateur_resultat ir
        where ir.collectivite_id = $1
          and ir.indicateur_id = $2
          and valeur is not null

        union

        -- indicateur référentiel, résultats saisis, valeur alternative
        select count(valeur) > 0 as rempli
        from indicateur_resultat ir
                 join indicateur_definition def on ir.indicateur_id = def.valeur_indicateur
        where ir.collectivite_id = $1
          and def.id = $2
          and valeur is not null

        union

        -- indicateur référentiel, résultats importés
        select count(valeur) > 0
        from indicateur_resultat_import iri
        where iri.collectivite_id = $1
          and iri.indicateur_id = $2

        union

        -- indicateur référentiel, résultats importés, valeur alternative
        select count(valeur) > 0
        from indicateur_resultat_import iri
                 join indicateur_definition def on iri.indicateur_id = def.valeur_indicateur
        where iri.collectivite_id = $1
          and def.id = $2)
    select bool_or(rempli)
    from remplissage;
end;
comment on function private.rempli(integer, indicateur_id) is
    'Vrai si l''indicateur est rempli.';

create function
    private.rempli(indicateur_perso_id integer)
    returns bool
    language sql
    stable
begin
    atomic
    select count(valeur) > 0
    from indicateur_personnalise_resultat ipr
    where ipr.indicateur_id = $1;
end;
comment on function private.rempli(integer) is
    'Vrai si l''indicateur est rempli.';


create function
    rempli(indicateur_definitions)
    returns bool
    language sql
    stable
begin
    atomic
    return case
               when $1.indicateur_perso_id is null
                   then
                   private.rempli($1.collectivite_id, $1.indicateur_id)
               else
                   private.rempli($1.indicateur_perso_id)
        end;
end;
comment on function rempli(indicateur_definitions) is
    'Vrai si l''indicateur est rempli.';

create function
    enfants(indicateur_definitions)
    returns setof indicateur_definitions
    language sql
    stable
begin
    atomic
    select $1.collectivite_id as collectivite_id,
           definition.id      as indicateur_id,
           null::integer      as indicateur_perso_id,
           definition.nom     as nom,
           definition.description,
           definition.unite
    from indicateur_definition definition
    where definition.parent = $1.indicateur_id;
end;
comment on function enfants(indicateur_definitions) is
    'Définitions des indicateurs enfants d''un indicateur composé.';

create function
    enfants(indicateur_definition)
    returns setof indicateur_definition
    language sql
    stable
begin
    atomic
    select def
    from indicateur_definition def
    where def.parent = $1.id;
end;
comment on function enfants(indicateur_definition) is
    'Définitions des indicateurs enfants d''un indicateur composé.';

create function
    indicateur_action(indicateur_definitions)
    returns setof indicateur_action
    language sql
    stable
begin
    atomic
    select ia
    from indicateur_action ia
    where ia.indicateur_id = $1.indicateur_id;
end;
comment on function indicateur_action(indicateur_definitions) is
    'La relation entre un indicateur prédéfini et des actions des référentiels.';

COMMIT;
