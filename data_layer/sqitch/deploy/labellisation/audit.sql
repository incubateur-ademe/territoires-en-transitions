-- Deploy tet:labellisation/audit to pg
BEGIN;

create or replace function
    labellisation.update_audit()
    returns trigger
    security definer
as
$$
begin
    -- si l'utilisateur n'est ni éditeur ni service
    if not (have_edition_acces(new.collectivite_id) or is_service_role())
    then -- alors on renvoie un code 403
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    -- si la collectivité est COT
    -- et que l'audit n'est pas dans le cadre d'une demande de labellisation
    -- et que l'audit passe en 'validé'
    if (new.collectivite_id in (select collectivite_id from cot)
        and
        (new.demande_id is null or (select sujet = 'cot' from labellisation.demande ld where ld.id = new.demande_id))
        and new.valide
        and not old.valide)
    then -- alors on termine l'audit
        new.date_fin = now();
    end if;

    return new;
end ;
$$ language plpgsql;

alter table audit
    drop constraint audit_existant;
alter table audit
    add constraint
        audit_existant exclude using GIST (
        -- Audit unique pour une collectivité, un référentiel, et une période de temps
        collectivite_id with =,
        referentiel with =,
        tstzrange(date_debut, date_fin) with &&
        )
        -- on exclut les plages infinies qui se superposent à toutes les autres.
        where (date_debut is not null and date_fin is not null);
alter table audit
    add constraint
        audit_en_attente
        -- Contrainte complémentaire pour éviter la duplication de plage infinies.
        -- Nouvelle feature de pg15, pour que unique s'applique aux nulls
        -- https://www.postgresql.org/docs/15/ddl-constraints.html
        unique nulls not distinct (collectivite_id, referentiel, date_debut, date_fin);

create function
    labellisation_commencer_audit(audit_id integer)
    returns audit
begin
    atomic
    update audit
    set date_debut = now()
    where id = audit_id
      and (id in (select aa.audit_id from audit_auditeur aa where aa.auditeur = auth.uid()) or is_service_role())
    returning *;
end;
comment on function labellisation_commencer_audit is
    'Commence un audit, c''est à dire met la date de début à now(). '
        'Seul l''auditeur et le service role peuvent commencer un audit.';

create or replace function labellisation.current_audit(col integer, ref referentiel)
    returns audit
    security definer
as
$$
    # variable_conflict use_column
declare
    found audit;
begin
    select *
    into found
    from audit a
    where a.collectivite_id = current_audit.col
      and a.referentiel = current_audit.ref
      and now() <@ tstzrange(date_debut, date_fin)
    order by date_debut desc
    limit 1;

    if found is null
    then
        insert
        into audit (collectivite_id, referentiel, demande_id, date_debut, date_fin)
        select current_audit.col,
               current_audit.ref,
               null,
               null,
               null
        returning * into found;
    end if;

    return found;
end;
$$ language plpgsql;

create or replace function labellisation.upsert_action_audit()
    returns trigger as
$$
declare
    found_audit          audit;
    existing_audit_state labellisation.action_audit_state;

begin
    if not have_edition_acces(new.collectivite_id)
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    found_audit = labellisation.current_audit(
            new.collectivite_id,
            (select ar.referentiel
             from action_relation ar
             where ar.id = new.action_id)
        );

    if found_audit.date_debut is null
    then
        raise 'Pas d''audit en cours.';
    end if;

    if not (select bool_or(auth.uid() = auditeur) from audit_auditeur where audit_id = found_audit.id)
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''est pas auditeur sur l''audit de la collectivité.';
    end if;

    select *
    from labellisation.action_audit_state
    where audit_id = found_audit.id
      and collectivite_id = new.collectivite_id
      and action_id = new.action_id
    into existing_audit_state;

    if existing_audit_state is null
    then
        insert into labellisation.action_audit_state (audit_id, action_id, collectivite_id, avis, ordre_du_jour, statut)
        values (found_audit.id, new.action_id, new.collectivite_id, coalesce(new.avis, ''), new.ordre_du_jour,
                new.statut);
    else
        update labellisation.action_audit_state
        set avis          = coalesce(new.avis, ''),
            ordre_du_jour = new.ordre_du_jour,
            statut        = new.statut
        where id = existing_audit_state.id;
    end if;

    return new;
end
$$ language plpgsql security definer;

create or replace
    function est_auditeur(col integer)
    returns boolean
begin
    atomic
    with audit_en_cours as (select auditeur
                            from audit a
                                     join audit_auditeur aa on aa.audit_id = a.id)
    select coalesce(bool_or(auth.uid() = audit_en_cours.auditeur), false)
    from audit_en_cours;
end;

COMMIT;
