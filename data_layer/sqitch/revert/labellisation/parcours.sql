-- Deploy tet:labellisation/parcours to pg
-- requires: labellisation/prerequis

BEGIN;

create or replace function
    labellisation_parcours(collectivite_id integer)
    returns table
            (
                referentiel     referentiel,
                etoiles         labellisation.etoile,
                completude_ok   boolean,
                critere_score   jsonb,
                criteres_action jsonb,
                rempli          boolean,
                calendrier      text,
                demande         jsonb, -- labellisation.demande
                labellisation   jsonb, -- labellisation
                audit           jsonb  -- audit
            )
    security definer
begin
    atomic
    with etoiles as (select *
                     from labellisation.etoiles(labellisation_parcours.collectivite_id)),
         all_critere as (select *
                         from labellisation.critere_action(labellisation_parcours.collectivite_id)),
         -- les critères pour l'étoile visée et les précédentes.
         current_critere as (select c.*
                             from all_critere c
                                      join etoiles e
                                           on e.referentiel = c.referentiel and e.etoile_objectif >= c.etoiles),
         criteres as (select *
                      from (select c.referentiel,
                                   bool_and(c.atteint) as atteints,
                                   jsonb_agg(
                                           jsonb_build_object(
                                                   'formulation', formulation,
                                                   'prio', c.prio,
                                                   'action_id', c.action_id,
                                                   'rempli', c.atteint,
                                                   'etoile', c.etoiles,
                                                   'action_identifiant', ad.identifiant,
                                                   'statut_ou_score',
                                                   case
                                                       when c.min_score_realise = 100 and c.min_score_programme is null
                                                           then 'Fait'
                                                       when c.min_score_realise = 100 and c.min_score_programme = 100
                                                           then 'Programmé ou fait'
                                                       when c.min_score_realise is not null and c.min_score_programme is null
                                                           then c.min_score_realise || '% fait minimum'
                                                       else c.min_score_realise || '% fait minimum ou ' ||
                                                            c.min_score_programme || '% programmé minimum'
                                                       end
                                               )
                                       )               as liste
                            from current_critere c
                                     join action_definition ad on c.action_id = ad.action_id
                            group by c.referentiel) ral)
    select e.referentiel,
           e.etoile_objectif,
           rs.complet                                      as completude_ok,

           jsonb_build_object(
                   'score_a_realiser', cs.score_a_realiser,
                   'score_fait', cs.score_fait,
                   'atteint', cs.atteint,
                   'etoiles', cs.etoile_objectif)          as critere_score,

           criteres.liste                                  as criteres_action,
           criteres.atteints and cs.atteint and cf.atteint as rempli,
           calendrier.information,

           to_jsonb(demande),
           to_jsonb(labellisation),
           to_jsonb(audit)

    from etoiles as e
             join criteres on criteres.referentiel = e.referentiel
             left join labellisation.referentiel_score(labellisation_parcours.collectivite_id) rs
                       on rs.referentiel = e.referentiel
             left join labellisation.critere_score_global(labellisation_parcours.collectivite_id) cs
                       on cs.referentiel = e.referentiel
             left join labellisation.critere_fichier(labellisation_parcours.collectivite_id) cf
                       on cf.referentiel = e.referentiel
             left join labellisation_calendrier calendrier
                       on calendrier.referentiel = e.referentiel

             left join lateral (select d.id,
                                       d.en_cours,
                                       d.collectivite_id,
                                       d.referentiel,
                                       d.etoiles,
                                       d.date,
                                       d.sujet
                                from labellisation_demande(labellisation_parcours.collectivite_id,
                                                           e.referentiel) d) demande on true

             left join lateral (select a.id,
                                       a.collectivite_id,
                                       a.referentiel,
                                       a.demande_id,
                                       a.date_debut,
                                       a.date_fin,
                                       a.valide
                                from labellisation.current_audit(labellisation_parcours.collectivite_id,
                                                                 e.referentiel) a) audit on true

             left join lateral (select l.id,
                                       l.collectivite_id,
                                       l.referentiel,
                                       l.obtenue_le,
                                       l.annee,
                                       l.etoiles,
                                       l.score_realise,
                                       l.score_programme
                                from labellisation l
                                where l.collectivite_id = labellisation_parcours.collectivite_id
                                  and l.referentiel = e.referentiel
                                order by l.obtenue_le desc
                                limit 1) labellisation on true;
end;

COMMIT;
