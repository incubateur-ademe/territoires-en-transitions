-- Verify tet:retool/evaluation on pg

BEGIN;

select collectivite_id,
       "Collectivité",
       referentiel,
       "Identifiant",
       "Titre",
       "Points potentiels",
       "Points realisés",
       "Pourcentage réalisé",
       "Points programmés",
       "Pourcentage programmé",
       "Pourcentage non renseigné",
       "Avancement",
       "Commentaires fusionnés",
       "Commentaire",
       "Modifié le"
from retool_score
where false;

ROLLBACK;
