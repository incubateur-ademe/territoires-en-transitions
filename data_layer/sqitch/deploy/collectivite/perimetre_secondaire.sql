-- Deploy tet:collectivite/perimetre_secondaire to pg
-- requires: collectivite/service_etat_import

-- Les périmètres géographiques secondaires d'une collectivité.
--
-- `collectivite` porte **un** code de région et **un** code de département : le
-- périmètre principal. Or plusieurs collectivités en couvrent plusieurs. Une DR
-- ADEME peut piloter deux régions (Océan Indien = La Réunion et Mayotte), et un
-- EPCI peut chevaucher plusieurs départements et régions (Redon Agglomération
-- s'étale sur 44, 56 et 35, donc sur Pays de la Loire et Bretagne).
--
-- Jusqu'ici le second périmètre d'une DR ADEME était rendu par une **seconde
-- ligne** `collectivite`, ce que l'index unique partiel autorise puisqu'il ne
-- porte que sur la région. Le même service existait donc deux fois : deux
-- destinataires pour une transmission, et un SIRET qui ne désignait plus un
-- service mais deux — de quoi rendre impossible le rattachement automatique d'un
-- agent à son service depuis l'organisation que ProConnect renvoie.
--
-- Le périmètre principal reste sur `collectivite` ; les autres viennent ici.

BEGIN;

CREATE TABLE public.collectivite_perimetre_secondaire (
    id               serial      PRIMARY KEY,
    collectivite_id  integer     NOT NULL REFERENCES collectivite (id) ON DELETE CASCADE,
    region_code      varchar(2)  NULL,
    departement_code varchar(3)  NULL,
    source           text        NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),

    -- Une ligne porte un périmètre, pas deux : un code de région **ou** un code
    -- de département. Une collectivité qui déborde sur les deux plans a une
    -- ligne par code.
    CONSTRAINT collectivite_perimetre_secondaire_un_seul_code
        CHECK (num_nonnulls(region_code, departement_code) = 1),

    -- Qui a écrit la ligne. Ce n'est pas une trace décorative : le calcul des
    -- périmètres des EPCI se rejoue périodiquement depuis la composition
    -- communale Banatic, et il doit pouvoir remplacer **ses** lignes sans
    -- emporter celles de l'import des services de l'État.
    CONSTRAINT collectivite_perimetre_secondaire_source_connue
        CHECK (source IN ('import_service_etat', 'banatic'))
);

-- Pas de clé étrangère vers `imports.region` ni `imports.departement` :
-- `collectivite.region_code` n'en a pas non plus, et pour une bonne raison — les
-- fixtures de test prennent des codes en lettres (`AB`, `M1`), hors répertoire,
-- justement pour ne pas se disputer les dix-huit codes réels que l'import des
-- services occupe désormais tous.

CREATE UNIQUE INDEX collectivite_perimetre_secondaire_region_unique
    ON public.collectivite_perimetre_secondaire (collectivite_id, region_code)
    WHERE region_code IS NOT NULL;

CREATE UNIQUE INDEX collectivite_perimetre_secondaire_departement_unique
    ON public.collectivite_perimetre_secondaire (collectivite_id, departement_code)
    WHERE departement_code IS NOT NULL;

CREATE INDEX collectivite_perimetre_secondaire_collectivite_id_idx
    ON public.collectivite_perimetre_secondaire (collectivite_id);

COMMENT ON TABLE public.collectivite_perimetre_secondaire IS 'Périmètres géographiques d''une collectivité au-delà du principal porté par collectivite.region_code / departement_code : une DR ADEME couvrant deux régions, un EPCI chevauchant plusieurs départements.';
COMMENT ON COLUMN public.collectivite_perimetre_secondaire.region_code IS 'Région couverte en plus de collectivite.region_code. Exclusif de departement_code.';
COMMENT ON COLUMN public.collectivite_perimetre_secondaire.departement_code IS 'Département couvert en plus de collectivite.departement_code. Exclusif de region_code.';
COMMENT ON COLUMN public.collectivite_perimetre_secondaire.source IS 'Producteur de la ligne : import_service_etat (classeur ADEME) ou banatic (composition communale des EPCI, rejouée périodiquement). Chaque producteur ne remplace que ses propres lignes.';

-- RLS sans policy : la table se lit par la connexion directe du backend.
ALTER TABLE public.collectivite_perimetre_secondaire ENABLE ROW LEVEL SECURITY;

-- `public` est exposé à PostgREST (supabase/config.toml) et Supabase y applique
-- un GRANT par défaut vers anon/authenticated. Le REVOKE garde une seule porte.
REVOKE ALL ON public.collectivite_perimetre_secondaire FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.collectivite_perimetre_secondaire_id_seq FROM anon, authenticated;

-- Repli des services dédoublés par leur périmètre.
--
-- Sur une base neuve il n'y a rien à replier : l'import ne pose plus qu'une
-- ligne par SIRET, et le corps inclus plus bas y ajoute les régions secondaires.
-- Mais sur une base où `collectivite/service_etat_import` est **déjà** déployé,
-- la seconde ligne existe et ce change ne rejouera pas l'import : c'est ici
-- qu'elle doit disparaître.
--
-- Supprimer une collectivité n'est pas anodin — vingt et une tables la suivent
-- en cascade, dont les démarches, les saisines et les avis. La garde ne les
-- énumère pas à la main : elle interroge `pg_constraint` et refuse de replier
-- une ligne à laquelle **quoi que ce soit** se rattache. Une liste écrite en dur
-- vieillirait mal ; cette garde-là se met à jour toute seule.
--
-- Une seule exception, `collectivite_bucket` : le trigger
-- `after_collectivite_write` pose un bucket de stockage à toute collectivité dès
-- son insertion. Ce n'est pas une donnée *sur* le service, c'est une
-- conséquence de son existence — un doublon en a forcément un, et le garder
-- serait garder un lien vers un service disparu. Le lien s'en va donc avec la
-- ligne, mais seulement si le bucket est vide : un seul fichier dedans et c'est
-- une donnée, qui reprend la voie du refus.
DO $$
DECLARE
    doublon   record;
    reference record;
    presence  boolean;
    bucket    text;
    objets    integer;
BEGIN
    FOR doublon IN
        SELECT garde.id AS garde_id, replie.id AS replie_id, replie.region_code
        FROM collectivite AS garde
        JOIN collectivite AS replie
          ON replie.type = garde.type
         AND replie.siren = garde.siren
         AND replie.nic = garde.nic
         AND replie.id > garde.id
        WHERE garde.type = 'dr_ademe'
          AND garde.siren IS NOT NULL
          AND garde.nic IS NOT NULL
          -- La ligne gardée est la première du SIRET, jamais une intermédiaire.
          AND NOT EXISTS (
              SELECT 1 FROM collectivite AS anterieure
              WHERE anterieure.type = garde.type
                AND anterieure.siren = garde.siren
                AND anterieure.nic = garde.nic
                AND anterieure.id < garde.id
          )
    LOOP
        FOR reference IN
            SELECT conrelid::regclass AS relation,
                   quote_ident(attname) AS colonne
            FROM pg_constraint
            JOIN pg_attribute
              ON pg_attribute.attrelid = pg_constraint.conrelid
             AND pg_attribute.attnum = pg_constraint.conkey[1]
            WHERE contype = 'f'
              AND confrelid = 'collectivite'::regclass
              AND conrelid NOT IN (
                  'collectivite_perimetre_secondaire'::regclass,
                  'collectivite_bucket'::regclass
              )
              AND array_length(conkey, 1) = 1
        LOOP
            EXECUTE format(
                'SELECT EXISTS (SELECT 1 FROM %s WHERE %s = $1)',
                reference.relation, reference.colonne
            ) INTO presence USING doublon.replie_id;

            IF presence THEN
                RAISE EXCEPTION
                    'collectivite #% (doublon de #%) est référencée par %.% : repli impossible, à arbitrer à la main',
                    doublon.replie_id, doublon.garde_id, reference.relation, reference.colonne;
            END IF;
        END LOOP;

        SELECT bucket_id INTO bucket
        FROM collectivite_bucket
        WHERE collectivite_id = doublon.replie_id;

        IF bucket IS NOT NULL THEN
            SELECT count(*) INTO objets
            FROM storage.objects
            WHERE bucket_id = bucket;

            IF objets > 0 THEN
                RAISE EXCEPTION
                    'le bucket % de la collectivite #% contient % objet(s) : repli impossible, a arbitrer a la main',
                    bucket, doublon.replie_id, objets;
            END IF;

            -- Le lien s'en va ; la ligne de `storage.buckets`, non. Supabase
            -- protège ses tables (`storage.protect_delete`) et veut qu'on passe
            -- par son API. Un bucket vide et sans propriétaire est un déchet
            -- inoffensif, et c'est déjà ce que laisse derrière lui le nettoyage
            -- des fixtures de test.
            DELETE FROM collectivite_bucket WHERE collectivite_id = doublon.replie_id;
        END IF;

        INSERT INTO collectivite_perimetre_secondaire (collectivite_id, region_code, source)
        VALUES (doublon.garde_id, doublon.region_code, 'import_service_etat')
        ON CONFLICT (collectivite_id, region_code) WHERE region_code IS NOT NULL
        DO NOTHING;

        DELETE FROM collectivite WHERE id = doublon.replie_id;

        RAISE NOTICE 'collectivite #% repliée sur #% : région % devient un périmètre secondaire',
            doublon.replie_id, doublon.garde_id, doublon.region_code;
    END LOOP;
END $$;

-- Les périmètres secondaires de l'import des services de l'État. Fichier généré,
-- séparé de `09-service_etat.sql` parce que celui-là est inclus par un change
-- antérieur : sur une base neuve il serait joué avant que cette table existe.
--
-- `\ir` résout relativement à ce fichier, pas au répertoire de travail.
\ir ../../../seed/imports/10-service_etat_perimetre_secondaire.sql

COMMIT;
