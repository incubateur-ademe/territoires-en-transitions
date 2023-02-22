-- Deploy tet:plan_action to pg

BEGIN;

drop function delete_axe_all;
drop view plan_action;

-- Fonction récursive pour afficher un plan d'action
create or replace function plan_action(id integer) returns jsonb as
$$
declare
    pa_enfant_id integer; -- Id d'un plan d'action enfant du plan d'action courant
    pa_nom text; -- Nom du plan d'action courant
    id_loop integer; -- Indice pour parcourir une boucle
    enfants jsonb[]; -- Plans d'actions enfants du plan d'action courant;
    fiches jsonb; -- Fiches actions du plan d'action courant
    to_return jsonb; -- JSON retournant le plan d'action courant, ses fiches et ses enfants
begin
    fiches = to_jsonb((select array_agg(ff.*)
                       from(
                               select * from fiches_action fa
                                                 join fiche_action_axe fapa on fa.id = fapa.fiche_id
                               where fapa.axe_id = plan_action.id
                               order by fa.modified_at desc
                           )ff)) ;
    pa_nom = (select nom from axe where axe.id = plan_action.id);
    id_loop = 1;
    for pa_enfant_id in
        select pa.id
        from axe pa
        where pa.parent = plan_action.id
        order by pa.created_at asc
        loop
            enfants[id_loop] = plan_action(pa_enfant_id);
            id_loop = id_loop + 1;
        end loop;

    to_return = jsonb_build_object('id', plan_action.id,
                                   'nom', pa_nom,
                                   'fiches', fiches,
                                   'enfants', enfants);
    return to_return;
end;
$$ language plpgsql;
comment on function plan_action is
    'Fonction retournant un JSON contenant le plan d''action passé en paramètre,
    ses fiches et ses plans d''actions enfants de manière récursive';

drop view plan_action_chemin;
drop view plan_action_profondeur;
drop function plan_action_profondeur;

alter table fiche_action_import_csv
    drop column service,
    drop column financeur_un,
    drop column montant_un,
    drop column financeur_deux,
    drop column montant_deux,
    drop column financeur_trois,
    drop column montant_trois;


create or replace function import_plan_action_csv() returns trigger as
$$
declare
    axe_id integer;
    fiche_id integer;
    elem_id integer;
    elem text;
    col_id integer;
    regex_split text = E'\(et/ou|[–,/+?&;]| - | -|- |^-| et (?!de)\)(?![^(]*[)])(?![^«]*[»])';
    regex_date text = E'^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/([0-9]{4})$';
begin
    col_id = new.collectivite_id::integer;

    -- Fiche action
    insert into fiche_action (titre, description, piliers_eci, objectifs, resultats_attendus, cibles, ressources, financements, budget_previsionnel, statut, niveau_priorite, date_debut, date_fin_provisoire, amelioration_continue, calendrier, notes_complementaires, maj_termine, collectivite_id)
    values (
               left(case when new.num_action ='' then trim(new.titre) else concat(new.num_action, ' - ', trim(new.titre)) end, 300),
               new.description,
               null,
               new.objectifs,
               case when new.resultats_attendus <> '' then regexp_split_to_array(new.resultats_attendus, '-')::fiche_action_resultats_attendus[] else array[]::fiche_action_resultats_attendus[] end,
               case when new.cibles <> '' then regexp_split_to_array(new.cibles, '-')::fiche_action_cibles[] else array[]::fiche_action_cibles[] end,
               new.moyens,
               new.financements,
               case when new.budget <> '' then new.budget::integer end,
               case when new.statut <> '' then trim(new.statut)::fiche_action_statuts end,
               case when new.priorite <> '' then trim(new.priorite)::fiche_action_niveaux_priorite end,
               case when regexp_match(new.date_debut, regex_date) is not null then to_date(trim(new.date_debut), 'DD/MM/YYYY') end,
               case when regexp_match(new.date_fin, regex_date) is not null then to_date(trim(new.date_fin), 'DD/MM/YYYY') end,
               not (new.amelioration_continue = 'FAUX'),
               new.calendrier,
               new.notes,
               true,
               col_id)
    returning id into fiche_id;

    -- Plan et axes
    if new.plan_nom is not null and trim(new.plan_nom) <> '' then
        axe_id = upsert_axe(new.plan_nom, col_id, null);
        if new.axe is not null and trim(new.axe) <> '' then
            axe_id = upsert_axe(new.axe, col_id, axe_id);
            if new.sous_axe is not null and trim(new.sous_axe) <> '' then
                axe_id = upsert_axe(new.sous_axe, col_id, axe_id);
                if new.sous_sous_axe is not null and trim(new.sous_sous_axe) <> '' then
                    axe_id = upsert_axe(new.sous_sous_axe, col_id, axe_id);
                end if;
            end if;
        end if;
    end if;
    if axe_id is not null then
        perform ajouter_fiche_action_dans_un_axe(fiche_id, axe_id);
    end if;

    -- Partenaires
    for elem in select trim(unnest(regexp_split_to_array(new.partenaires, regex_split)))
        loop
            if elem <> '' then
                insert into partenaire_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_partenaire_tag (fiche_id, partenaire_tag_id)
                values (fiche_id, elem_id);
            end if;
        end loop;

    -- Structures
    for elem in select trim(unnest(regexp_split_to_array(new.structure_pilote, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into structure_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_structure_tag (fiche_id, structure_tag_id)
                values (fiche_id, elem_id);
            end if;
        end loop;

    -- Referents
    for elem in select trim(unnest(regexp_split_to_array(new.elu_referent, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into personne_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_referent (fiche_id, user_id, tag_id)
                values (fiche_id, null, elem_id);
            end if;
        end loop;

    -- Pilotes
    for elem in select trim(unnest(regexp_split_to_array(new.personne_referente, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into personne_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_pilote (fiche_id, user_id, tag_id)
                values (fiche_id, null, elem_id);
            end if;
            return new;
        end loop;
end;
$$ language plpgsql;
comment on function import_plan_action_csv is 'Fonction important un plan d action format csv';

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
    return old;
end;
$$ language plpgsql;

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
    return new;
end;
$$ language plpgsql;

drop view fiches_action;
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

create trigger upsert
    instead of insert or update
    on fiches_action
    for each row
execute procedure upsert_fiche_action();

-- PARTENAIRE
drop function enlever_service;
drop function ajouter_service;
drop table fiche_action_service_tag;
drop table service_tag;
-- FINANCEUR
drop function ajouter_financeur;
drop type financeur_montant;
drop table fiche_action_financeur_tag;
drop table financeur_tag cascade;

COMMIT;