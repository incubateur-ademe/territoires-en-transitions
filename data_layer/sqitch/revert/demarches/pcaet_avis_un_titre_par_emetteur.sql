-- Revert tet:demarches/pcaet_avis_un_titre_par_emetteur from pg

-- Le sens revient, « favorable » faute de mieux pour les avis déjà rendus ; les
-- avis de l'autorité environnementale supprimés au deploy ne reviennent pas.

BEGIN;

ALTER TABLE public.demarche_pcaet_avis
    ADD COLUMN sens text NOT NULL DEFAULT 'favorable'
    CHECK (sens IN ('favorable', 'avec_reserves', 'defavorable'));

ALTER TABLE public.demarche_pcaet_avis
    ALTER COLUMN sens DROP DEFAULT;

ALTER TABLE public.demarche_pcaet_avis
    DROP CONSTRAINT demarche_pcaet_avis_au_titre_de_check;

ALTER TABLE public.demarche_pcaet_avis
    ADD CONSTRAINT demarche_pcaet_avis_au_titre_de_check
    CHECK (au_titre_de IN ('prefet_region', 'autorite_environnementale', 'president_region'));

COMMENT ON COLUMN public.demarche_pcaet_avis.au_titre_de IS
    'prefet_region | autorite_environnementale | president_region — la DREAL porte les deux premiers, le conseil régional le troisième.';

COMMENT ON COLUMN public.demarche_pcaet_avis.sens IS
    'favorable | avec_reserves | defavorable — toujours renseigné, y compris en brouillon (choix de radio).';

COMMENT ON TABLE public.demarche_pcaet_avis IS
    'Avis d''un service instructeur sur une démarche : sens + pièce jointe. Un avis par « au titre de », soit 0 à 3 par démarche, la même PJ pouvant être partagée. L''absence d''avis est un état normal.';

COMMIT;
