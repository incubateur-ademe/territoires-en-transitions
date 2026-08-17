-- Deploy tet:demarche/pcaet_diagnostic_ordre_reglementaire to pg
-- requires: demarche/pcaet_diagnostic

BEGIN;

-- Le ministère fixe l'ordre de présentation du diagnostic : émissions de GES,
-- polluants atmosphériques, séquestration carbone, consommation énergétique
-- finale, énergies renouvelables, vulnérabilité du territoire. Seuls les
-- polluants et la consommation énergétique sont à permuter, les quatre autres
-- topics sont déjà à leur rang.
UPDATE public.demarche_pcaet_topic
SET display_order = 2,
    modified_at   = now()
WHERE code = 'polluants_atmospheriques';

UPDATE public.demarche_pcaet_topic
SET display_order = 4,
    modified_at   = now()
WHERE code = 'consommation_energetique';

-- « Profil énergie climat » couvrait l'énergie et le climat, avant que la
-- consommation énergétique finale ne devienne un topic à part entière. Ce topic
-- ne porte plus que les émissions de GES, son libellé le dit désormais. Le code
-- ne bouge pas : il est porté par l'URL et les tests e2e.
UPDATE public.demarche_pcaet_topic
SET label       = 'Émissions GES',
    modified_at = now()
WHERE code = 'profil_energie_climat';

COMMIT;
