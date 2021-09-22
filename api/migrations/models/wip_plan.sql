-- install uuid extension.
create extension "uuid-ossp";

-- first pass create default categories
insert into ficheactioncategorie (epci_id, uid, parent_uid, nom, fiche_actions_uids)
select epci_id, uuid_generate_v4(), '', 'Fiches actions non classées', json_agg(uid)
from (
         select epci_id, uid
         from ficheaction
         where latest
           and not deleted

           and uid not in
               (select jsonb_array_elements_text(fiche_actions_uids)
                from ficheactioncategorie
               )
     ) orphans
group by epci_id;

-- second pass make plans
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
                  select epci_id,
                         uid,
                         nom,
                         fiche_uids
                  from ficheactioncategorie
                           cross join lateral (
                      select array_agg(d.elem::text) as fiche_uids
                      from jsonb_array_elements_text(fiche_actions_uids) as d(elem)
                      ) expanded
                  where latest
                    and not deleted
              ) epci_cats
         group by epci_id
     ) results;
