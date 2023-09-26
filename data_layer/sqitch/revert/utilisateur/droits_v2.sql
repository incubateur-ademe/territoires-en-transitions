-- Deploy tet:utilisateur/droits_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

-- TABLES
alter policy allow_read on action_commentaire
    using (est_verifie());

alter policy allow_read on action_statut
    using (est_verifie());

alter policy allow_read on client_scores
    using (est_verifie());

alter policy allow_read on reponse_binaire
    using (est_verifie());

alter policy allow_read on reponse_choix
    using (est_verifie());

alter policy allow_read on reponse_proportion
    using (est_verifie());

alter policy allow_read on justification
    using (est_verifie());

alter policy allow_read on action_relation
    using (est_verifie());



-- FONCTIONS
create or replace function can_read_acces_restreint(collectivite_id integer) returns boolean
    stable
    security definer
    language sql
BEGIN ATOMIC
SELECT
    CASE
        WHEN ( SELECT collectivite.access_restreint
               FROM collectivite
               WHERE (collectivite.id = can_read_acces_restreint.collectivite_id)
               LIMIT 1) THEN (have_lecture_acces(collectivite_id) OR est_support() OR private.est_auditeur(collectivite_id))
        ELSE est_verifie()
        END AS est_verifie;
END;

create or replace function referentiel_down_to_action(referentiel referentiel) returns SETOF action_definition_summary
    language plpgsql
as
$$
declare
    referentiel_action_depth integer;
begin
    if referentiel_down_to_action.referentiel = 'cae'
    then
        select 3 into referentiel_action_depth;
    else
        select 2 into referentiel_action_depth;
    end if;
    return query
        select *
        from action_definition_summary
        where action_definition_summary.referentiel = referentiel_down_to_action.referentiel
          and action_definition_summary.depth <= referentiel_action_depth
          and est_verifie();
end;
$$;

create or replace function action_down_to_tache(referentiel referentiel, identifiant text) returns SETOF action_definition_summary
    language plpgsql
as
$$
declare
    referentiel_action_depth integer;
begin
    if action_down_to_tache.referentiel = 'cae'
    then
        select 3 into referentiel_action_depth;
    else
        select 2 into referentiel_action_depth;
    end if;
    return query
        select *
        from action_definition_summary
        where action_definition_summary.referentiel = action_down_to_tache.referentiel
          and action_definition_summary.identifiant like action_down_to_tache.identifiant || '%'
          and action_definition_summary.depth >= referentiel_action_depth - 1
          and est_verifie();
end
$$;

create or replace function labellisation_parcours(collectivite_id integer)
    returns TABLE(referentiel referentiel, etoiles labellisation.etoile, completude_ok boolean, critere_score jsonb, criteres_action jsonb, rempli boolean, calendrier text, demande jsonb, labellisation jsonb, audit jsonb)
    security definer
    language sql
BEGIN ATOMIC
WITH etoiles AS (
    SELECT etoiles.referentiel,
           etoiles.etoile_labellise,
           etoiles.prochaine_etoile_labellisation,
           etoiles.etoile_score_possible,
           etoiles.etoile_objectif
    FROM labellisation.etoiles(labellisation_parcours.collectivite_id) etoiles(referentiel, etoile_labellise, prochaine_etoile_labellisation, etoile_score_possible, etoile_objectif)
), all_critere AS (
    SELECT critere_action.referentiel,
           critere_action.etoiles,
           critere_action.action_id,
           critere_action.formulation,
           critere_action.score_realise,
           critere_action.min_score_realise,
           critere_action.score_programme,
           critere_action.min_score_programme,
           critere_action.atteint,
           critere_action.prio
    FROM labellisation.critere_action(labellisation_parcours.collectivite_id) critere_action(referentiel, etoiles, action_id, formulation, score_realise, min_score_realise, score_programme, min_score_programme, atteint, prio)
), current_critere AS (
    SELECT c.referentiel,
           c.etoiles,
           c.action_id,
           c.formulation,
           c.score_realise,
           c.min_score_realise,
           c.score_programme,
           c.min_score_programme,
           c.atteint,
           c.prio
    FROM (all_critere c
        JOIN etoiles e_1 ON (((e_1.referentiel = c.referentiel) AND (e_1.etoile_objectif >= c.etoiles))))
), criteres AS (
    SELECT ral.referentiel,
           ral.atteints,
           ral.liste
    FROM ( SELECT c.referentiel,
                  bool_and(c.atteint) AS atteints,
                  jsonb_agg(jsonb_build_object('formulation', c.formulation, 'prio', c.prio, 'action_id', c.action_id, 'rempli', c.atteint, 'etoile', c.etoiles, 'action_identifiant', ad.identifiant, 'statut_ou_score',
                                               CASE
                                                   WHEN ((c.min_score_realise = (100)::double precision) AND (c.min_score_programme IS NULL)) THEN 'Fait'::text
                                                   WHEN ((c.min_score_realise = (100)::double precision) AND (c.min_score_programme = (100)::double precision)) THEN 'Programmé ou fait'::text
                                                   WHEN ((c.min_score_realise IS NOT NULL) AND (c.min_score_programme IS NULL)) THEN (c.min_score_realise || '% fait minimum'::text)
                                                   ELSE (((c.min_score_realise || '% fait minimum ou '::text) || c.min_score_programme) || '% programmé minimum'::text)
                                                   END)) AS liste
           FROM (current_critere c
               JOIN action_definition ad ON (((c.action_id)::text = (ad.action_id)::text)))
           GROUP BY c.referentiel) ral
)
SELECT e.referentiel,
       e.etoile_objectif,
       rs.complet AS completude_ok,
       jsonb_build_object('score_a_realiser', cs.score_a_realiser, 'score_fait', cs.score_fait, 'atteint', cs.atteint, 'etoiles', cs.etoile_objectif) AS critere_score,
       criteres.liste AS criteres_action,
       (criteres.atteints AND cs.atteint AND
        CASE
            WHEN (cot.* IS NOT NULL) THEN true
            ELSE cf.atteint
            END) AS rempli,
       calendrier.information,
       to_jsonb(demande.*) AS to_jsonb,
       to_jsonb(labellisation.*) AS to_jsonb,
       to_jsonb(audit.*) AS to_jsonb
FROM (((((((((etoiles e
    JOIN criteres ON ((criteres.referentiel = e.referentiel)))
    LEFT JOIN labellisation.referentiel_score(labellisation_parcours.collectivite_id) rs(referentiel, score_fait, score_programme, completude, complet) ON ((rs.referentiel = e.referentiel)))
    LEFT JOIN labellisation.critere_score_global(labellisation_parcours.collectivite_id) cs(referentiel, etoile_objectif, score_a_realiser, score_fait, atteint) ON ((cs.referentiel = e.referentiel)))
    LEFT JOIN labellisation.critere_fichier(labellisation_parcours.collectivite_id) cf(referentiel, preuve_nombre, atteint) ON ((cf.referentiel = e.referentiel)))
    LEFT JOIN labellisation_calendrier calendrier ON ((calendrier.referentiel = e.referentiel)))
    LEFT JOIN cot ON ((cot.collectivite_id = labellisation_parcours.collectivite_id)))
    LEFT JOIN LATERAL ( SELECT d.id,
                               d.en_cours,
                               d.collectivite_id,
                               d.referentiel,
                               d.etoiles,
                               d.date,
                               d.sujet
                        FROM labellisation_demande(labellisation_parcours.collectivite_id, e.referentiel) d(id, en_cours, collectivite_id, referentiel, etoiles, date, sujet, modified_at, envoyee_le, demandeur)) demande ON (true))
    LEFT JOIN LATERAL ( SELECT a.id,
                               a.collectivite_id,
                               a.referentiel,
                               a.demande_id,
                               a.date_debut,
                               a.date_fin,
                               a.valide
                        FROM labellisation.current_audit(labellisation_parcours.collectivite_id, e.referentiel) a(id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide)) audit ON (true))
    LEFT JOIN LATERAL ( SELECT l.id,
                               l.collectivite_id,
                               l.referentiel,
                               l.obtenue_le,
                               l.annee,
                               l.etoiles,
                               l.score_realise,
                               l.score_programme
                        FROM labellisation l
                        WHERE ((l.collectivite_id = labellisation_parcours.collectivite_id) AND (l.referentiel = e.referentiel))
                        ORDER BY l.obtenue_le DESC
                        LIMIT 1) labellisation ON (true))
WHERE (est_verifie() OR is_service_role());
END;

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
            collectivite_id      = new.collectivite_id
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

create or replace function collectivite_membres(id integer)
    returns TABLE(user_id text, prenom text, nom text, email text, telephone text, niveau_acces niveau_acces, fonction membre_fonction, details_fonction text, champ_intervention referentiel[])
    security definer
    language sql
as
$$
with droits_dcp_membre as
         (select d.user_id,
                 p.prenom,
                 p.nom,
                 p.email,
                 p.telephone,
                 d.niveau_acces,
                 m.fonction,
                 m.details_fonction,
                 m.champ_intervention
          from private_utilisateur_droit d
                   left join utilisateur.dcp_display p on p.user_id = d.user_id
                   left join private_collectivite_membre m
                             on m.user_id = d.user_id and m.collectivite_id = d.collectivite_id
          where d.collectivite_id = collectivite_membres.id
            and d.active),
     invitations as (select null::uuid             as user_id,
                            null                   as prenom,
                            null                   as nom,
                            i.email,
                            null                   as telephone,
                            i.niveau::niveau_acces as niveau_acces,
                            null::membre_fonction  as fonction,
                            null                   as details_fonction,
                            null::referentiel[]    as champ_intervention
                     from utilisateur.invitation i
                     where i.collectivite_id = collectivite_membres.id
                       and i.pending),
     merged as (select *
                from droits_dcp_membre
                where is_authenticated() -- limit dcp listing to user with an account.
                union
                select *
                from invitations
                where have_edition_acces(collectivite_membres.id) -- do not show invitations to those who cannot invite.
     )
select *
from merged
where est_verifie()
order by case fonction
             when 'referent' then 1
             when 'technique' then 2
             when 'politique' then 3
             when 'conseiller' then 4
             else 5
             end,
         nom,
         prenom;
$$;

-- VUES
create or replace view action_statuts as
SELECT c.id                                             AS collectivite_id,
       d.action_id,
       client_scores.referentiel,
       d.type,
       d.descendants,
       d.ascendants,
       d.depth,
       d.have_children,
       d.identifiant,
       d.nom,
       d.description,
       d.have_exemples,
       d.have_preuve,
       d.have_ressources,
       d.have_reduction_potentiel,
       d.have_perimetre_evaluation,
       d.have_contexte,
       d.phase,
       sc.score_realise,
       sc.score_programme,
       sc.score_realise_plus_programme,
       sc.score_pas_fait,
       sc.score_non_renseigne,
       sc.points_restants,
       sc.points_realises,
       sc.points_programmes,
       sc.points_max_personnalises,
       sc.points_max_referentiel,
       sc.concerne,
       sc.desactive,
       s.avancement,
       s.avancement_detaille,
       cs.avancements                                   AS avancement_descendants,
       COALESCE(NOT s.concerne, cs.non_concerne, false) AS non_concerne
FROM collectivite c
         JOIN client_scores ON client_scores.collectivite_id = c.id
         JOIN LATERAL private.convert_client_scores(client_scores.scores) ccc(referentiel, action_id, concerne,
                                                                              desactive, point_fait, point_pas_fait,
                                                                              point_potentiel, point_programme,
                                                                              point_referentiel, total_taches_count,
                                                                              point_non_renseigne,
                                                                              point_potentiel_perso,
                                                                              completed_taches_count,
                                                                              fait_taches_avancement,
                                                                              pas_fait_taches_avancement,
                                                                              programme_taches_avancement,
                                                                              pas_concerne_taches_avancement) ON true
         JOIN LATERAL private.to_tabular_score(ccc.*) sc(referentiel, action_id, score_realise, score_programme,
                                                         score_realise_plus_programme, score_pas_fait,
                                                         score_non_renseigne, points_restants, points_realises,
                                                         points_programmes, points_max_personnalises,
                                                         points_max_referentiel, avancement, concerne, desactive)
              ON true
         JOIN action_referentiel d ON sc.action_id::text = d.action_id::text
         LEFT JOIN action_statut s ON c.id = s.collectivite_id AND s.action_id::text = d.action_id::text
         LEFT JOIN LATERAL ( SELECT CASE
                                        WHEN NOT d.have_children THEN '{}'::avancement[]
                                        WHEN ccc.point_non_renseigne = ccc.point_potentiel
                                            THEN '{non_renseigne}'::avancement[]
                                        WHEN ccc.point_non_renseigne > 0.0::double precision THEN
                                                '{non_renseigne}'::avancement[] ||
                                                array_agg(DISTINCT statut.avancement) FILTER (WHERE statut.concerne)
                                        ELSE array_agg(DISTINCT statut.avancement) FILTER (WHERE statut.concerne)
                                        END                       AS avancements,
                                    NOT bool_and(statut.concerne) AS non_concerne
                             FROM action_statut statut
                             WHERE c.id = statut.collectivite_id
                               AND (statut.action_id::text = ANY (d.leaves::text[]))) cs ON true
WHERE est_verifie()
ORDER BY c.id, (naturalsort(d.identifiant));

create or replace view question_thematique_completude as
SELECT c.id    AS collectivite_id,
       qtd.id,
       qtd.nom,
       qtd.referentiels,
       CASE
           WHEN private.reponse_count_by_thematique(c.id, qt.id) >= private.question_count_for_thematique(c.id, qt.id)
               THEN 'complete'::thematique_completude
           ELSE 'a_completer'::thematique_completude
           END AS completude
FROM collectivite c
         LEFT JOIN question_thematique qt ON true
         LEFT JOIN question_thematique_display qtd ON qtd.id::text = qt.id::text
WHERE qtd.referentiels IS NOT NULL
  AND est_verifie()
ORDER BY (
             CASE
                 WHEN qtd.id::text = 'identite'::text THEN '0'::text
                 ELSE qtd.nom
                 END);

create or replace view question_thematique_display(id, nom, referentiels) as
WITH qt AS (SELECT qa.action_id,
                   q.thematique_id
            FROM question_action qa
                     JOIN question q ON qa.question_id::text = q.id::text),
     qr AS (SELECT qt.thematique_id,
                   array_agg(DISTINCT r.referentiel) AS referentiels
            FROM qt
                     JOIN action_relation r ON r.id::text = qt.action_id::text
            GROUP BY qt.thematique_id)
SELECT t.id,
       t.nom,
       qr.referentiels
FROM question_thematique t
         LEFT JOIN qr ON qr.thematique_id::text = t.id::text
WHERE est_verifie();

create or replace view question_display as
WITH actions AS (SELECT question_action.question_id,
                        array_agg(question_action.action_id) AS action_ids
                 FROM question_action
                 GROUP BY question_action.question_id),
     q AS (SELECT q_1.id,
                  a.action_ids,
                  q_1.thematique_id,
                  q_1.type,
                  t.nom   AS thematique_nom,
                  q_1.description,
                  q_1.types_collectivites_concernees,
                  q_1.formulation,
                  q_1.ordonnancement,
                  cx.json AS choix
           FROM question q_1
                    JOIN question_thematique t ON t.id::text = q_1.thematique_id::text
                    JOIN actions a ON q_1.id::text = a.question_id::text
                    LEFT JOIN LATERAL ( SELECT array_agg(json_build_object('id', c.id, 'label', c.formulation,
                                                                           'ordonnancement', c.ordonnancement)) AS json
                                        FROM question_choix c
                                        WHERE c.question_id::text = q_1.id::text) cx ON true)
SELECT q.id,
       q.action_ids,
       i.id AS collectivite_id,
       q.thematique_id,
       q.type,
       q.thematique_nom,
       q.description,
       q.types_collectivites_concernees,
       q.formulation,
       q.ordonnancement,
       q.choix,
       i.population,
       i.localisation
FROM q
         JOIN collectivite_identite i
              ON q.types_collectivites_concernees && i.type OR q.types_collectivites_concernees IS NULL
WHERE est_verifie();

create or replace view reponse_display as
SELECT r.collectivite_id,
       q.id                                              AS question_id,
       json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse',
                         r.reponse)                      AS reponse,
       (SELECT j.texte
        FROM justification j
        WHERE j.collectivite_id = r.collectivite_id
          AND j.question_id::text = r.question_id::text) AS justification
FROM reponse_binaire r
         JOIN question q ON r.question_id::text = q.id::text
WHERE est_verifie()
UNION ALL
SELECT r.collectivite_id,
       q.id                                              AS question_id,
       json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse',
                         r.reponse)                      AS reponse,
       (SELECT j.texte
        FROM justification j
        WHERE j.collectivite_id = r.collectivite_id
          AND j.question_id::text = r.question_id::text) AS justification
FROM reponse_proportion r
         JOIN question q ON r.question_id::text = q.id::text
WHERE est_verifie()
UNION ALL
SELECT r.collectivite_id,
       q.id                                              AS question_id,
       json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse',
                         r.reponse)                      AS reponse,
       (SELECT j.texte
        FROM justification j
        WHERE j.collectivite_id = r.collectivite_id
          AND j.question_id::text = r.question_id::text) AS justification
FROM reponse_choix r
         JOIN question q ON r.question_id::text = q.id::text
WHERE est_verifie();



COMMIT;
