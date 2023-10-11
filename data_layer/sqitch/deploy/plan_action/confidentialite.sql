-- Deploy tet:plan_action/confidentialite to pg

BEGIN;

create table plan_action_type_categorie
(
    categorie text primary key
);
alter table plan_action_type_categorie enable row level security;
create policy allow_read on plan_action_type_categorie for select using (is_authenticated());

insert into plan_action_type_categorie (categorie)
values ('Plans transverses'), ('Plans thématiques');

create table plan_action_type
(
    id serial primary key,
    categorie text references plan_action_type_categorie not null,
    type text not null,
    detail text,
    unique (categorie, type)
);
alter table plan_action_type enable row level security;
create policy allow_read on plan_action_type for select using (is_authenticated());

insert into plan_action_type (categorie, type, detail)
values ('Plans transverses', 'Projet de Territoire' , 'dont Agenda 2030, Développement Durable'),
       ('Plans transverses', 'Plan de Transition Écologique', 'dont COT et Plan Territoire Engagé'),
       ('Plans transverses', 'Plan CTE/CRTE', null),
       ('Plans transverses', 'Plan Climat Air Énergie Territorial', null),
       ('Plans transverses', 'Plan Économie Circulaire & Déchets', 'dont PLPDMA, Territoire Econome en Ressources'),
       ('Plans transverses', 'Autre', null),
       ('Plans thématiques', 'Plan Urbanisme/habitat', 'dont SCoT, PLU, PLH, Programme d’Aménagement'),
       ('Plans thématiques', 'Plan Energies', 'dont TEPOS'),
       ('Plans thématiques', 'Plan Bâtiment', 'dont patrimoine public'),
       ('Plans thématiques', 'Plan Mobilité', null),
       ('Plans thématiques', 'Plan Agriculture/Alimentation', null),
       ('Plans thématiques', 'Plan Eau', null),
       ('Plans thématiques', 'Plan Biodiversité', null),
       ('Plans thématiques', 'Autre', null);

alter table axe add column plan integer references axe;
comment on column axe.plan is 'Lien direct vers le plan pour éviter la récursivité quand on veut le récupérer';

create function upsert_axe_trigger_plan() returns trigger
    security definer
    language plpgsql
as $$
declare id_plan integer;
begin
    if new.parent is not null then
        -- Insert ou update d'un axe
        with recursive
            chemin as (select axe.id        as axe_id,
                              axe.id as plan_id
                       from axe
                       where axe.parent is null
                       union all
                       select a.id as axe_id,
                              p.plan_id
                       from axe a
                                join chemin p on a.parent = p.axe_id)
        select plan_id from chemin
        where axe_id = new.parent
        limit 1
        into id_plan;
        new.plan = id_plan;
    else
        -- Insert ou update d'un plan
        if new.id is null then
            -- Insert d'un plan
            new.id = nextval(pg_get_serial_sequence('axe', 'id'));
        end if;
        new.plan = new.id;
    end if;
    return new;
end;
$$;

create trigger axe_modifie_plan
    before insert or update
    on axe
    for each row
execute procedure upsert_axe_trigger_plan();

alter table axe add column type integer references plan_action_type;
comment on column axe.type is 'Type du plan';

alter table fiche_action add column restreint boolean default false;
comment on column fiche_action.restreint is 'Vrai si la fiche est restreinte.';

create or replace function peut_lire_la_fiche(fiche_id integer) returns boolean
    security definer
    language plpgsql
as
$$
declare collectivite_id integer;
begin
    select fa.collectivite_id
    from fiche_action fa
    where fa.id = fiche_id limit 1
    into collectivite_id;

    if ( -- Fiche restreinte ?
        select fa.restreint = true -- null = false
        from fiche_action fa
        where fa.id = peut_lire_la_fiche.fiche_id
    ) then
        return have_lecture_acces(collectivite_id) or est_support();
    else -- Collectivité restreinte ?
        return can_read_acces_restreint((collectivite_id));

    end if;
end;
$$;

create function restreindre_plan(plan_id integer, restreindre boolean) returns void
    security definer
    language plpgsql
as
$$
declare plan_concerne axe;
begin
    select * from axe where id = plan_id limit 1 into plan_concerne;
    if plan_concerne is null or plan_concerne.parent is not null then
        perform set_config('response.status', '401', true);
        raise 'L''identifiant donné ne correspond pas à un plan';
    end if;
    if not have_edition_acces(plan_concerne.collectivite_id) and not is_service_role() then
        perform set_config('response.status', '401', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    update fiche_action
    set restreint = restreindre
    where id in (
        select distinct faa.fiche_id
        from fiche_action_axe faa
                 join axe on faa.axe_id = axe.id
        where axe.plan = plan_concerne.id
    );
end;
$$;



create or replace view private.fiche_resume
            (plans, titre, id, statut, collectivite_id, pilotes, modified_at, date_fin_provisoire, niveau_priorite, restreint) as
SELECT p.plans,
       fa.titre,
       fa.id,
       fa.statut,
       fa.collectivite_id,
       (SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              FROM fiche_action_pilote fap
                       LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
                       LEFT JOIN dcp ON fap.user_id = dcp.user_id
              WHERE fap.fiche_id = fa.id) pil)                 AS pilotes,
       fa.modified_at,
       fa.date_fin_provisoire,
       fa.niveau_priorite,
       fa.restreint
FROM fiche_action fa
         LEFT JOIN (SELECT faa.fiche_id,
                           array_agg(distinct plan.*) AS plans
                    from fiche_action_axe faa
                             join axe on faa.axe_id = axe.id
                             join axe plan on axe.plan = plan.id
                    GROUP BY faa.fiche_id) p ON p.fiche_id = fa.id
GROUP BY fa.titre, fa.id, fa.statut, fa.collectivite_id, p.plans
ORDER BY (naturalsort(fa.titre::text));

create or replace view public.fiche_resume as
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint
FROM private.fiche_resume fr
WHERE can_read_acces_restreint(fr.collectivite_id);

create or replace function fiche_resume(fiche_action_action fiche_action_action) returns SETOF fiche_resume
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint
FROM private.fiche_resume fr
WHERE ((fr.id = (fiche_resume.fiche_action_action).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END;

create or replace function fiche_resume(fiche_action_indicateur fiche_action_indicateur) returns SETOF fiche_resume
    stable
    security definer
    rows 1
    language sql
BEGIN ATOMIC
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint
FROM private.fiche_resume fr
WHERE ((fr.id = (fiche_resume.fiche_action_indicateur).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END;

-- TODO faire pareil que private.fiche_resume avec private.indicateur_resume

create or replace view private.fiches_action
as
SELECT fa.modified_at,
       fa.id,
       fa.titre,
       fa.description,
       fa.piliers_eci,
       fa.objectifs,
       fa.resultats_attendus,
       fa.cibles,
       fa.ressources,
       fa.financements,
       fa.budget_previsionnel,
       fa.statut,
       fa.niveau_priorite,
       fa.date_debut,
       fa.date_fin_provisoire,
       fa.amelioration_continue,
       fa.calendrier,
       fa.notes_complementaires,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       fa.modified_by,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              FROM fiche_action_pilote fap
                       LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
                       LEFT JOIN dcp ON fap.user_id = dcp.user_id
              WHERE fap.fiche_id = fa.id) pil)  AS pilotes,
       (SELECT array_agg(ROW (ref.nom, ref.collectivite_id, ref.tag_id, ref.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     far.tag_id,
                     far.user_id
              FROM fiche_action_referent far
                       LEFT JOIN personne_tag pt ON far.tag_id = pt.id
                       LEFT JOIN dcp ON far.user_id = dcp.user_id
              WHERE far.fiche_id = fa.id) ref)  AS referents,
       pla.axes,
       act.actions,
       (SELECT array_agg(ROW (indi.indicateur_id, indi.indicateur_personnalise_id, indi.nom, indi.description, indi.unite)::indicateur_generique) AS array_agg
        FROM (SELECT fai.indicateur_id,
                     fai.indicateur_personnalise_id,
                     COALESCE(id.nom, ipd.titre)               AS nom,
                     COALESCE(id.description, ipd.description) AS description,
                     COALESCE(id.unite, ipd.unite)             AS unite
              FROM fiche_action_indicateur fai
                       LEFT JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
                       LEFT JOIN indicateur_personnalise_definition ipd ON fai.indicateur_personnalise_id = ipd.id
              WHERE fai.fiche_id = fa.id) indi) AS indicateurs,
       ser.services,
       (SELECT array_agg(ROW (fin.financeur_tag, fin.montant_ttc, fin.id)::financeur_montant) AS financeurs
        FROM (SELECT ft.*::financeur_tag AS financeur_tag,
                     faft.montant_ttc,
                     faft.id
              FROM financeur_tag ft
                       JOIN fiche_action_financeur_tag faft ON ft.id = faft.financeur_tag_id
              WHERE faft.fiche_id = fa.id) fin) AS financeurs,
       fic.fiches_liees,
       fa.restreint
FROM fiche_action fa
         LEFT JOIN (SELECT fath.fiche_id,
                           array_agg(th.*) AS thematiques
                    FROM thematique th
                             JOIN fiche_action_thematique fath ON fath.thematique = th.thematique
                    GROUP BY fath.fiche_id) t ON t.fiche_id = fa.id
         LEFT JOIN (SELECT fasth.fiche_id,
                           array_agg(sth.*) AS sous_thematiques
                    FROM sous_thematique sth
                             JOIN fiche_action_sous_thematique fasth ON fasth.thematique_id = sth.id
                    GROUP BY fasth.fiche_id) st ON st.fiche_id = fa.id
         LEFT JOIN (SELECT fapt.fiche_id,
                           array_agg(pt.*) AS partenaires
                    FROM partenaire_tag pt
                             JOIN fiche_action_partenaire_tag fapt ON fapt.partenaire_tag_id = pt.id
                    GROUP BY fapt.fiche_id) p ON p.fiche_id = fa.id
         LEFT JOIN (SELECT fast.fiche_id,
                           array_agg(st_1.*) AS structures
                    FROM structure_tag st_1
                             JOIN fiche_action_structure_tag fast ON fast.structure_tag_id = st_1.id
                    GROUP BY fast.fiche_id) s ON s.fiche_id = fa.id
         LEFT JOIN (SELECT fapa.fiche_id,
                           array_agg(pa.*) AS axes
                    FROM axe pa
                             JOIN fiche_action_axe fapa ON fapa.axe_id = pa.id
                    GROUP BY fapa.fiche_id) pla ON pla.fiche_id = fa.id
         LEFT JOIN (SELECT faa.fiche_id,
                           array_agg(ar.*) AS actions
                    FROM action_relation ar
                             JOIN fiche_action_action faa ON faa.action_id::text = ar.id::text
                    GROUP BY faa.fiche_id) act ON act.fiche_id = fa.id
         LEFT JOIN (SELECT fast.fiche_id,
                           array_agg(st_1.*) AS services
                    FROM service_tag st_1
                             JOIN fiche_action_service_tag fast ON fast.service_tag_id = st_1.id
                    GROUP BY fast.fiche_id) ser ON ser.fiche_id = fa.id
         LEFT JOIN (SELECT falpf.fiche_id,
                           array_agg(fr.*) AS fiches_liees
                    FROM private.fiche_resume fr
                             JOIN fiches_liees_par_fiche falpf ON falpf.fiche_liee_id = fr.id
                    GROUP BY falpf.fiche_id) fic ON fic.fiche_id = fa.id;

create or replace view public.fiches_action
            (modified_at, id, titre, description, piliers_eci, objectifs, resultats_attendus, cibles, ressources,
             financements, budget_previsionnel, statut, niveau_priorite, date_debut, date_fin_provisoire,
             amelioration_continue, calendrier, notes_complementaires, maj_termine, collectivite_id, created_at,
             modified_by, thematiques, sous_thematiques, partenaires, structures, pilotes, referents, axes, actions,
             indicateurs, services, financeurs, fiches_liees, restreint)
as
SELECT fiches_action.modified_at,
       fiches_action.id,
       fiches_action.titre,
       fiches_action.description,
       fiches_action.piliers_eci,
       fiches_action.objectifs,
       fiches_action.resultats_attendus,
       fiches_action.cibles,
       fiches_action.ressources,
       fiches_action.financements,
       fiches_action.budget_previsionnel,
       fiches_action.statut,
       fiches_action.niveau_priorite,
       fiches_action.date_debut,
       fiches_action.date_fin_provisoire,
       fiches_action.amelioration_continue,
       fiches_action.calendrier,
       fiches_action.notes_complementaires,
       fiches_action.maj_termine,
       fiches_action.collectivite_id,
       fiches_action.created_at,
       fiches_action.modified_by,
       fiches_action.thematiques,
       fiches_action.sous_thematiques,
       fiches_action.partenaires,
       fiches_action.structures,
       fiches_action.pilotes,
       fiches_action.referents,
       fiches_action.axes,
       fiches_action.actions,
       fiches_action.indicateurs,
       fiches_action.services,
       fiches_action.financeurs,
       fiches_action.fiches_liees,
       fiches_action.restreint
FROM private.fiches_action
WHERE case when fiches_action.restreint = true -- null = false
               then have_lecture_acces(fiches_action.collectivite_id) or est_support()
           else can_read_acces_restreint((fiches_action.collectivite_id)) end;

create or replace function upsert_fiche_action() returns trigger
    security definer
    language plpgsql
as
$$
declare
    id_fiche        integer;
    thematique      thematique;
    sous_thematique sous_thematique;
    axe             axe;
    partenaire      partenaire_tag;
    structure       structure_tag;
    pilote          personne;
    referent        personne;
    action          action_relation;
    indicateur      indicateur_generique;
    service         service_tag;
    financeur       financeur_montant;
    fiche_liee      fiche_resume;
begin
    id_fiche = new.id;
    if not have_edition_acces(new.collectivite_id) and not is_service_role() then
        perform set_config('response.status', '401', true);
        raise 'Modification non autorisé.';
    end if;
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
                                  collectivite_id,
                                  restreint)
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
                new.collectivite_id,
                new.restreint)
        returning id into id_fiche;
        new.id = id_fiche;
    else
        update fiche_action
        set titre                = new.titre,
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
            collectivite_id      = new.collectivite_id,
            restreint = new.restreint
        where id = id_fiche;
    end if;

    -- Thématiques
    delete from fiche_action_thematique where fiche_id = id_fiche;
    if new.thematiques is not null then
        foreach thematique in array new.thematiques::thematique[]
            loop
                perform private.ajouter_thematique(id_fiche, thematique.thematique);
            end loop;
    end if;
    delete from fiche_action_sous_thematique where fiche_id = id_fiche;
    if new.sous_thematiques is not null then
        foreach sous_thematique in array new.sous_thematiques::sous_thematique[]
            loop
                perform private.ajouter_sous_thematique(id_fiche, sous_thematique.id);
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
                perform private.ajouter_partenaire(id_fiche, partenaire);
            end loop;
    end if;

    -- Structures
    delete from fiche_action_structure_tag where fiche_id = id_fiche;
    if new.structures is not null then
        foreach structure in array new.structures
            loop
                perform private.ajouter_structure(id_fiche, structure);
            end loop;
    end if;

    -- Pilotes
    delete from fiche_action_pilote where fiche_id = id_fiche;
    if new.pilotes is not null then
        foreach pilote in array new.pilotes::personne[]
            loop
                perform private.ajouter_pilote(id_fiche, pilote);
            end loop;
    end if;
    -- Referents
    delete from fiche_action_referent where fiche_id = id_fiche;
    if new.referents is not null then
        foreach referent in array new.referents::personne[]
            loop
                perform private.ajouter_referent(id_fiche, referent);
            end loop;
    end if;

    -- Actions
    delete from fiche_action_action where fiche_id = id_fiche;
    if new.actions is not null then
        foreach action in array new.actions::action_relation[]
            loop
                perform private.ajouter_action(id_fiche, action.id);
            end loop;
    end if;

    -- Indicateurs
    delete from fiche_action_indicateur where fiche_id = id_fiche;
    if new.indicateurs is not null then
        foreach indicateur in array new.indicateurs::indicateur_generique[]
            loop
                perform private.ajouter_indicateur(id_fiche, indicateur);
            end loop;
    end if;

    -- Services
    delete from fiche_action_service_tag where fiche_id = id_fiche;
    if new.services is not null then
        foreach service in array new.services
            loop
                perform private.ajouter_service(id_fiche, service);
            end loop;
    end if;
    -- Financeurs
    delete from fiche_action_financeur_tag where fiche_id = id_fiche;
    if new.financeurs is not null then
        foreach financeur in array new.financeurs::financeur_montant[]
            loop
                perform private.ajouter_financeur(id_fiche, financeur);
            end loop;
    end if;

    -- Fiches liees
    delete from fiche_action_lien where fiche_une = id_fiche or fiche_deux = id_fiche;
    if new.fiches_liees is not null then
        foreach fiche_liee in array new.fiches_liees::private.fiche_resume[]
            loop
                insert into fiche_action_lien (fiche_une, fiche_deux)
                values (id_fiche, fiche_liee.id);
            end loop;
    end if;

    return new;
end;
$$;

create or replace function plan_action_tableau_de_bord(collectivite_id integer, plan_id integer DEFAULT NULL::integer, sans_plan boolean DEFAULT false) returns plan_action_tableau_de_bord
    stable
    language plpgsql
as
$$
declare
    tableau_de_bord plan_action_tableau_de_bord;
begin
    if can_read_acces_restreint(collectivite_id) then
        with
            fiches as (select distinct fa.*,
                                       case
                                           when fa.statut not in ('À venir', 'En cours', 'En pause')
                                               then 'NC'
                                           when fa.amelioration_continue
                                               then 'Action en amélioration continue'
                                           when fa.date_fin_provisoire is null
                                               then 'Date de fin non renseignée'
                                           when fa.date_fin_provisoire < now()
                                               then 'Échéance dépassée'
                                           when fa.date_fin_provisoire < (now() + interval '3 months')
                                               then 'Échéance dans moins de trois mois'
                                           when fa.date_fin_provisoire < (now() + interval '1 year')
                                               then 'Échéance entre trois mois et 1 an'
                                           else 'Échéance dans plus d’un an'
                                           end as echeance
                       from fiche_action fa
                                left join fiche_action_axe faa on faa.fiche_id = fa.id
                                left join axe on faa.axe_id = axe.id
                       where case
                                 when plan_action_tableau_de_bord.plan_id is not null
                                     then axe.plan = plan_action_tableau_de_bord.plan_id
                                 when sans_plan
                                     then faa is null
                                 else true
                           end
                         and fa.collectivite_id = plan_action_tableau_de_bord.collectivite_id),
            personnes as (select *
                          from personnes_collectivite(plan_action_tableau_de_bord.collectivite_id))
        select plan_action_tableau_de_bord.collectivite_id,
               plan_action_tableau_de_bord.plan_id,
               (select array_agg((t.*)::graphique_tranche) as statuts
                from (select coalesce(statut::text, 'NC') as id, count(*) as value
                      from fiches
                      group by coalesce(statut::text, 'NC')) t),
               (select array_agg((t.*)::graphique_tranche) as pilotes
                from (select coalesce(p.nom, 'NC') as id, count(f.*) as value
                      from fiches f
                               left join fiche_action_pilote fap on fap.fiche_id = f.id
                               left join personnes p on fap.user_id = p.user_id or fap.tag_id = p.tag_id
                      group by coalesce(p.nom, 'NC')) t),
               (select array_agg((t.*)::graphique_tranche) as referents
                from (select coalesce(p.nom, 'NC') as id, count(f.*) as value
                      from fiches f
                               left join fiche_action_referent far on far.fiche_id = f.id
                               left join personnes p on far.user_id = p.user_id or far.tag_id = p.tag_id
                      group by coalesce(p.nom, 'NC')) t),
               (select array_agg((t.*)::graphique_tranche) as priorites
                from (select coalesce(niveau_priorite::text, 'NC') as id, count(*) as value
                      from fiches
                      group by coalesce(niveau_priorite::text, 'NC')) t),
               (select array_agg((t.*)::graphique_tranche) as echeances
                from (select echeance as id, count(*) as value
                      from fiches
                      where echeance <> 'NC'
                      group by echeance) t)
        into tableau_de_bord;
        return tableau_de_bord;
    else
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    end if;
end;
$$;

COMMIT;
