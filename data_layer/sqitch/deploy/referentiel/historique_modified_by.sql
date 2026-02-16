-- Deploy tet:referentiel/historique_modified_by to pg

BEGIN;

create or replace function historique.save_action_statut() returns trigger
as
$$
declare
    updated integer;
begin
    update historique.action_statut
    set avancement          = new.avancement,
        avancement_detaille = new.avancement_detaille,
        modified_at         = new.modified_at,
        concerne            = new.concerne -- le non concerné n'était pas historisé
    where id in (select id
                 from historique.action_statut
                 where collectivite_id = new.collectivite_id
                   and action_id = new.action_id
                   and modified_by = COALESCE(auth.uid(), new.modified_by)
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_at desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        insert into historique.action_statut
        values (default,
                new.collectivite_id,
                new.action_id,
                new.avancement,
                old.avancement,
                new.avancement_detaille,
                old.avancement_detaille,
                new.concerne,
                old.concerne,
                COALESCE(auth.uid(), new.modified_by),
                old.modified_by,
                new.modified_at,
                old.modified_at);
    end if;
    return new;
end ;
$$ language plpgsql security definer;

create or replace function historique.save_action_precision() returns trigger
as
$$
declare
    updated integer;
begin
    update historique.action_precision
    set precision          = new.commentaire,
        modified_at        = new.modified_at
    where id in (select id
                 from historique.action_precision
                 where collectivite_id = new.collectivite_id
                   and action_id = new.action_id
                   and modified_by = COALESCE(auth.uid(), new.modified_by)
                   and modified_at > new.modified_at - interval '1 hour'
                 order by modified_at desc
                 limit 1)
    returning id into updated;

    if updated is null
    then
        insert into historique.action_precision
        values (default,
                new.collectivite_id,
                new.action_id,
                new.commentaire,
                old.commentaire,
                COALESCE(auth.uid(), new.modified_by),
                old.modified_by,
                new.modified_at,
                old.modified_at);
    end if;

    return new;
end;
$$ language plpgsql security definer;

COMMIT;
