-- upgrade --
create extension if not exists "uuid-ossp";

CREATE TABLE IF NOT EXISTS "planaction" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "epci_id" VARCHAR(36) NOT NULL,
    "uid" VARCHAR(36) NOT NULL,
    "nom" VARCHAR(300) NOT NULL,
    "categories" JSONB NOT NULL,
    "fiches_by_category" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "modified_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "latest" BOOL NOT NULL,
    "deleted" BOOL NOT NULL
);

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

insert into planaction (epci_id, uid, nom, categories, fiches_by_category, latest, deleted)
select step1.epci_id,
       'plan_collectivite'                  uid,
       'Plan d''actions de la collectivité' nom,
       categories,
       fiches_by_category,
       true                                 latest,
       false                                deleted
from (
         select epci_id,
                json_agg(
                        json_build_object('fiche_uid', fiche_uid, 'category_uid', uid)
                    ) fiches_by_category

         from (
                  select epci_id,
                         uid,
                         jsonb_array_elements_text(fiche_actions_uids) fiche_uid
                  from ficheactioncategorie
                  where latest
                    and not deleted
              ) epci_cats
         group by epci_id
     ) step1
         join (
    select epci_id,
           json_agg(cat) categories
    from (
             select epci_id, jsonb_build_object('nom', nom, 'uid', uid) cat
             from ficheactioncategorie
             where latest
               and not deleted
             group by epci_id, nom, uid
         ) dd
    group by epci_id
) results on step1.epci_id = results.epci_id;

-- downgrade --
DROP TABLE IF EXISTS "planaction";
drop extension if exists "uuid-ossp";
