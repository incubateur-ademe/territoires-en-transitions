-- Deploy tet:plan_action to pg

BEGIN;

create or replace view fiches_action as
select fa.*,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (
           select array_agg(pil.*::personne)
           from (
                    select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom, pt.collectivite_id, fap.tag_id, fap.user_id
                    from fiche_action_pilote fap
                             left join personne_tag pt on fap.tag_id = pt.id
                             left join dcp on fap.user_id = dcp.user_id
                    where fap.fiche_id = fa.id
                ) pil
       ) as pilotes,
       (
           select array_agg(ref.*::personne)
           from (
                    select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom, pt.collectivite_id, far.tag_id, far.user_id
                    from fiche_action_referent far
                             left join personne_tag pt on far.tag_id = pt.id
                             left join dcp on far.user_id = dcp.user_id
                    where far.fiche_id = fa.id
                ) ref
       ) as referents,
       anne.annexes,
       pla.axes,
       act.actions,
       (
           select array_agg(indi.*::indicateur_generique)
           from (
                    select fai.indicateur_id,
                           fai.indicateur_personnalise_id,
                           coalesce(id.nom, ipd.titre) as nom,
                           coalesce(id.description, ipd.description) as description,
                           coalesce(id.unite, ipd.unite) as unite
                    from fiche_action_indicateur fai
                             left join indicateur_definition id on fai.indicateur_id = id.id
                             left join indicateur_personnalise_definition ipd on fai.indicateur_personnalise_id = ipd.id
                    where fai.fiche_id = fa.id
                ) indi
       ) as indicateurs
from fiche_action fa
         -- thematiques
         left join (
    select fath.fiche_id, array_agg(th.*::thematique) as thematiques
    from thematique th
             join fiche_action_thematique fath on fath.thematique = th.thematique
    group by fath.fiche_id
) as t on t.fiche_id = fa.id
    -- sous-thematiques
         left join (
    select fasth.fiche_id, array_agg(sth.*::sous_thematique) as sous_thematiques
    from sous_thematique sth
             join fiche_action_sous_thematique fasth on fasth.thematique_id = sth.id
    group by fasth.fiche_id
) as st on st.fiche_id = fa.id
    -- partenaires
         left join (
    select fapt.fiche_id, array_agg(pt.*::partenaire_tag) as partenaires
    from partenaire_tag pt
             join fiche_action_partenaire_tag fapt on fapt.partenaire_tag_id = pt.id
    group by fapt.fiche_id
) as p on p.fiche_id = fa.id
    -- structures
         left join (
    select fast.fiche_id, array_agg(st.*::structure_tag) as structures
    from structure_tag st
             join fiche_action_structure_tag fast on fast.structure_tag_id = st.id
    group by fast.fiche_id
) as s on s.fiche_id = fa.id
    -- annexes
         left join (
    select faa.fiche_id, array_agg(a.*::annexe) as annexes
    from annexe a
             join fiche_action_annexe faa on faa.annexe_id = a.id
    group by faa.fiche_id
) as anne on anne.fiche_id = fa.id
    -- axes
         left join (
    select fapa.fiche_id, array_agg(pa.*::axe) as axes
    from axe pa
             join fiche_action_axe fapa on fapa.axe_id = pa.id
    group by fapa.fiche_id
) as pla on pla.fiche_id = fa.id
    -- actions
         left join (
    select faa.fiche_id, array_agg(ar.*::action_relation) as actions
    from action_relation ar
             join fiche_action_action faa on faa.action_id = ar.id
    group by faa.fiche_id
) as act on act.fiche_id = fa.id
-- TODO fiches liées (à calculer dans la vue selon action et indicateurs?)
;

COMMIT;
