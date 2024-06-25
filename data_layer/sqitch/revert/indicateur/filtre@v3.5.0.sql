-- Deploy tet:indicateur/filtre to pg

BEGIN;

create or replace function
    thematiques(indicateur_definitions)
    returns setof thematique
    language sql
    security definer
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

create or replace function
    definition_referentiel(indicateur_definitions)
    returns setof indicateur_definition
    rows 1
    language sql
    security definer
    stable
begin
    atomic
    select ist
    from indicateur_definition ist
    where ist.id = $1.indicateur_id;
end;
comment on function definition_referentiel(indicateur_definitions) is
    'La définition de l''indicateur provenant du référentiel.';

create or replace function
    axes(indicateur_definitions)
    returns setof axe
    language sql
    security definer
    stable
begin
    atomic
    select axe
    from fiche_action_indicateur fai
             join fiche_action_axe faa using (fiche_id)
             join axe on faa.axe_id = axe.id
             left join definition_referentiel($1) def on true
    where
       -- indicateur prédéfini
        ($1.indicateur_id is not null
            and fai.indicateur_id = $1.indicateur_id
            and collectivite_id = $1.collectivite_id)
       -- indicateur prédéfini dont les valeurs sont celles d'un autre
       or ($1.indicateur_id is not null
        and fai.indicateur_id = def.valeur_indicateur
        and collectivite_id = $1.collectivite_id)
       -- indicateur perso
       or ($1.indicateur_perso_id is not null
        and fai.indicateur_personnalise_id = $1.indicateur_perso_id);
end;
comment on function axes(indicateur_definitions) is
    'Les axes (plans d''action) associés à un indicateur.';

create or replace function
    fiches_non_classees(indicateur_definitions)
    returns setof fiche_action_indicateur
    language sql
    security definer
    stable
begin
    atomic
    select fai
    from fiche_action_indicateur fai
             join fiche_action fa on fa.id = fai.fiche_id and fa.collectivite_id = $1.collectivite_id
             left join definition_referentiel($1) def on true
    where not exists (select from fiche_action_axe faa where faa.fiche_id = fai.fiche_id)
      and (
        -- indicateur prédéfini
                fai.indicateur_id = $1.indicateur_id
            -- indicateur perso
            or fai.indicateur_personnalise_id = $1.indicateur_perso_id
            -- indicateur prédéfini dont les valeurs sont celles d'un autre
            or def.valeur_indicateur = $1.indicateur_id
        );
end;
comment on function fiches_non_classees(indicateur_definitions) is
    'Les fiches non classées (sans plan d''action) associées à un indicateur.';

create or replace function
    pilotes(indicateur_definitions)
    returns setof indicateur_pilote
    language sql
    security definer
    stable
begin
    atomic
    select ip
    from indicateur_pilote ip
             left join definition_referentiel($1) def on true
    where
       -- indicateur prédéfini
        ($1.indicateur_id is not null
            and ip.indicateur_id = $1.indicateur_id
            and collectivite_id = $1.collectivite_id)
       -- indicateur prédéfini dont les valeurs sont celles d'un autre
       or ($1.indicateur_id is not null
        and ip.indicateur_id = def.valeur_indicateur
        and collectivite_id = $1.collectivite_id)
       -- indicateur perso
       or ($1.indicateur_perso_id is not null
        and ip.indicateur_perso_id = $1.indicateur_perso_id);
end;
comment on function pilotes(indicateur_definitions) is
    'Les personnes pilotes associées à un indicateur.';

create or replace function
    personne(indicateur_pilote)
    returns setof personne
    rows 1
    language sql
    security definer
    stable
begin
    atomic
    select private.get_personne($1);
end;
comment on function personne(indicateur_pilote) is
    'Une personne associée comme personne pilote d''un indicateur.';

create or replace function
    services(indicateur_definitions)
    returns setof indicateur_service_tag
    language sql
    security definer
    stable
begin
    atomic
    select ist
    from indicateur_service_tag ist
             left join definition_referentiel($1) def on true
    where
       -- indicateur prédéfini
        ($1.indicateur_id is not null
            and ist.indicateur_id = $1.indicateur_id
            and collectivite_id = $1.collectivite_id)
       -- indicateur prédéfini dont les valeurs sont celles d'un autre
       or ($1.indicateur_id is not null
        and ist.indicateur_id = def.valeur_indicateur
        and collectivite_id = $1.collectivite_id)
       -- indicateur perso
       or ($1.indicateur_perso_id is not null
        and ist.indicateur_perso_id = $1.indicateur_perso_id);
end;
comment on function services(indicateur_definitions) is
    'Les services associés à un indicateur.';


create or replace function
    definition_perso(indicateur_definitions)
    returns setof indicateur_personnalise_definition
    rows 1
    language sql
    security definer
    stable
begin
    atomic
    select ipd
    from indicateur_personnalise_definition ipd
    where ipd.id = $1.indicateur_perso_id;
end;
comment on function definition_perso(indicateur_definitions) is
    'La définition de l''indicateur personnalisé.';


create or replace function
    enfants(indicateur_definitions)
    returns setof indicateur_definitions
    language sql
    security definer
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

create or replace function
    enfants(indicateur_definition)
    returns setof indicateur_definition
    language sql
    security definer
    stable
begin
    atomic
    select def
    from indicateur_definition def
    where def.parent = $1.id;
end;
comment on function enfants(indicateur_definition) is
    'Définitions des indicateurs enfants d''un indicateur composé.';

create or replace function
    indicateur_action(indicateur_definitions)
    returns setof indicateur_action
    language sql
    security definer
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
