-- Revert tet:shared/action_de_reference_maj_20261013 from pg

BEGIN;

DELETE FROM public.action_de_reference
WHERE code IN ('AR085', 'AR086', 'AR087', 'AR088', 'AR097', 'AR098', 'AR099', 'AR100', 'AR101', 'AR102', 'AR103', 'AR105', 'AR106', 'AR107', 'AR108', 'AR109', 'AR110', 'AR111', 'AR112');

UPDATE public.action_de_reference
SET titre = 'Sensibiliser aux enjeux des mobilités alternatives à la voiture individuelle',
    description = 'Sensibiliser aux enjeux des mobilités alternatives à la voiture individuelle/autosolisme, en prenant en compte les publics précaires.',
    leviers = ARRAY['velo_transport_commun', 'covoiturage']::public.levier_ges_id[],
    categories = ARRAY['sensibilisation']::public.volet_categorie[]
WHERE code = 'AR016';

UPDATE public.action_de_reference
SET titre = 'Aménager des cheminements piétons continus et accessibles',
    description = 'Faciliter les déplacements à pied en reliant les logements, les services, les commerces et les équipements par des parcours continus, sûrs et accessibles. Les aménagements peuvent améliorer le confort de marche, notamment pour les personnes à mobilité réduite et lors des fortes chaleurs.',
    leviers = ARRAY['velo_transport_commun']::public.levier_ges_id[],
    categories = ARRAY['amenagement']::public.volet_categorie[]
WHERE code = 'AR061';

COMMIT;
