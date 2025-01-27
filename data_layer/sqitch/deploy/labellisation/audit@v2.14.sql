-- Deploy tet:labellisation/audit to pg
BEGIN;

-- On sort la vue du schema public.
ALTER TABLE public.audit
DROP CONSTRAINT audit_en_attente;
ALTER TABLE public.audit
DROP CONSTRAINT audit_existant;
ALTER TABLE public.audit
DROP CONSTRAINT audit_collectivite_id_fkey;
ALTER TABLE public.audit
DROP CONSTRAINT audit_demande_id_fkey;
DROP INDEX IF EXISTS audit_existant;

CREATE TABLE labellisation.audit (
	id serial4 NOT NULL,
	collectivite_id int4 NOT NULL,
	"referentiel" public."referentiel" NOT NULL,
	demande_id int4 NULL,
	date_debut timestamptz NULL,
	date_fin timestamptz NULL,
	valide bool NOT NULL DEFAULT false,
	CONSTRAINT audit_en_attente UNIQUE NULLS NOT DISTINCT (collectivite_id, referentiel, date_debut, date_fin),
	CONSTRAINT audit_existant EXCLUDE USING gist (collectivite_id WITH =, referentiel WITH =, tstzrange(date_debut, date_fin) WITH &&) WHERE (((date_debut IS NOT NULL) AND (date_fin IS NOT NULL))),
	CONSTRAINT audit_pkey PRIMARY KEY (id),
	CONSTRAINT audit_collectivite_id_fkey FOREIGN KEY (collectivite_id) REFERENCES public.collectivite(id),
	CONSTRAINT audit_demande_id_fkey FOREIGN KEY (demande_id) REFERENCES labellisation.demande(id)
);
comment on table labellisation.audit is
    'Les audits par collectivité.';

alter table labellisation.audit enable row level security;

create policy allow_read
    on labellisation.audit
    for select
    using(is_authenticated());

create policy allow_insert
    on labellisation.audit
    for insert
    with check(have_edition_acces(collectivite_id));

create policy allow_update
    on labellisation.audit
    for update
    using(have_edition_acces(collectivite_id));



--TODO: CREATE INDEX audit_existant ON labellisation.audit USING gist (collectivite_id, referentiel, tstzrange(date_debut, date_fin)) WHERE ((date_debut IS NOT NULL) AND (date_fin IS NOT NULL));

-- Table Triggers

create trigger after_write_update_audit_scores after
insert
    or
update
    on
    labellisation.audit for each row execute function labellisation.update_audit_scores();

create trigger on_audit_update
    before update
    on labellisation.audit
    for each row
execute procedure labellisation.update_audit();

DROP VIEW IF EXISTS public.auditeurs;
DROP VIEW IF EXISTS public.audits;
DROP FUNCTION IF EXISTS public.labellisation_parcours(integer);
DROP FUNCTION labellisation.current_audit(integer,referentiel);

CREATE OR REPLACE FUNCTION labellisation.current_audit(col integer, ref public.referentiel)
 RETURNS labellisation.audit
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        into labellisation.audit (collectivite_id, referentiel, demande_id, date_debut, date_fin)
        select current_audit.col,
               current_audit.ref,
               null,
               null,
               null
        returning * into found;
    end if;

    return found;
end;
$function$
;

drop function if exists labellisation_parcours;

create function
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

             left join lateral (select *
                                from labellisation_demande(labellisation_parcours.collectivite_id,
                                                           e.referentiel)) demande on true

             left join lateral (select *
                                from labellisation.current_audit(labellisation_parcours.collectivite_id,
                                                                 e.referentiel)) audit on true

             left join lateral (select l.*
                                from labellisation l
                                where l.collectivite_id = labellisation_parcours.collectivite_id
                                  and l.referentiel = e.referentiel) labellisation on true;
end;
comment on function labellisation_parcours is
    'Renvoie le parcours de labellisation de chaque référentiel pour une collectivité donnée.';

CREATE OR REPLACE VIEW public.auditeurs
AS WITH ref AS (
         SELECT unnest(enum_range(NULL::public.referentiel)) AS referentiel
        )
 SELECT c.id AS collectivite_id,
    a.id AS audit_id,
    a.referentiel,
    jsonb_agg(jsonb_build_object('nom', dcp.nom, 'prenom', dcp.prenom)) AS noms
   FROM public.collectivite c
     JOIN ref ON true
     JOIN LATERAL labellisation.current_audit(c.id, ref.referentiel) a(id, collectivite_id, referentiel, demande_id, date_debut, date_fin) ON true
     JOIN public.audit_auditeur aa ON aa.audit_id = a.id
     JOIN utilisateur.dcp_display dcp ON aa.auditeur = dcp.user_id
  WHERE public.is_authenticated()
  GROUP BY c.id, a.id, a.referentiel;

CREATE OR REPLACE VIEW public.audits
AS WITH ref AS (
         SELECT unnest(enum_range(NULL::public.referentiel)) AS referentiel
        )
 SELECT c.id AS collectivite_id,
    ref.referentiel,
    a.audit,
    d.*::labellisation.demande AS demande,
    COALESCE(cot.actif, false) AS is_cot
   FROM public.collectivite c
     JOIN ref ON true
     LEFT JOIN LATERAL ( SELECT labellisation.current_audit(c.id, ref.referentiel) AS audit) a ON true
     LEFT JOIN labellisation.demande d ON d.id = (a.audit).demande_id
     LEFT JOIN public.cot ON c.id = cot.collectivite_id;

drop view if exists suivi_audit;
drop view if exists action_audit_state;
drop table if exists labellisation.action_audit_state;

CREATE TABLE labellisation.action_audit_state (
	id serial4 NOT NULL,
	audit_id int4 NULL,
	"action_id" public."action_id" NOT NULL,
	collectivite_id int4 NOT NULL,
	modified_by uuid NOT NULL DEFAULT auth.uid(),
	modified_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	ordre_du_jour bool NOT NULL DEFAULT false,
	avis text NOT NULL DEFAULT ''::text,
	statut public."audit_statut" NOT NULL DEFAULT 'non_audite'::public.audit_statut,
	CONSTRAINT action_audit_state_pkey PRIMARY KEY (id),
	CONSTRAINT action_audit_state_action_id_fkey FOREIGN KEY ("action_id") REFERENCES public.action_relation(id),
	CONSTRAINT action_audit_state_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES labellisation.audit(id),
	CONSTRAINT action_audit_state_collectivite_id_fkey FOREIGN KEY (collectivite_id) REFERENCES public.collectivite(id),
	CONSTRAINT action_audit_state_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES auth.users(id)
);

-- Table Triggers

create trigger set_modified_at before
update
    on
    labellisation.action_audit_state for each row execute function public.update_modified_at();

CREATE OR REPLACE VIEW public.action_audit_state
AS WITH action AS (
         SELECT ar_1.action_id
           FROM private.action_hierarchy ar_1
          WHERE ar_1.type = 'action'::public.action_type
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
     JOIN labellisation.audit a ON aas.audit_id = a.id;

-- View Triggers
create trigger upsert
    instead of insert
    on public.action_audit_state
    for each row
execute procedure labellisation.upsert_action_audit();

CREATE OR REPLACE VIEW public.suivi_audit
AS SELECT c.id AS collectivite_id,
    ah.referentiel,
    ah.action_id,
    ah.have_children,
    ah.type,
    COALESCE(s.statut, 'non_audite'::public.audit_statut) AS statut,
    cs.statuts,
    s.avis,
    s.ordre_du_jour,
    cs.ordres_du_jour
   FROM public.collectivite c
     JOIN private.action_hierarchy ah ON true
     LEFT JOIN public.action_audit_state s ON s.action_id::text = ah.action_id::text AND s.collectivite_id = c.id
     LEFT JOIN LATERAL ( SELECT
                CASE
                    WHEN s.statut IS NULL THEN COALESCE(array_agg(DISTINCT aas.statut), '{non_audite}'::public.audit_statut[])
                    ELSE '{}'::public.audit_statut[]
                END AS statuts,
                CASE
                    WHEN s.statut IS NULL THEN COALESCE(array_agg(DISTINCT aas.ordre_du_jour), '{f}'::boolean[])
                    ELSE '{}'::boolean[]
                END AS ordres_du_jour
           FROM public.action_audit_state aas
             JOIN private.action_hierarchy iah ON iah.action_id::text = aas.action_id::text
          WHERE aas.collectivite_id = c.id AND iah.type = 'action'::public.action_type AND (aas.action_id::text = ANY (ah.descendants::text[]))) cs ON true
  WHERE ah.type = 'axe'::public.action_type OR ah.type = 'sous-axe'::public.action_type OR ah.type = 'action'::public.action_type
  ORDER BY (public.naturalsort(ah.action_id::text));

CREATE OR REPLACE FUNCTION labellisation.pre_audit_service_statuts(audit_id integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
RETURN (WITH statut AS (SELECT h.id, h.collectivite_id, h.action_id, h.avancement, h.previous_avancement, h.avancement_detaille, h.previous_avancement_detaille, h.concerne, h.previous_concerne, h.modified_by, h.previous_modified_by, h.modified_at, h.previous_modified_at FROM (labellisation.audit JOIN LATERAL historique.action_statuts_at(audit.collectivite_id, audit.referentiel, audit.date_debut) h(id, collectivite_id, action_id, avancement, previous_avancement, avancement_detaille, previous_avancement_detaille, concerne, previous_concerne, modified_by, previous_modified_by, modified_at, previous_modified_at) ON (true)) WHERE (audit.id = pre_audit_service_statuts.audit_id)) SELECT jsonb_agg(evaluation.convert_statut(statut.action_id, statut.avancement, (statut.avancement_detaille)::double precision[], statut.concerne)) AS jsonb_agg FROM (statut LEFT JOIN public.action_relation ON (((statut.action_id)::text = (action_relation.id)::text))))
;

DROP FUNCTION labellisation.audit_evaluation_payload(audit public.audit);
CREATE OR REPLACE FUNCTION labellisation.audit_evaluation_payload(audit labellisation.audit, OUT referentiel jsonb, OUT statuts jsonb, OUT consequences jsonb)
 RETURNS record
 LANGUAGE sql
 STABLE
BEGIN ATOMIC
 WITH statuts AS (
          SELECT labellisation.pre_audit_service_statuts((audit_evaluation_payload.audit).id) AS data
         ), consequences AS (
          SELECT jsonb_object_agg(tuple.key, tuple.value) AS filtered
            FROM ((public.personnalisation_consequence pc
              JOIN LATERAL jsonb_each(pc.consequences) tuple(key, value) ON (true))
              JOIN public.action_relation ar ON ((tuple.key = (ar.id)::text)))
           WHERE ((pc.collectivite_id = (audit_evaluation_payload.audit).collectivite_id) AND (ar.referentiel = (audit_evaluation_payload.audit).referentiel))
         )
  SELECT r.data AS referentiel,
     COALESCE(s.data, to_jsonb('{}'::jsonb[])) AS statuts,
     COALESCE(c.filtered, to_jsonb('{}'::jsonb[])) AS consequences
    FROM ((evaluation.service_referentiel r
      LEFT JOIN statuts s ON (true))
      LEFT JOIN consequences c ON (true))
   WHERE (r.referentiel = (audit_evaluation_payload.audit).referentiel);
END
;

DROP VIEW IF EXISTS public.comparaison_scores_audit;
DROP FUNCTION IF EXISTS private.collectivite_score_comparaison(integer,referentiel);
DROP FUNCTION IF EXISTS private.collectivite_scores_pre_audit(collectivite_id integer, referentiel public.referentiel);
DROP TABLE public.pre_audit_scores;
CREATE TABLE public.pre_audit_scores (
	collectivite_id int4 NOT NULL,
	"referentiel" public."referentiel" NOT NULL,
	scores jsonb NOT NULL,
	modified_at timestamptz NOT NULL,
	payload_timestamp timestamptz NULL,
	audit_id int4 NOT NULL,
	CONSTRAINT pre_audit_scores_pkey PRIMARY KEY (collectivite_id, referentiel, audit_id),
	CONSTRAINT pre_audit_scores_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES labellisation.audit(id) ON DELETE CASCADE
);
alter table pre_audit_scores
    enable row level security;
create policy allow_read
    on pre_audit_scores for select
    using (true);

-- Table Triggers

create trigger check_payload_timestamp before
insert
    or
update
    on
    public.pre_audit_scores for each row execute function public.prevent_older_results();
create trigger modified_at before
insert
    or
update
    on
    public.pre_audit_scores for each row execute function public.update_modified_at();

CREATE OR REPLACE FUNCTION private.collectivite_scores_pre_audit(collectivite_id integer, referentiel public.referentiel)
 RETURNS SETOF public.tabular_score
 LANGUAGE sql
BEGIN ATOMIC
 SELECT sc.referentiel,
     sc.action_id,
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
     sc.avancement,
     sc.concerne,
     sc.desactive
    FROM ((public.pre_audit_scores
      JOIN LATERAL private.convert_client_scores(pre_audit_scores.scores) ccc(referentiel, action_id, concerne, desactive, point_fait, point_pas_fait, point_potentiel, point_programme, point_referentiel, total_taches_count, point_non_renseigne, point_potentiel_perso, completed_taches_count, fait_taches_avancement, pas_fait_taches_avancement, programme_taches_avancement, pas_concerne_taches_avancement) ON (true))
      JOIN LATERAL private.to_tabular_score(ccc.*) sc(referentiel, action_id, score_realise, score_programme, score_realise_plus_programme, score_pas_fait, score_non_renseigne, points_restants, points_realises, points_programmes, points_max_personnalises, points_max_referentiel, avancement, concerne, desactive) ON (true))
   WHERE ((pre_audit_scores.collectivite_id = collectivite_scores_pre_audit.collectivite_id) AND (pre_audit_scores.referentiel = collectivite_scores_pre_audit.referentiel));
END
;

CREATE OR REPLACE FUNCTION private.collectivite_score_comparaison(collectivite_id integer, referentiel public.referentiel)
 RETURNS TABLE(referentiel public.referentiel, courant public.tabular_score, pre_audit public.tabular_score)
 LANGUAGE sql
BEGIN ATOMIC
 WITH courant AS (
          SELECT private.collectivite_scores(collectivite_score_comparaison.collectivite_id, collectivite_score_comparaison.referentiel) AS score
         ), pre_audit AS (
          SELECT private.collectivite_scores_pre_audit(collectivite_score_comparaison.collectivite_id, collectivite_score_comparaison.referentiel) AS score
         )
  SELECT collectivite_score_comparaison.referentiel AS referentiel,
     courant.score,
     pre_audit.score
    FROM (courant
      JOIN pre_audit ON ((((pre_audit.score).action_id)::text = ((courant.score).action_id)::text)));
END
;

CREATE OR REPLACE VIEW public.comparaison_scores_audit
AS WITH ref AS (
         SELECT unnest(enum_range(NULL::public.referentiel)) AS referentiel
        )
 SELECT c.id AS collectivite_id,
    sc.referentiel,
    (sc.courant).action_id AS action_id,
    sc.courant,
    sc.pre_audit
   FROM public.collectivite c
     JOIN ref ON true
     JOIN LATERAL private.collectivite_score_comparaison(c.id, ref.referentiel) sc(referentiel, courant, pre_audit) ON true
  ORDER BY c.id, sc.referentiel, (public.naturalsort((sc.courant).action_id::text));

CREATE OR REPLACE VIEW public.audit_en_cours
AS SELECT a.id,
    a.collectivite_id,
    a.referentiel,
    a.demande_id,
    a.date_debut,
    a.date_fin,
    a.valide
   FROM labellisation.audit a
  WHERE a.date_fin IS NULL AND now() >= a.date_debut OR a.date_fin IS NOT NULL AND now() >= a.date_debut AND now() <= a.date_fin;

CREATE OR REPLACE VIEW public.retool_audit
AS SELECT a.collectivite_id,
    nc.nom,
    a.referentiel,
    a.date_debut,
    a.date_fin,
        CASE
            WHEN d.* IS NULL THEN 'sans labellisation'::text
            ELSE d.sujet::text
        END AS type_audit
   FROM labellisation.audit a
     JOIN public.named_collectivite nc USING (collectivite_id)
     LEFT JOIN ( SELECT demande.id,
            demande.en_cours,
            demande.collectivite_id,
            demande.referentiel,
            demande.etoiles,
            demande.date,
            demande.sujet
           FROM labellisation.demande
          WHERE demande.en_cours = false) d ON a.demande_id = d.id
  WHERE a.date_debut IS NOT NULL OR d.* IS NOT NULL;

DROP FUNCTION labellisation_commencer_audit(integer);
DROP VIEW IF EXISTS public.mes_collectivites;
DROP VIEW IF EXISTS public.collectivite_niveau_acces;
DROP POLICY IF EXISTS allow_insert on preuve_audit;
DROP POLICY IF EXISTS allow_update on preuve_audit;
DROP POLICY IF EXISTS allow_delete on preuve_audit;
DROP FUNCTION if exists est_auditeur(integer);
DROP VIEW IF EXISTS auditeurs;
DROP TABLE IF EXISTS audit_auditeur;
CREATE TABLE public.audit_auditeur (
	audit_id int4 NOT NULL,
	auditeur uuid NOT NULL,
	CONSTRAINT audit_auditeur_pkey PRIMARY KEY (audit_id, auditeur),
	CONSTRAINT audit_auditeur_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES labellisation.audit(id),
	CONSTRAINT audit_auditeur_auditeur_fkey FOREIGN KEY (auditeur) REFERENCES auth.users(id)
);

alter table audit_auditeur enable row level security;

create policy allow_read
    on audit_auditeur
    for select
    using(is_authenticated());

create policy allow_insert
    on audit_auditeur
    for insert
    with check(have_edition_acces((select a.collectivite_id
                                   from labellisation.audit a
                                   where a.id = audit_id
                                   limit 1)));
create policy allow_update
    on audit_auditeur
    for update
    using(have_edition_acces((select a.collectivite_id
                              from labellisation.audit a
                              where a.id = audit_id
                              limit 1)));

CREATE OR REPLACE VIEW public.auditeurs
AS WITH ref AS (
         SELECT unnest(enum_range(NULL::public.referentiel)) AS referentiel
        )
 SELECT c.id AS collectivite_id,
    a.id AS audit_id,
    a.referentiel,
    jsonb_agg(jsonb_build_object('nom', dcp.nom, 'prenom', dcp.prenom)) AS noms
   FROM public.collectivite c
     JOIN ref ON true
     JOIN LATERAL labellisation.current_audit(c.id, ref.referentiel) a(id, collectivite_id, referentiel, demande_id, date_debut, date_fin) ON true
     JOIN public.audit_auditeur aa ON aa.audit_id = a.id
     JOIN utilisateur.dcp_display dcp ON aa.auditeur = dcp.user_id
  WHERE public.is_authenticated()
  GROUP BY c.id, a.id, a.referentiel;

CREATE OR REPLACE FUNCTION public.labellisation_commencer_audit(audit_id integer)
 RETURNS labellisation.audit
 LANGUAGE sql
BEGIN ATOMIC
 UPDATE labellisation.audit SET date_debut = now()
   WHERE ((audit.id = labellisation_commencer_audit.audit_id) AND ((audit.id IN ( SELECT aa.audit_id
            FROM public.audit_auditeur aa
           WHERE (aa.auditeur = auth.uid()))) OR public.is_service_role()))
   RETURNING audit.id,
     audit.collectivite_id,
     audit.referentiel,
     audit.demande_id,
     audit.date_debut,
     audit.date_fin,
     audit.valide;
END
;

CREATE OR REPLACE FUNCTION public.est_auditeur(col integer)
 RETURNS boolean
 LANGUAGE sql
BEGIN ATOMIC
 WITH audit_en_cours AS (
          SELECT aa.auditeur
            FROM (labellisation.audit a
              JOIN public.audit_auditeur aa ON ((aa.audit_id = a.id)))
         )
  SELECT COALESCE(bool_or((auth.uid() = audit_en_cours.auditeur)), false) AS "coalesce"
    FROM audit_en_cours;
END
;

CREATE OR REPLACE VIEW public.collectivite_niveau_acces
AS WITH current_droits AS (
         SELECT private_utilisateur_droit.id,
            private_utilisateur_droit.user_id,
            private_utilisateur_droit.collectivite_id,
            private_utilisateur_droit.active,
            private_utilisateur_droit.created_at,
            private_utilisateur_droit.modified_at,
            private_utilisateur_droit.niveau_acces,
            private_utilisateur_droit.invitation_id
           FROM public.private_utilisateur_droit
          WHERE private_utilisateur_droit.user_id = auth.uid() AND private_utilisateur_droit.active
        )
 SELECT named_collectivite.collectivite_id,
    named_collectivite.nom,
    current_droits.niveau_acces,
    public.est_auditeur(named_collectivite.collectivite_id) AS est_auditeur,
    c.access_restreint
   FROM public.named_collectivite
     LEFT JOIN current_droits ON named_collectivite.collectivite_id = current_droits.collectivite_id
     LEFT JOIN public.collectivite c ON named_collectivite.collectivite_id = c.id
  ORDER BY (public.unaccent(named_collectivite.nom::text));

CREATE OR REPLACE VIEW public.mes_collectivites
AS SELECT collectivite_niveau_acces.collectivite_id,
    collectivite_niveau_acces.nom,
    collectivite_niveau_acces.niveau_acces,
    collectivite_niveau_acces.est_auditeur
   FROM public.collectivite_niveau_acces
  WHERE collectivite_niveau_acces.niveau_acces IS NOT NULL
  ORDER BY (public.unaccent(collectivite_niveau_acces.nom::text));


DROP VIEW IF EXISTS public.retool_preuves;
DROP VIEW IF EXISTS preuve;
DROP TABLE IF EXISTS public.preuve_audit;
CREATE TABLE public.preuve_audit (
	id serial4 NOT NULL,
	collectivite_id int4 NOT NULL,
	fichier_id int4 NULL,
	url text NULL,
	titre text NOT NULL DEFAULT ''::text,
	commentaire text NOT NULL DEFAULT ''::text,
	modified_by uuid NOT NULL DEFAULT auth.uid(),
	modified_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
	lien jsonb NULL GENERATED ALWAYS AS (
CASE
    WHEN url IS NOT NULL THEN jsonb_object(ARRAY['url'::text, url, 'titre'::text, titre])
    ELSE NULL::jsonb
END) STORED,
	audit_id int4 NOT NULL,
	CONSTRAINT preuve_audit_pkey PRIMARY KEY (id),
	CONSTRAINT preuve_base_check CHECK ((((fichier_id IS NOT NULL) AND (url IS NULL)) OR ((url IS NOT NULL) AND (fichier_id IS NULL)))),
	CONSTRAINT preuve_audit_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES labellisation.audit(id)
);

alter table preuve_audit
    enable row level security;
comment on table preuve_audit is
    'Permet de stocker les rapports d''audit';

alter table preuve_audit
    enable row level security;
comment on table preuve_audit is
    'Permet de stocker les rapports d''audit';

create policy allow_read
    on preuve_audit for select using (is_authenticated());
create policy allow_insert
    on preuve_audit for insert
    -- seuls les auditeurs peuvent ajouter les preuves d'audit.
    with check (have_edition_acces(collectivite_id) and est_auditeur(collectivite_id));
create policy allow_update
    on preuve_audit for update
    -- seuls les auditeurs peuvent éditer les preuves d'audit.
    using (have_edition_acces(collectivite_id) and est_auditeur(collectivite_id));
create policy allow_delete
    on preuve_audit for delete
    -- seuls les auditeurs peuvent supprimer les preuves d'audit.
    using (have_edition_acces(collectivite_id) and est_auditeur(collectivite_id));

CREATE OR REPLACE VIEW public.preuve
AS SELECT 'complementaire'::public.preuve_type AS preuve_type,
    pc.id,
    pc.collectivite_id,
    fs.snippet AS fichier,
    pc.lien,
    pc.commentaire,
    pc.modified_at AS created_at,
    pc.modified_by AS created_by,
    utilisateur.modified_by_nom(pc.modified_by) AS created_by_nom,
    snippet.snippet AS action,
    NULL::jsonb AS preuve_reglementaire,
    NULL::jsonb AS demande,
    NULL::jsonb AS rapport,
    NULL::jsonb AS audit
   FROM public.preuve_complementaire pc
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pc.fichier_id
     LEFT JOIN labellisation.action_snippet snippet ON snippet.action_id::text = pc.action_id::text AND snippet.collectivite_id = pc.collectivite_id
UNION ALL
 SELECT 'reglementaire'::public.preuve_type AS preuve_type,
    pr.id,
    c.id AS collectivite_id,
    fs.snippet AS fichier,
    pr.lien,
    pr.commentaire,
    pr.modified_at AS created_at,
    pr.modified_by AS created_by,
    utilisateur.modified_by_nom(pr.modified_by) AS created_by_nom,
    snippet.snippet AS action,
    to_jsonb(prd.*) AS preuve_reglementaire,
    NULL::jsonb AS demande,
    NULL::jsonb AS rapport,
    NULL::jsonb AS audit
   FROM public.collectivite c
     LEFT JOIN public.preuve_reglementaire_definition prd ON true
     LEFT JOIN public.preuve_reglementaire pr ON prd.id::text = pr.preuve_id::text AND c.id = pr.collectivite_id
     LEFT JOIN public.preuve_action pa ON prd.id::text = pa.preuve_id::text
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pr.fichier_id
     LEFT JOIN labellisation.action_snippet snippet ON snippet.action_id::text = pa.action_id::text AND snippet.collectivite_id = c.id
UNION ALL
 SELECT 'labellisation'::public.preuve_type AS preuve_type,
    p.id,
    d.collectivite_id,
    fs.snippet AS fichier,
    p.lien,
    p.commentaire,
    p.modified_at AS created_at,
    p.modified_by AS created_by,
    utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
    NULL::jsonb AS action,
    NULL::jsonb AS preuve_reglementaire,
    to_jsonb(d.*) AS demande,
    NULL::jsonb AS rapport,
    NULL::jsonb AS audit
   FROM labellisation.demande d
     JOIN public.preuve_labellisation p ON p.demande_id = d.id
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
UNION ALL
 SELECT 'rapport'::public.preuve_type AS preuve_type,
    p.id,
    p.collectivite_id,
    fs.snippet AS fichier,
    p.lien,
    p.commentaire,
    p.modified_at AS created_at,
    p.modified_by AS created_by,
    utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
    NULL::jsonb AS action,
    NULL::jsonb AS preuve_reglementaire,
    NULL::jsonb AS demande,
    to_jsonb(p.*) AS rapport,
    NULL::jsonb AS audit
   FROM public.preuve_rapport p
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
UNION ALL
 SELECT 'audit'::public.preuve_type AS preuve_type,
    p.id,
    a.collectivite_id,
    fs.snippet AS fichier,
    p.lien,
    p.commentaire,
    p.modified_at AS created_at,
    p.modified_by AS created_by,
    utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
    NULL::jsonb AS action,
    NULL::jsonb AS preuve_reglementaire,
        CASE
            WHEN d.* IS NOT NULL THEN to_jsonb(d.*)
            ELSE NULL::jsonb
        END AS demande,
    NULL::jsonb AS rapport,
    to_jsonb(a.*) AS audit
   FROM labellisation.audit a
     JOIN public.preuve_audit p ON p.audit_id = a.id
     LEFT JOIN labellisation.demande d ON a.demande_id = d.id
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id;

CREATE OR REPLACE VIEW public.retool_preuves
AS SELECT preuve.collectivite_id,
    nc.nom,
    preuve.action ->> 'referentiel'::text AS referentiel,
    preuve.action ->> 'identifiant'::text AS action,
    preuve.preuve_type,
    preuve.fichier ->> 'filename'::text AS fichier,
    preuve.lien ->> 'url'::text AS lien,
    preuve.created_at
   FROM public.preuve
     JOIN public.named_collectivite nc ON nc.collectivite_id = preuve.collectivite_id AND preuve.created_at IS NOT NULL
  WHERE public.is_service_role()
  ORDER BY preuve.collectivite_id, (preuve.action ->> 'referentiel'::text), (public.naturalsort(preuve.action ->> 'identifiant'::text));


drop table public.audit;

create view public.audit as
select *
from labellisation.audit;

-- Permet aux RLS de la table de s'appliquer aux requêtes de la vue.
    alter view public.audit set (security_invoker = on);

alter table audit_auditeur
    add column created_at timestamptz default current_timestamp;
comment on column audit_auditeur.created_at is 'La date à laquelle l''auditeur est rattaché.';

create or replace function
    labellisation.update_audit()
    returns trigger
    security definer
as
$$
begin
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


drop function labellisation_commencer_audit(integer);
create function labellisation_commencer_audit(
    audit_id integer,
    date_debut timestamptz default current_timestamp
)
    returns labellisation.audit
as
$$
declare
    audit labellisation.audit;
begin
    -- si l'utilisateur n'est ni auditeur ni service
    if not (audit_id in (select aa.audit_id from audit_auditeur aa where aa.auditeur = auth.uid()) or is_service_role())
    then -- alors on renvoie un code 403
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    -- si la demande est en cours
    if (select en_cours
        from audit a
                 join labellisation.demande d on a.demande_id = d.id
        where a.id = labellisation_commencer_audit.audit_id)
    then
        -- on renvoie un code 409 (conflict)
        perform set_config('response.status', '409', true);
        raise 'La demande liée à l''audit est en cours, elle n''a pas été envoyée.';
    end if;

    update labellisation.audit
    set date_debut = labellisation_commencer_audit.date_debut
    where id = audit_id
    returning * into audit;

    return audit;
end ;
$$ language plpgsql security definer;


create or replace function labellisation.current_audit(col integer, ref referentiel)
    returns labellisation.audit
    security definer
as
$$
    # variable_conflict use_column
declare
    found labellisation.audit;
begin
    select *
    into found
    from labellisation.audit a
    where a.collectivite_id = current_audit.col
      and a.referentiel = current_audit.ref
      and now() <@ tstzrange(date_debut, date_fin)
      -- les audits avec une date de début sont prioritaires sur ceux avec une plage infinie,
      -- ces derniers comprenant toujours `now()`.
    order by date_debut desc nulls last
    limit 1;

    if found is null
    then
        insert
        into labellisation.audit (collectivite_id, referentiel, demande_id, date_debut, date_fin)
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

COMMIT;
