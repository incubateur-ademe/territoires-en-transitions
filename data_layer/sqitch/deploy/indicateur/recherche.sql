-- Deploy tet:indicateur/recherche to pg

BEGIN;

-- ajoute l'extension btree_gin pour indexer sur le contenu et les collectivite_id.
create extension if not exists btree_gin;

create function
    cherchable(indicateur_definition)
    returns text
    language sql
    immutable
begin
    atomic
    return unaccent($1.nom || ' ' || $1.description);
end;
comment on function cherchable(indicateur_definition) is
    'Le champ sur lequel effectuer la recherche.';

create index indicateur_definition_fts
    on indicateur_definition
        using gin (to_tsvector('fr', cherchable(indicateur_definition)));

create function
    cherchable(indicateur_personnalise_definition)
    returns text
    language sql
    immutable
begin
    atomic
    return unaccent($1.titre || ' ' || $1.description);
end;
comment on function cherchable(indicateur_personnalise_definition) is
    'Le champ sur lequel effectuer la recherche.';

create index indicateur_personnalise_definition_collectivite on public.indicateur_personnalise_definition using btree (collectivite_id);

create index indicateur_personnalise_definition_fts
    on indicateur_personnalise_definition
        using gin (collectivite_id, to_tsvector('fr', cherchable(indicateur_personnalise_definition)));

create function
    cherchable(indicateur_definitions)
    returns text
    language sql
    immutable
begin
    atomic
    return unaccent($1.nom || ' ' || $1.description);
end;
comment on function cherchable(indicateur_definitions) is
    'Le champ sur lequel effectuer la recherche.';

COMMIT;
