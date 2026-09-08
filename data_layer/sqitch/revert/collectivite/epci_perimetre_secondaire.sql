-- Revert tet:collectivite/epci_perimetre_secondaire from pg

-- Les périmètres secondaires que le calcul avait posés s'en vont avec lui : ils
-- portent tous `source = 'banatic'` et se reconstituent d'un rejeu. Ceux de
-- l'import des services de l'État restent, ils viennent d'un classeur.
--
-- Le périmètre **principal** des EPCI, lui, ne se défait pas : le change l'a
-- réaligné sur le millésime courant de la composition communale, et rien ne dit
-- quelle valeur lui rendre. Aucun écart n'avait été mesuré au moment du
-- déploiement, donc un revert laisse une base correcte, pas une base d'avant.

BEGIN;

DELETE FROM public.collectivite_perimetre_secondaire WHERE source = 'banatic';

DROP FUNCTION IF EXISTS imports.update_epci_perimetres_from_banatic();

DROP TABLE IF EXISTS imports.epci_commune;

COMMIT;
