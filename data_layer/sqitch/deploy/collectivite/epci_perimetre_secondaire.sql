-- Deploy tet:collectivite/epci_perimetre_secondaire to pg
-- requires: collectivite/perimetre_secondaire
-- requires: collectivite/imports

-- Les départements et régions qu'un EPCI couvre au-delà de son siège.
--
-- `collectivite` ne porte qu'un département et une région — ceux du siège
-- d'après BANATIC — alors qu'un EPCI à fiscalité propre peut en chevaucher
-- plusieurs : Redon Agglomération s'étale sur 35, 44 et 56, donc sur la Bretagne
-- et les Pays de la Loire. Sans ses périmètres secondaires, la DDT du Morbihan
-- et la DREAL Pays de la Loire ne voient pas son dépôt PCAET, qui couvre
-- pourtant leurs communes.
--
-- 89 EPCI sur 1 255 débordent d'un département, 26 d'une région.
--
-- Le calcul se fait depuis la **composition communale** : chaque commune membre
-- apporte son département, et par `imports.departement` sa région. Il ne peut
-- pas partir de `collectivite_relations`, qui écarte les communes de moins de
-- 3 000 habitants et ne retient que celles présentes dans `collectivite` — 3 668
-- relations pour 34 871 lignes de source, de quoi manquer 67 des 89 EPCI.

BEGIN;

-- La composition communale, telle que BANATIC la publie : une ligne par couple
-- (EPCI, commune membre), sans seuil de population.
--
-- Elle est peuplée par un seed généré (`11-epci_commune.sql`) et remplacée à
-- chaque rejeu annuel de l'import. `siege_departement_code` est répété sur
-- chaque ligne par la source ; le garder évite de relire le fichier pour
-- retrouver le siège d'un groupement.
CREATE TABLE imports.epci_commune (
    siren_epci             siren      NOT NULL,
    insee_commune          codegeo    NOT NULL,
    departement_code       varchar(3) NOT NULL REFERENCES imports.departement,
    siege_departement_code varchar(3) NOT NULL REFERENCES imports.departement,

    PRIMARY KEY (siren_epci, insee_commune)
);

-- Pas de clé étrangère vers `imports.commune` : 32 codes INSEE de la source n'y
-- figurent pas — des communes nouvelles postérieures au millésime du seed, et
-- Paris, que `03-commune.sql` stocke en vingt arrondissements. Cette table
-- existe justement pour ne pas dépendre d'eux : le département de la commune
-- vient de la source, jamais d'une traversée par le code INSEE.

CREATE INDEX epci_commune_departement_code_idx
    ON imports.epci_commune (departement_code);

COMMENT ON TABLE imports.epci_commune IS 'Composition communale des EPCI à fiscalité propre d''après BANATIC : une ligne par (EPCI, commune membre), sans seuil de population. Matière première des périmètres géographiques secondaires.';
COMMENT ON COLUMN imports.epci_commune.departement_code IS 'Département de la commune membre. Son écart avec siege_departement_code donne les périmètres secondaires de l''EPCI.';
COMMENT ON COLUMN imports.epci_commune.siege_departement_code IS 'Département du siège du groupement, répété par la source sur chaque ligne. Devient le périmètre principal de la collectivité.';

-- Le calcul des périmètres, écrit une fois et une seule.
--
-- Deux appelants s'en servent : le seed `11-epci_commune.sql`, joué par ce change
-- sur les bases peuplées et par `seed.sh` sur une base neuve, et le service de
-- rejeu annuel du backend, qui retélécharge la source puis rappelle cette
-- fonction. La règle n'existe donc ni en Python ni en TypeScript.
--
-- Elle vit dans `imports` et non dans `public` : `public` est exposé à PostgREST
-- et `anon` y a USAGE, ce qui ferait de cette fonction une RPC publique. Le
-- schéma `imports` n'a aucun droit accordé.
--
-- Idempotente : deux appels de suite sur la même donnée laissent la base
-- identique.
CREATE OR REPLACE FUNCTION imports.update_epci_perimetres_from_banatic()
    RETURNS integer
    LANGUAGE plpgsql
AS $$
declare
    sieges_incoherents text;
    departements integer;
    regions integer;
begin
    -- Le département du siège doit figurer parmi ceux de ses communes membres.
    -- Aucun écart aujourd'hui sur les 1 255 EPCI de la source ; s'il en
    -- apparaissait un, le périmètre principal deviendrait faux et les
    -- secondaires se calculeraient contre lui. Mieux vaut refuser le rejeu.
    select string_agg(
               format('%s (siège %s)', siege.siren_epci, siege.siege_departement_code),
               ', '
               order by siege.siren_epci
           )
      into sieges_incoherents
      from (
            select distinct siren_epci, siege_departement_code
              from imports.epci_commune
           ) as siege
     where not exists (
            select 1
              from imports.epci_commune as membre
             where membre.siren_epci = siege.siren_epci
               and membre.departement_code = siege.siege_departement_code
           );

    if sieges_incoherents is not null then
        raise exception
            'composition communale incohérente : le département du siège ne figure pas parmi les communes membres — %',
            sieges_incoherents;
    end if;

    -- Le périmètre principal d'abord : les secondaires se définissent par
    -- différence avec lui, et la composition communale est un millésime plus
    -- frais que `imports.banatic`, d'où `06-complete_collectivite_with_import.sql`
    -- le tenait. Un siège qui déménage se répercute donc ici.
    --
    -- `is distinct from` borne l'écriture à ce qui change vraiment, et couvre le
    -- cas d'un EPCI dont le périmètre était resté nul faute de ligne BANATIC.
    update public.collectivite as c
       set departement_code = siege.siege_departement_code,
           region_code = d.region_code
      from (
            select distinct siren_epci, siege_departement_code
              from imports.epci_commune
           ) as siege
      join imports.departement as d on d.code = siege.siege_departement_code
     where c.type = 'epci'
       and c.siren = siege.siren_epci
       and (c.departement_code is distinct from siege.siege_departement_code
         or c.region_code is distinct from d.region_code);

    -- Nos lignes s'en vont avant d'être réécrites : c'est ce qui fait
    -- disparaître un périmètre après une fusion de communes, qu'un
    -- `on conflict do nothing` seul ne saurait pas voir. La clause sur `source`
    -- laisse intactes celles de l'import des services de l'État, qui viennent
    -- d'un classeur et ne se recalculent pas.
    delete from public.collectivite_perimetre_secondaire where source = 'banatic';

    -- Les départements, puis les régions. Les deux mailles sont nécessaires :
    -- `instructeurCouvreCollectivite` n'en compare qu'une, choisie par le type de
    -- l'instructeur, et une région omise laisserait la DREAL débordée hors du
    -- dossier même avec le bon département.
    --
    -- `on conflict do nothing` n'est pas une précaution de style : les index
    -- uniques ne portent pas `source`, donc un code déjà tenu par l'import des
    -- services de l'État ferait échouer l'insertion.
    insert into public.collectivite_perimetre_secondaire (collectivite_id, departement_code, source)
    select distinct c.id, ec.departement_code, 'banatic'
      from imports.epci_commune as ec
      join public.collectivite as c on c.type = 'epci' and c.siren = ec.siren_epci
     where ec.departement_code is distinct from c.departement_code
        on conflict (collectivite_id, departement_code) where departement_code is not null
        do nothing;

    get diagnostics departements = row_count;

    insert into public.collectivite_perimetre_secondaire (collectivite_id, region_code, source)
    select distinct c.id, d.region_code, 'banatic'
      from imports.epci_commune as ec
      join imports.departement as d on d.code = ec.departement_code
      join public.collectivite as c on c.type = 'epci' and c.siren = ec.siren_epci
     where d.region_code is distinct from c.region_code
        on conflict (collectivite_id, region_code) where region_code is not null
        do nothing;

    get diagnostics regions = row_count;

    return departements + regions;
end;
$$;

COMMENT ON FUNCTION imports.update_epci_perimetres_from_banatic() IS 'Recalcule le périmètre principal et les périmètres secondaires des EPCI depuis imports.epci_commune. Ne touche que les lignes de source banatic. Rend le nombre de périmètres secondaires écrits.';

-- `\ir` résout relativement à ce fichier, pas au répertoire de travail.
-- Le seed porte le chargement **et** l'appel du calcul : sur une base neuve, ce
-- change tourne avant que les EPCI existent, et c'est `seed.sh` qui le rejouera
-- utilement plus tard.
\ir ../../../seed/imports/11-epci_commune.sql

COMMIT;
