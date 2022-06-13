-- Deploy tet:retool/modification to pg

BEGIN;

create view retool_last_activity
as
select c.collectivite_id,
       c.nom,
       max("as".modified_at) as statut,
       max(ac.modified_at)   as commentaire,
       max(pa.modified_at)   as plan_action,
       max(fa.modified_at)   as fiche_action,
       max(ir.modified_at)   as indicateur,
       max(ic.modified_at)   as indicateur_commentaire,
       max(ipd.modified_at)  as indicateur_perso,
       max(ipr.modified_at)  as indicateur_perso_resultat
from retool_active_collectivite c
         -- referentiel
         left join action_statut "as" on c.collectivite_id = "as".collectivite_id
         left join action_commentaire ac on c.collectivite_id = ac.collectivite_id
    -- plan action
         left join plan_action pa on c.collectivite_id = pa.collectivite_id
         left join fiche_action fa on c.collectivite_id = fa.collectivite_id
    -- indicateurs
         left join indicateur_resultat ir on c.collectivite_id = ir.collectivite_id
         left join indicateur_commentaire ic on c.collectivite_id = ic.collectivite_id
    -- indicateurs perso
         left join indicateur_personnalise_definition ipd on c.collectivite_id = ipd.collectivite_id
         left join indicateur_personnalise_resultat ipr on c.collectivite_id = ipr.collectivite_id
group by c.collectivite_id, c.nom;
comment on view retool_last_activity
    is 'Last activity by collectivité';

COMMIT;
