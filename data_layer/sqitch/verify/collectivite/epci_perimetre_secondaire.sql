-- Verify tet:collectivite/epci_perimetre_secondaire on pg

BEGIN;

-- La table et ses colonnes.
SELECT siren_epci, insee_commune, departement_code, siege_departement_code
  FROM imports.epci_commune
 WHERE false;

DO $$
begin
    -- La clé primaire tient l'unicité du couple, sur laquelle le rejeu s'appuie.
    if not exists (
        select 1
          from pg_constraint
         where conname = 'epci_commune_pkey'
           and conrelid = 'imports.epci_commune'::regclass
    ) then
        raise exception 'clé primaire epci_commune_pkey absente';
    end if;

    -- La fonction de calcul, seul endroit où la règle est écrite.
    if not exists (
        select 1
          from pg_proc as p
          join pg_namespace as n on n.oid = p.pronamespace
         where n.nspname = 'imports'
           and p.proname = 'update_epci_perimetres_from_banatic'
    ) then
        raise exception 'fonction imports.update_epci_perimetres_from_banatic() absente';
    end if;

    -- `imports` ne doit rester lisible que par la connexion directe du backend :
    -- une fonction posée dans `public` serait une RPC PostgREST publique.
    if has_schema_privilege('anon', 'imports', 'usage')
        or has_schema_privilege('authenticated', 'imports', 'usage') then
        raise exception 'le schéma imports est devenu accessible à anon ou authenticated';
    end if;
end
$$;

-- Les invariants de données ne valent que sur une base peuplée : en CI le
-- déploiement précède le seed, et la table est alors vide.
DO $$
declare
    departements text[];
    regions text[];
begin
    if not exists (select 1 from imports.epci_commune) then
        return;
    end if;

    -- Le siège figure toujours parmi les communes membres. C'est l'invariant que
    -- la fonction vérifie avant d'écrire ; le redire ici attrape une table
    -- peuplée par un autre chemin que le calcul.
    if exists (
        select 1
          from (
                select distinct siren_epci, siege_departement_code
                  from imports.epci_commune
               ) as siege
         where not exists (
                select 1
                  from imports.epci_commune as membre
                 where membre.siren_epci = siege.siren_epci
                   and membre.departement_code = siege.siege_departement_code
               )
    ) then
        raise exception 'un département de siège ne figure pas parmi les communes membres';
    end if;

    -- Un périmètre secondaire ne redit jamais le principal : `perimetreCodesSql`
    -- concatène les deux sans `distinct`, un doublon polluerait la liste.
    if exists (
        select 1
          from public.collectivite_perimetre_secondaire as p
          join public.collectivite as c on c.id = p.collectivite_id
         where p.source = 'banatic'
           and (p.departement_code = c.departement_code
             or p.region_code = c.region_code)
    ) then
        raise exception 'un périmètre secondaire banatic répète le périmètre principal';
    end if;

    -- Témoin nommé : Redon Agglomération, le cas de la carte. Siège en
    -- Ille-et-Vilaine, communes membres en Loire-Atlantique et dans le Morbihan,
    -- donc à cheval sur la Bretagne et les Pays de la Loire.
    if not exists (select 1 from public.collectivite where siren = '243500741' and type = 'epci') then
        return;
    end if;

    -- `filter` est indispensable : les lignes portent un seul code, donc chaque
    -- ligne de département a une région nulle et réciproquement.
    select array_agg(p.departement_code::text order by p.departement_code)
               filter (where p.departement_code is not null),
           array_agg(p.region_code::text order by p.region_code)
               filter (where p.region_code is not null)
      into departements, regions
      from public.collectivite as c
      left join public.collectivite_perimetre_secondaire as p
             on p.collectivite_id = c.id and p.source = 'banatic'
     where c.siren = '243500741'
       and c.type = 'epci';

    if departements is distinct from array['44', '56']::text[] then
        raise exception
            'Redon Agglomération : départements secondaires attendus {44,56}, lus %',
            coalesce(departements::text, 'aucun');
    end if;

    if regions is distinct from array['52']::text[] then
        raise exception
            'Redon Agglomération : région secondaire attendue {52}, lue %',
            coalesce(regions::text, 'aucune');
    end if;
end
$$;

ROLLBACK;
