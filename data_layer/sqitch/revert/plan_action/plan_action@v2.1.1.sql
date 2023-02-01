-- Deploy tet:plan_action to pg

BEGIN;

create or replace view fiches_action as
select fa.*,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       pi.pilotes,
       re.referents,
       anne.annexes,
       pla.axes,
       act.actions,
       ind.indicateurs
from fiche_action fa
         -- thematiques
         left join lateral (
    select array_agg(th.*::thematique) as thematiques
    from thematique th
             join fiche_action_thematique fath on fath.thematique = th.thematique
    where fath.fiche_id = fa.id
    ) as t on true
    -- sous-thematiques
         left join lateral (
    select array_agg(sth.*::sous_thematique) as sous_thematiques
    from sous_thematique sth
             join fiche_action_sous_thematique fasth on fasth.thematique_id = sth.id
    where fasth.fiche_id = fa.id
    ) as st on true
    -- partenaires
         left join lateral (
    select array_agg(pt.*::partenaire_tag) as partenaires
    from partenaire_tag pt
             join fiche_action_partenaire_tag fapt on fapt.partenaire_tag_id = pt.id
    where fapt.fiche_id = fa.id
    ) as p on true
    -- structures
         left join lateral (
    select array_agg(st.*::structure_tag) as structures
    from structure_tag st
             join fiche_action_structure_tag fast on fast.structure_tag_id = st.id
    where fast.fiche_id = fa.id
    ) as s on true
    -- pilotes
         left join lateral (
    select array_agg(pil.*::personne) as pilotes
    from (
             select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                    pt.collectivite_id,
                    fap.tag_id,
                    fap.user_id
             from fiche_action_pilote fap
                      left join personne_tag pt on fap.tag_id = pt.id
                      left join dcp on fap.user_id = dcp.user_id
             where fap.fiche_id = fa.id
         ) pil
    ) as pi on true
    -- referents
         left join lateral (
    select array_agg(ref.*::personne) as referents
    from (
             select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                    pt.collectivite_id,
                    far.tag_id,
                    far.user_id
             from fiche_action_referent far
                      left join personne_tag pt on far.tag_id = pt.id
                      left join dcp on far.user_id = dcp.user_id
             where far.fiche_id = fa.id
         ) ref
    ) as re on true
    -- annexes
         left join lateral (
    select array_agg(a.*::annexe) as annexes
    from annexe a
             join fiche_action_annexe faa on faa.annexe_id = a.id
    where faa.fiche_id = fa.id
    ) as anne on true
    -- axes
         left join lateral (
    select array_agg(pa.*::axe) as axes
    from axe pa
             join fiche_action_axe fapa on fapa.axe_id = pa.id
    where fapa.fiche_id = fa.id
    ) as pla on true
    -- actions
         left join lateral (
    select array_agg(ar.*::action_relation) as actions
    from action_relation ar
             join fiche_action_action faa on faa.action_id = ar.id
    where faa.fiche_id = fa.id
    ) as act on true
    -- indicateurs
         left join lateral (
    select array_agg(indi.*::indicateur_generique) as indicateurs
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
    ) as ind on true
-- TODO fiches liées (à calculer dans la vue selon action et indicateurs?)
;


COMMIT;
