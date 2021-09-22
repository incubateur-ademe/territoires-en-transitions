insert into planaction (epci_id, uid, nom, categories, fiches_by_category, latest, deleted)

select epci_id,
       'plan_collectivite' uid,
       'Plan d''actions'   nom,
       categories,
       fiches_by_category,
       true                latest,
       false               deleted
from (
         select epci_id,
                json_agg(
                        json_build_object('nom', nom, 'uid', uid)
                    ) categories,
                json_agg(
                        json_build_object('fiche_uid', fiche_uids, 'category_uid', uid)
                    ) fiches_by_category

         from (
                  select distinct on (uid) epci_id,
                                           uid,
                                           nom,
                                           fiche_actions_uids,
                                           jsonb_array_elements_text(fiche_actions_uids) fiche_uids
                  from ficheactioncategorie
                  where latest
                    and not deleted
              ) as epci_cats
         group by epci_id
     ) as results;
