-- Deploy tet:labellisation/suivi_audit to pg

BEGIN;

create view suivi_audit
as
select c.id                                         as collectivite_id,
       ah.referentiel,
       ah.action_id,
       have_children,
       type,
       coalesce(statut, 'non_audite')::audit_statut as statut,
       cs.statuts,
       avis,
       ordre_du_jour,
       ordres_du_jour
from collectivite c
         join action_hierarchy ah on true
         left join action_audit_state s on s.action_id = ah.action_id and s.collectivite_id = c.id
    -- les statuts des enfants
         left join lateral (
    -- pour chaque action de `s` on agrège les statuts de ses descendants
    -- afin que le client puisse filtrer sur les statuts des enfants.
    --- ex: afficher l'axe et les actions où le statut est audité
    select case
               when s.statut is null -- si l'action 'parente' n'a pas de statut
                   then
                   coalesce(array_agg(distinct aas.statut),
                            '{non_audite}'::audit_statut[]
                       )
               else
                   '{}'::audit_statut[]
               end
               as statuts,
           case
               when s.statut is null -- si l'action 'parente' n'a pas de statut
                   then
                   coalesce(array_agg(distinct aas.ordre_du_jour), '{false}'::bool[])
               else
                   '{}'::bool[]
               end
               as ordres_du_jour
    from action_audit_state aas
             join action_hierarchy iah on iah.action_id = aas.action_id
    where aas.collectivite_id = c.id
      and iah.type = 'action'
      and aas.action_id = any (ah.descendants)
    ) cs on true
where (ah.type = 'axe' or ah.type = 'sous-axe' or ah.type = 'action')
order by naturalsort(ah.action_id);

COMMIT;
