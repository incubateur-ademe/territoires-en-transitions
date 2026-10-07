-- Deploy tet:demarches/pcaet_saisine_perimetre to pg
-- requires: demarches/pcaet_destinataires_dr_ademe_service_national
-- requires: collectivite/perimetre_secondaire

-- Par quel territoire de la déposante un service a-t-il été saisi.
--
-- Un EPCI à fiscalité propre peut chevaucher plusieurs départements et
-- plusieurs régions, et la transmission saisit les services de tous ses
-- territoires : la DDT du Morbihan doit voir le dossier de Redon Agglomération.
-- Mais une saisine n'est pas l'autre. L'avis du préfet de région d'un dossier
-- revient à la DREAL du siège, pas à celle de la région limitrophe, qui le lit
-- sans s'y prononcer.
--
-- Sans cette colonne, une DREAL atteinte par un territoire secondaire se voit
-- attribuer les deux titres de sa famille, qu'elle ne rendra jamais : le dossier
-- ne peut plus s'achever par « avis tous rendus » et attend l'échéance des trois
-- mois. Elle est de surcroît autorisée à déposer, faute de quoi que ce soit qui
-- la distingue de la DREAL du siège.
--
-- Le fait est écrit à la saisine plutôt que déduit à la lecture : le calcul des
-- périmètres se rejoue chaque année depuis Banatic, et un dossier en cours
-- d'instruction ne doit pas changer de nature entre deux millésimes.

BEGIN;

-- `principal` par défaut : les saisines déjà en base l'ont toutes été par le
-- territoire unique que portait alors `collectivite`, et gardent le comportement
-- qu'elles avaient. Aucun rattrapage.
--
-- Le nom dit le fait, pas sa conséquence. Un `lecture_seule` figerait en base la
-- règle du jour ; `perimetre` la laisse dans le domaine, où « secondaire n'attend
-- aucun avis » se teste et se révise.
ALTER TABLE public.demarche_pcaet_demande_avis
    ADD COLUMN perimetre text NOT NULL DEFAULT 'principal'
    CONSTRAINT demarche_pcaet_demande_avis_perimetre_connu
        CHECK (perimetre IN ('principal', 'secondaire'));

COMMENT ON COLUMN public.demarche_pcaet_demande_avis.perimetre IS
    'Le territoire de la déposante qui vaut cette saisine : principal (celui porté par collectivite) ou secondaire (un de collectivite_perimetre_secondaire). Une saisine secondaire reçoit le dossier en lecture — elle n''attend aucun avis, et n''en bloque donc pas la clôture.';

-- Pas d'index : le périmètre ne se cherche jamais seul, toujours en compagnie de
-- `demarche_id` ou de `instructeur_collectivite_id`, l'un et l'autre déjà servis.

COMMIT;
