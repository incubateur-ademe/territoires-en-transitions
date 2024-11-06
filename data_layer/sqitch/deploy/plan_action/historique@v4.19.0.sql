-- Deploy tet:plan_action/historique to pg

BEGIN;

create table historique.fiche_action
(
    id                    serial primary key,
    fiche_id              integer,
    titre                 varchar(300),
    previous_titre        varchar(300),
    description           varchar(20000),
    previous_description  varchar(20000),
    piliers_eci           text[],
    previous_piliers_eci  text[],
    objectifs             varchar(10000),
    previous_objectifs    varchar(10000),
    resultats_attendus    text[],
    previous_resultats_attendus    text[],
    cibles                text[],
    previous_cibles       text[],
    ressources            varchar(10000),
    previous_ressources   varchar(10000),
    financements          text,
    previous_financements text,
    budget_previsionnel   integer,
    previous_budget_previsionnel   integer,
    statut                text,
    previous_statut       text,
    niveau_priorite       text,
    previous_niveau_priorite       text,
    date_debut            timestamp with time zone,
    previous_date_debut   timestamp with time zone,
    date_fin_provisoire   timestamp with time zone,
    previous_date_fin_provisoire   timestamp with time zone,
    amelioration_continue boolean,
    previous_amelioration_continue boolean,
    calendrier            varchar(10000),
    previous_calendrier   varchar(10000),
    notes_complementaires varchar(20000),
    previous_notes_complementaires varchar(20000),
    maj_termine           boolean,
    previous_maj_termine  boolean,
    collectivite_id       integer,
    created_at            timestamp with time zone,
    modified_at           timestamp with time zone,
    previous_modified_at  timestamp with time zone,
    modified_by           uuid,
    previous_modified_by  uuid,
    restreint             boolean,
    previous_restreint    boolean,
    deleted              boolean default false
);
alter table historique.fiche_action enable row level security;

create table historique.fiche_action_pilote
(
    id serial primary key,
    fiche_historise_id integer references historique.fiche_action,
    user_id uuid,
    tag_nom text,
    previous boolean not null
);
comment on column historique.fiche_action_pilote.fiche_historise_id is
    'On veut les pilotes à l''instant T d''une fiche';
comment on column historique.fiche_action_pilote.tag_nom is
    'On historise la valeur du tag plutôt que son id pour garder l''information si suppression du tag';
alter table historique.fiche_action_pilote enable row level security;

create or replace function historique.save_fiche_action() returns trigger
as
$$
declare
    updated integer;
    id_fiche integer;
    previous_fiche integer;
begin
    id_fiche = coalesce(new.id, old.id);
    update historique.fiche_action
    set
        titre = new.titre,
        description = new.description,
        piliers_eci = new.piliers_eci::text[],
        objectifs = new.objectifs,
        resultats_attendus = new.resultats_attendus::text[],
        cibles = new.cibles::text[],
        ressources = new.ressources,
        financements = new.financements,
        budget_previsionnel = new.budget_previsionnel,
        statut = new.statut::text,
        niveau_priorite = new.niveau_priorite::text,
        date_debut = new.date_debut,
        date_fin_provisoire = new.date_fin_provisoire,
        amelioration_continue = new.amelioration_continue,
        calendrier = new.calendrier,
        notes_complementaires = new.notes_complementaires,
        maj_termine = new.maj_termine,
        modified_at = new.modified_at,
        modified_by = new.modified_by,
        restreint = new.restreint,
        deleted = new is null
    where id in (select id
                 from historique.fiche_action
                 where fiche_id = id_fiche
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_by desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        insert into historique.fiche_action
        values (default,
                id_fiche,
                new.titre,
                old.titre,
                new.description,
                old.description,
                new.piliers_eci::text[],
                old.piliers_eci::text[],
                new.objectifs,
                old.objectifs,
                new.resultats_attendus::text[],
                old.resultats_attendus::text[],
                new.cibles::text[],
                old.cibles::text[],
                new.ressources,
                old.ressources,
                new.financements,
                old.financements,
                new.budget_previsionnel,
                old.budget_previsionnel,
                new.statut::text,
                old.statut::text,
                new.niveau_priorite::text,
                old.niveau_priorite::text,
                new.date_debut,
                old.date_debut,
                new.date_fin_provisoire,
                old.date_fin_provisoire,
                new.amelioration_continue,
                old.amelioration_continue,
                new.calendrier,
                old.calendrier,
                new.notes_complementaires,
                old.notes_complementaires,
                new.maj_termine,
                old.maj_termine,
                new.collectivite_id,
                new.created_at,
                new.modified_at,
                old.modified_at,
                auth.uid(),
                old.modified_by,
                new.restreint,
                old.restreint,
                new is null)
        returning id into updated;

        select id
        from historique.fiche_action faa
        where fiche_id = id_fiche
        and id <> updated
        order by faa.modified_at desc
        limit 1 into previous_fiche;

        if previous_fiche is not null then
            insert into historique.fiche_action_pilote (fiche_historise_id, user_id, tag_nom, previous)
            select updated, fap.user_id, fap.tag_nom, true
            from historique.fiche_action_pilote fap
            where fap.fiche_historise_id = previous_fiche;
        end if;

    else
        delete from historique.fiche_action_pilote where fiche_historise_id = updated and previous = false;
    end if;

    insert into historique.fiche_action_pilote (fiche_historise_id, user_id, tag_nom, previous)
    select updated, fap.user_id, pt.nom, false
    from public.fiche_action_pilote fap
    left join personne_tag pt on fap.tag_id = pt.id
    where fiche_id = id_fiche;

    return new;
end ;
$$ language plpgsql security definer;

create or replace function historique.save_fiche_action_pilote() returns trigger
as
$$
begin
    update fiche_action set modified_at = now() where id = new.fiche_id or id = old.fiche_id;
    return coalesce(new, old);
end ;
$$ language plpgsql security definer;


create trigger save_history
    after insert or update or delete
    on fiche_action
    for each row
execute procedure historique.save_fiche_action();

create trigger save_history
    after insert or delete
    on fiche_action_pilote
    for each row
execute procedure historique.save_fiche_action_pilote();

-- Ajoute la désactivation du trigger sur la suppression des pilotes
-- Ajoute security definer pour pouvoir désactiver le trigger
create or replace function delete_fiche_action() returns trigger
    security definer
    language plpgsql
as
$$
declare
begin
    delete from fiche_action_thematique where fiche_id = old.id;
    delete from fiche_action_sous_thematique where fiche_id = old.id;
    delete from fiche_action_partenaire_tag where fiche_id = old.id;
    delete from fiche_action_structure_tag where fiche_id = old.id;
    alter table fiche_action_pilote disable trigger save_history;
    delete from fiche_action_pilote where fiche_id = old.id;
    alter table fiche_action_pilote enable trigger save_history;
    delete from fiche_action_referent where fiche_id = old.id;
    delete from fiche_action_indicateur where fiche_id = old.id;
    delete from fiche_action_action where fiche_id = old.id;
    delete from fiche_action_axe where fiche_id = old.id;
    delete from fiche_action_financeur_tag where fiche_id = old.id;
    delete from fiche_action_service_tag where fiche_id = old.id;
    delete from fiche_action_lien where fiche_une = old.id or fiche_deux = old.id;
    return old;
end;
$$;

COMMIT;
