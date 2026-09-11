-- Deploy tet:demarches/pcaet_avis_un_titre_par_emetteur to pg
-- requires: demarches/pcaet_saisine_perimetre

-- Un avis par émetteur, et un avis qui se réduit à son rapport.
--
-- L'avis de l'autorité environnementale (art. R.122-21) se rend sur une autre
-- plateforme : il n'a pas de titre ici. La DREAL ne porte plus que celui du
-- préfet de région, le conseil régional celui de son président — un seul titre
-- chacun. Le modèle « un avis par titre et par demande » reste en place pour
-- pouvoir accueillir un autre titre un jour.
--
-- Le sens (favorable, avec réserves, défavorable) disparaît : l'avis, c'est le
-- rapport d'instruction joint, et rien d'autre n'était lu.

BEGIN;

-- Les avis rendus à un titre qui n'existe plus ici s'en vont avec lui.
DELETE FROM public.demarche_pcaet_avis
 WHERE au_titre_de = 'autorite_environnementale';

ALTER TABLE public.demarche_pcaet_avis
    DROP CONSTRAINT demarche_pcaet_avis_au_titre_de_check;

ALTER TABLE public.demarche_pcaet_avis
    ADD CONSTRAINT demarche_pcaet_avis_au_titre_de_check
    CHECK (au_titre_de IN ('prefet_region', 'president_region'));

ALTER TABLE public.demarche_pcaet_avis
    DROP COLUMN sens;

COMMENT ON COLUMN public.demarche_pcaet_avis.au_titre_de IS
    'prefet_region | president_region — la DREAL porte le premier, le conseil régional le second. L''avis de l''autorité environnementale se rend sur une autre plateforme.';

COMMENT ON TABLE public.demarche_pcaet_avis IS
    'Avis d''un service instructeur sur une démarche : le rapport d''instruction joint. Un avis par « au titre de », soit 0 à 2 par démarche. L''absence d''avis est un état normal.';

COMMIT;
