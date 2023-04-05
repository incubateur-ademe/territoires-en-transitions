-- Deploy tet:plan_action to pg

BEGIN;

create table fiche_action_lien
(
    fiche_une integer references fiche_action,
    fiche_deux integer references fiche_action,
    primary key (fiche_une, fiche_deux)
);
comment on table fiche_action_lien is
    'Liens entre deux fiches actions';
-- Evite les liens doublons car les liens sont bidirectionnels
create unique index on fiche_action_lien (least(fiche_une, fiche_deux), greatest(fiche_une, fiche_deux));

alter table fiche_action_lien
    enable row level security;

create policy allow_read on fiche_action_lien using(peut_lire_la_fiche(fiche_une) and peut_lire_la_fiche(fiche_deux));
create policy allow_insert on fiche_action_lien for insert with check(peut_modifier_la_fiche(fiche_une) and peut_modifier_la_fiche(fiche_deux));
create policy allow_update on fiche_action_lien for update using(peut_modifier_la_fiche(fiche_une) and peut_modifier_la_fiche(fiche_deux));
create policy allow_delete on fiche_action_lien for delete using(peut_modifier_la_fiche(fiche_une) and peut_modifier_la_fiche(fiche_deux));

create view fiches_liees_par_fiche as
(
select fal.fiche_une as fiche_id, fal.fiche_deux as fiche_liee_id
from fiche_action_lien fal
union
select fal.fiche_deux as fiche_id, fal.fiche_une as fiche_liee_id
from fiche_action_lien fal
    );
comment on view fiches_liees_par_fiche is
    'Liste toutes les fiches liées par fiche';

create view fiche_resume as
(
select
    array_agg(a.*) as plans,
    fa.titre as fiche_nom,
    fa.id as fiche_id,
    fa.statut as fiche_statut
from fiche_action fa
         left join fiche_action_axe faa on fa.id = faa.fiche_id
         left join plan_action_chemin pac on faa.axe_id = pac.axe_id
         left join axe a on pac.plan_id = a.id
group by fa.titre, fa.id, fa.statut
    );

create or replace view fiches_action as
(
select fa.*,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (select array_agg(pil.*::personne)
        from (select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              from fiche_action_pilote fap
                       left join personne_tag pt on fap.tag_id = pt.id
                       left join dcp on fap.user_id = dcp.user_id
              where fap.fiche_id = fa.id) pil)  as pilotes,
       (select array_agg(ref.*::personne)
        from (select coalesce(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) as nom,
                     pt.collectivite_id,
                     far.tag_id,
                     far.user_id
              from fiche_action_referent far
                       left join personne_tag pt on far.tag_id = pt.id
                       left join dcp on far.user_id = dcp.user_id
              where far.fiche_id = fa.id) ref)  as referents,
       anne.annexes,
       pla.axes,
       act.actions,
       (select array_agg(indi.*::indicateur_generique)
        from (select fai.indicateur_id,
                     fai.indicateur_personnalise_id,
                     coalesce(id.nom, ipd.titre)               as nom,
                     coalesce(id.description, ipd.description) as description,
                     coalesce(id.unite, ipd.unite)             as unite
              from fiche_action_indicateur fai
                       left join indicateur_definition id on fai.indicateur_id = id.id
                       left join indicateur_personnalise_definition ipd on fai.indicateur_personnalise_id = ipd.id
              where fai.fiche_id = fa.id) indi) as indicateurs,
       ser.services,
       -- financeurs
       (select array_agg(fin.*::financeur_montant) as financeurs
        from (select ft as financeur_tag,
                     faft.montant_ttc,
                     faft.id
              from financeur_tag ft
                       join fiche_action_financeur_tag faft on ft.id = faft.financeur_tag_id
              where faft.fiche_id = fa.id) fin) as financeurs,
       fic.fiches_liees
from fiche_action fa
         -- thematiques
         left join (select fath.fiche_id, array_agg(th.*::thematique) as thematiques
                    from thematique th
                             join fiche_action_thematique fath on fath.thematique = th.thematique
                    group by fath.fiche_id) as t on t.fiche_id = fa.id
    -- sous-thematiques
         left join (select fasth.fiche_id, array_agg(sth.*::sous_thematique) as sous_thematiques
                    from sous_thematique sth
                             join fiche_action_sous_thematique fasth on fasth.thematique_id = sth.id
                    group by fasth.fiche_id) as st on st.fiche_id = fa.id
    -- partenaires
         left join (select fapt.fiche_id, array_agg(pt.*::partenaire_tag) as partenaires
                    from partenaire_tag pt
                             join fiche_action_partenaire_tag fapt on fapt.partenaire_tag_id = pt.id
                    group by fapt.fiche_id) as p on p.fiche_id = fa.id
    -- structures
         left join (select fast.fiche_id, array_agg(st.*::structure_tag) as structures
                    from structure_tag st
                             join fiche_action_structure_tag fast on fast.structure_tag_id = st.id
                    group by fast.fiche_id) as s on s.fiche_id = fa.id
    -- annexes
         left join (select faa.fiche_id, array_agg(a.*::annexe) as annexes
                    from annexe a
                             join fiche_action_annexe faa on faa.annexe_id = a.id
                    group by faa.fiche_id) as anne on anne.fiche_id = fa.id
    -- axes
         left join (select fapa.fiche_id, array_agg(pa.*::axe) as axes
                    from axe pa
                             join fiche_action_axe fapa on fapa.axe_id = pa.id
                    group by fapa.fiche_id) as pla on pla.fiche_id = fa.id
    -- actions
         left join (select faa.fiche_id, array_agg(ar.*::action_relation) as actions
                    from action_relation ar
                             join fiche_action_action faa on faa.action_id = ar.id
                    group by faa.fiche_id) as act on act.fiche_id = fa.id
    -- services
         left join (select fast.fiche_id, array_agg(st.*::service_tag) as services
                    from service_tag st
                             join fiche_action_service_tag fast on fast.service_tag_id = st.id
                    group by fast.fiche_id) as ser on ser.fiche_id = fa.id
    -- fiches liees
         left join (select falpf.fiche_id, array_agg(fr.*) as fiches_liees
                    from fiche_resume fr
                             join fiches_liees_par_fiche falpf on falpf.fiche_liee_id = fr.fiche_id
                    group by falpf.fiche_id) as fic on fic.fiche_id = fa.id
    );

create or replace function upsert_fiche_action()
    returns trigger as
$$
declare
    id_fiche integer;
    thematique thematique;
    sous_thematique sous_thematique;
    axe axe;
    partenaire partenaire_tag;
    structure structure_tag;
    pilote personne;
    referent personne;
    action action_relation;
    indicateur indicateur_generique;
    annexe annexe;
    service service_tag;
    financeur financeur_montant;
    fiche_liee fiche_resume;
begin
    id_fiche = new.id;
    -- Fiche action
    if id_fiche is null then
        insert into fiche_action (titre,
                                  description,
                                  piliers_eci,
                                  objectifs,
                                  resultats_attendus,
                                  cibles,
                                  ressources,
                                  financements,
                                  budget_previsionnel,
                                  statut,
                                  niveau_priorite,
                                  date_debut,
                                  date_fin_provisoire,
                                  amelioration_continue,
                                  calendrier,
                                  notes_complementaires,
                                  maj_termine,
                                  collectivite_id)
        values (new.titre,
                new.description,
                new.piliers_eci,
                new.objectifs,
                new.resultats_attendus,
                new.cibles,
                new.ressources,
                new.financements,
                new.budget_previsionnel,
                new.statut,
                new.niveau_priorite,
                new.date_debut,
                new.date_fin_provisoire,
                new.amelioration_continue,
                new.calendrier,
                new.notes_complementaires,
                new.maj_termine,
                new.collectivite_id)
        returning id into id_fiche;
        new.id = id_fiche;
    else
        update fiche_action
        set
            titre = new.titre,
            description= new.description,
            piliers_eci= new.piliers_eci,
            objectifs= new.objectifs,
            resultats_attendus= new.resultats_attendus,
            cibles= new.cibles,
            ressources= new.ressources,
            financements= new.financements,
            budget_previsionnel= new.budget_previsionnel,
            statut= new.statut,
            niveau_priorite= new.niveau_priorite,
            date_debut= new.date_debut,
            date_fin_provisoire= new.date_fin_provisoire,
            amelioration_continue= new.amelioration_continue,
            calendrier= new.calendrier,
            notes_complementaires= new.notes_complementaires,
            maj_termine= new.maj_termine,
            collectivite_id = new.collectivite_id
        where id = id_fiche;
    end if;

    -- Thématiques
    delete from fiche_action_thematique where fiche_id = id_fiche;
    if new.thematiques is not null then
        foreach thematique in array new.thematiques::thematique[]
            loop
                perform ajouter_thematique(id_fiche, thematique.thematique);
            end loop;
    end if;
    delete from fiche_action_sous_thematique where fiche_id = id_fiche;
    if new.sous_thematiques is not null then
        foreach sous_thematique in array new.sous_thematiques::sous_thematique[]
            loop
                perform ajouter_sous_thematique(id_fiche, sous_thematique.id);
            end loop;
    end if;

    -- Axes
    delete from fiche_action_axe where fiche_id = id_fiche;
    if new.axes is not null then
        foreach axe in array new.axes::axe[]
            loop
                perform ajouter_fiche_action_dans_un_axe(id_fiche, axe.id);
            end loop;
    end if;

    -- Partenaires
    delete from fiche_action_partenaire_tag where fiche_id = id_fiche;
    if new.partenaires is not null then
        foreach partenaire in array new.partenaires::partenaire_tag[]
            loop
                perform ajouter_partenaire(id_fiche,partenaire);
            end loop;
    end if;

    -- Structures
    delete from fiche_action_structure_tag where fiche_id = id_fiche;
    if new.structures is not null then
        foreach structure in array new.structures
            loop
                perform ajouter_structure(id_fiche,structure);
            end loop;
    end if;

    -- Pilotes
    delete from fiche_action_pilote where fiche_id = id_fiche;
    if new.pilotes is not null then
        foreach pilote in array new.pilotes::personne[]
            loop
                perform ajouter_pilote(id_fiche,pilote);
            end loop;
    end if;

    -- Referents
    delete from fiche_action_referent where fiche_id = id_fiche;
    if new.referents is not null then
        foreach referent in array new.referents::personne[]
            loop
                perform ajouter_referent(id_fiche,referent);
            end loop;
    end if;

    -- Actions
    delete from fiche_action_action where fiche_id = id_fiche;
    if new.actions is not null then
        foreach action in array new.actions::action_relation[]
            loop
                perform ajouter_action(id_fiche, action.id);
            end loop;
    end if;

    -- Indicateurs
    delete from fiche_action_indicateur where fiche_id = id_fiche;
    if new.indicateurs is not null then
        foreach indicateur in array new.indicateurs::indicateur_generique[]
            loop
                perform ajouter_indicateur(id_fiche,indicateur);
            end loop;
    end if;

    -- Annexes
    delete from fiche_action_annexe where fiche_id = id_fiche;
    if new.annexes is not null then
        foreach annexe in array new.annexes::annexe[]
            loop
                perform ajouter_annexe(id_fiche,annexe);
            end loop;
    end if;


    -- Services
    delete from fiche_action_service_tag where fiche_id = id_fiche;
    if new.services is not null then
        foreach service in array new.services
            loop
                perform ajouter_service(id_fiche,service);
            end loop;
    end if;

    -- Financeurs
    delete from fiche_action_financeur_tag where fiche_id = id_fiche;
    if new.financeurs is not null then
        foreach financeur in array new.financeurs::financeur_montant[]
            loop
                perform ajouter_financeur(id_fiche,financeur);
            end loop;
    end if;

    -- Fiches liees
    delete from fiche_action_lien where fiche_une = id_fiche or fiche_deux = id_fiche;
    if new.fiches_liees is not null then
        foreach fiche_liee in array new.fiches_liees::fiche_resume[]
            loop
                insert into fiche_action_lien (fiche_une, fiche_deux)
                values (id_fiche, fiche_liee.fiche_id);
            end loop;
    end if;

    return new;
end;
$$ language plpgsql;

create or replace function delete_fiche_action()
    returns trigger as
$$
declare
begin
    delete from fiche_action_thematique where fiche_id = old.id;
    delete from fiche_action_sous_thematique where fiche_id = old.id;
    delete from fiche_action_partenaire_tag where fiche_id = old.id;
    delete from fiche_action_structure_tag where fiche_id = old.id;
    delete from fiche_action_pilote where fiche_id = old.id;
    delete from fiche_action_referent where fiche_id = old.id;
    delete from fiche_action_annexe where fiche_id = old.id;
    delete from fiche_action_indicateur where fiche_id = old.id;
    delete from fiche_action_action where fiche_id = old.id;
    delete from fiche_action_axe where fiche_id = old.id;
    delete from fiche_action_financeur_tag where fiche_id = old.id;
    delete from fiche_action_service_tag where fiche_id = old.id;
    delete from fiche_action_lien where fiche_une = old.id or fiche_deux = old.id;
    return old;
end;
$$ language plpgsql;

COMMIT;
