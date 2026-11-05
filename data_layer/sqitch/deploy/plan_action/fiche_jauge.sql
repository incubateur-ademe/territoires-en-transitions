-- Deploy tet:plan_action/fiche_jauge to pg
-- requires: plan_action/fix_save_fiche_action_modified_by

BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.fiche_action
    ADD COLUMN jauge integer NOT NULL DEFAULT 0
    CONSTRAINT fiche_action_jauge_check
    CHECK (jauge BETWEEN 0 AND 100 AND jauge % 5 = 0);

ALTER TABLE historique.fiche_action
    ADD COLUMN jauge integer,
    ADD COLUMN previous_jauge integer;

-- Un changement de jauge garde sa propre ligne, hors du regroupement par heure :
-- la date du dernier changement de jauge se lit dans l'historique.
-- L'insert nomme ses colonnes : l'ordre de la table ne compte plus.
create or replace function historique.save_fiche_action()
 returns trigger
 language plpgsql
 security definer
as $function$
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
        maj_termine = new.maj_termine,
        modified_at = new.modified_at,
        modified_by = new.modified_by,
        restreint = new.restreint,
        jauge = new.jauge,
        deleted = new is null
    where id in (select id
                 from historique.fiche_action
                 where fiche_id = id_fiche
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_at desc
                 limit 1)
      and (tg_op <> 'UPDATE' or new.jauge = old.jauge)
      and coalesce(jauge = coalesce(previous_jauge, 0), true)
    returning id into updated;

    if updated is null
    then
        insert into historique.fiche_action (
            fiche_id,
            titre, previous_titre,
            description, previous_description,
            piliers_eci, previous_piliers_eci,
            objectifs, previous_objectifs,
            resultats_attendus, previous_resultats_attendus,
            cibles, previous_cibles,
            ressources, previous_ressources,
            financements, previous_financements,
            budget_previsionnel, previous_budget_previsionnel,
            statut, previous_statut,
            niveau_priorite, previous_niveau_priorite,
            date_debut, previous_date_debut,
            date_fin_provisoire, previous_date_fin_provisoire,
            amelioration_continue, previous_amelioration_continue,
            maj_termine, previous_maj_termine,
            collectivite_id,
            created_at,
            modified_at, previous_modified_at,
            modified_by, previous_modified_by,
            restreint, previous_restreint,
            jauge, previous_jauge,
            deleted)
        values (id_fiche,
                new.titre, old.titre,
                new.description, old.description,
                new.piliers_eci::text[], old.piliers_eci::text[],
                new.objectifs, old.objectifs,
                new.resultats_attendus::text[], old.resultats_attendus::text[],
                new.cibles::text[], old.cibles::text[],
                new.ressources, old.ressources,
                new.financements, old.financements,
                new.budget_previsionnel, old.budget_previsionnel,
                new.statut::text, old.statut::text,
                new.niveau_priorite::text, old.niveau_priorite::text,
                new.date_debut, old.date_debut,
                new.date_fin_provisoire, old.date_fin_provisoire,
                new.amelioration_continue, old.amelioration_continue,
                new.maj_termine, old.maj_termine,
                new.collectivite_id,
                new.created_at,
                new.modified_at, old.modified_at,
                new.modified_by, old.modified_by,
                new.restreint, old.restreint,
                new.jauge, old.jauge,
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
$function$;

COMMIT;
