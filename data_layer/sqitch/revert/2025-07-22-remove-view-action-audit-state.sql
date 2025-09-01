-- Revert tet:2025-07-22-remove-view-action-audit-state from pg

BEGIN;

create or replace view action_audit_state as
 WITH action AS (
         SELECT ar_1.action_id
           FROM private.action_hierarchy ar_1
          WHERE ar_1.type = 'action'::action_type
        )
 SELECT ar.action_id,
    aas.id AS state_id,
    aas.statut,
    aas.avis,
    aas.ordre_du_jour,
    a.id AS audit_id,
    a.collectivite_id,
    a.referentiel
   FROM action ar
     LEFT JOIN labellisation.action_audit_state aas ON ar.action_id::text = aas.action_id::text
     JOIN labellisation.audit a ON aas.audit_id = a.id
  WHERE have_lecture_acces(a.collectivite_id) OR est_support() OR est_auditeur(a.collectivite_id, a.referentiel);


create or replace function labellisation.upsert_action_audit() returns trigger
    security definer
    language plpgsql
as
$$
declare
    found_audit audit;
begin
    if not have_edition_acces(new.collectivite_id) and
       not private.est_auditeur(new.collectivite_id)
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

    insert into labellisation.action_audit_state (audit_id, action_id, collectivite_id, avis, ordre_du_jour, statut)
    values (found_audit.id, new.action_id, new.collectivite_id, coalesce(new.avis, ''), new.ordre_du_jour,
            new.statut)
    on conflict (action_id, audit_id) do update set avis          = excluded.avis,
                                                    ordre_du_jour = excluded.ordre_du_jour,
                                                    statut        = excluded.statut;
    return new;
end
$$;


create trigger upsert
    instead of insert
    on public.action_audit_state
    for each row
execute procedure labellisation.upsert_action_audit();


create or replace view suivi_audit as
 SELECT c.id AS collectivite_id,
    ah.referentiel,
    ah.action_id,
    ah.have_children,
    ah.type,
    COALESCE(s.statut, 'non_audite'::audit_statut) AS statut,
    cs.statuts,
    s.avis,
    s.ordre_du_jour,
    cs.ordres_du_jour
   FROM collectivite c
     JOIN private.action_hierarchy ah ON true
     LEFT JOIN action_audit_state s ON s.action_id::text = ah.action_id::text AND s.collectivite_id = c.id
     LEFT JOIN LATERAL ( SELECT
                CASE
                    WHEN s.statut IS NULL THEN COALESCE(array_agg(DISTINCT aas.statut), '{non_audite}'::audit_statut[])
                    ELSE '{}'::audit_statut[]
                END AS statuts,
                CASE
                    WHEN s.statut IS NULL THEN COALESCE(array_agg(DISTINCT aas.ordre_du_jour), '{f}'::boolean[])
                    ELSE '{}'::boolean[]
                END AS ordres_du_jour
           FROM action_audit_state aas
             JOIN private.action_hierarchy iah ON iah.action_id::text = aas.action_id::text
          WHERE aas.collectivite_id = c.id AND iah.type = 'action'::action_type AND (aas.action_id::text = ANY (ah.descendants::text[]))) cs ON true
  WHERE (ah.type = 'axe'::action_type OR ah.type = 'sous-axe'::action_type OR ah.type = 'action'::action_type) AND (have_lecture_acces(c.id) OR est_support() OR est_auditeur_action(c.id, ah.action_id))
  ORDER BY (naturalsort(ah.action_id::text));

COMMIT;
