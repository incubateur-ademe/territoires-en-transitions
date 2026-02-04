-- Revert tet:plan_action/migrate_calendrier_to_description from pg

BEGIN;

-- Drop the save_fiche_action trigger and function before adding columns back
DROP TRIGGER IF EXISTS save_history ON public.fiche_action;
DROP FUNCTION historique.save_fiche_action();

-- Add back the calendrier column to fiche_action table
alter table public.fiche_action
    add column calendrier varchar(10000);

-- Also add back to historique.fiche_action table
alter table historique.fiche_action
    add column calendrier varchar(10000),
    add column previous_calendrier varchar(10000);

-- restore content from the backup table
UPDATE public.fiche_action fa
SET calendrier = bak.calendrier,
    description = bak.description
FROM migration.migrate_calendrier_to_description bak
WHERE fa.id = bak.id;

-- Recreate save_fiche_action with calendrier
CREATE OR REPLACE FUNCTION historique.save_fiche_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        maj_termine = new.maj_termine,
        modified_at = new.modified_at,
        modified_by = new.modified_by,
        restreint = new.restreint,
        deleted = new is null
    where id in (select id
                 from historique.fiche_action
                 where fiche_id = id_fiche
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_at desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        -- utilise des noms de colonnes explicites car l'ordre original des
        -- colonnes n'est plus le même après le revert du champ calendrier
        insert into historique.fiche_action (
            fiche_id,
            titre,
            previous_titre,
            description,
            previous_description,
            piliers_eci,
            previous_piliers_eci,
            objectifs,
            previous_objectifs,
            resultats_attendus,
            previous_resultats_attendus,
            cibles,
            previous_cibles,
            ressources,
            previous_ressources,
            financements,
            previous_financements,
            budget_previsionnel,
            previous_budget_previsionnel,
            statut,
            previous_statut,
            niveau_priorite,
            previous_niveau_priorite,
            date_debut,
            previous_date_debut,
            date_fin_provisoire,
            previous_date_fin_provisoire,
            amelioration_continue,
            previous_amelioration_continue,
            maj_termine,
            previous_maj_termine,
            collectivite_id,
            created_at,
            modified_at,
            previous_modified_at,
            modified_by,
            previous_modified_by,
            restreint,
            previous_restreint,
            deleted,
            calendrier,
            previous_calendrier
        )
        values (id_fiche,
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
                new is null,
                new.calendrier,
                old.calendrier)
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
$function$
;

CREATE OR REPLACE TRIGGER save_history
    AFTER INSERT OR DELETE OR UPDATE
    ON public.fiche_action
    FOR EACH ROW
    EXECUTE FUNCTION historique.save_fiche_action();

COMMIT;
