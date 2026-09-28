-- Revert tet:stats/drop_posthog_schema from pg

BEGIN;

-- Définitions reprises de la base avant suppression. Le cron
-- posthog_send_yesterday_events, créé hors sqitch et cassé, n'est pas recréé,
-- ni la ligne de posthog.configuration (clé d'API).

-- posthog.event(collectivite) lit stats.crm_usages, qui n'existe plus.
set local check_function_bodies = off;

CREATE SCHEMA posthog;

CREATE FUNCTION posthog.creation_event(public.dcp) RETURNS TABLE(event text, "timestamp" text, distinct_id text, properties jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    BEGIN ATOMIC
 SELECT 'compte_creation'::text AS event,
     TRIM(BOTH '"'::text FROM (to_json(($1).modified_at))::text) AS "timestamp",
     ($1).user_id AS distinct_id,
     json_build_object('$set', json_build_object('email', ($1).email, 'name', ((($1).prenom || ' '::text) || ($1).nom))) AS properties;
END;

COMMENT ON FUNCTION posthog.creation_event(public.dcp) IS 'Événement de création de compte';

CREATE VIEW posthog.creation AS
 SELECT 'fiche'::text AS type,
    fiche_action.created_at AS "time",
    fiche_action.modified_by AS user_id,
    fiche_action.collectivite_id
   FROM (public.fiche_action
     JOIN stats.collectivite_active USING (collectivite_id))
  WHERE (fiche_action.modified_by IS NOT NULL)
UNION ALL
 SELECT 'plan'::text AS type,
    axe.created_at AS "time",
    axe.modified_by AS user_id,
    axe.collectivite_id
   FROM (public.axe
     JOIN stats.collectivite_active USING (collectivite_id))
  WHERE ((axe.parent IS NULL) AND (axe.modified_by IS NOT NULL))
UNION ALL
 SELECT 'discussion'::text AS type,
    discussion.created_at AS "time",
    discussion.created_by AS user_id,
    discussion.collectivite_id
   FROM public.discussion
UNION ALL
 SELECT 'indicateur_objectif_futur'::text AS type,
    rv.ts AS "time",
    ((rv.record ->> 'modified_by'::text))::uuid AS user_id,
    ((rv.record -> 'collectivite_id'::text))::integer AS collectivite_id
   FROM audit.record_version rv
  WHERE ((rv.table_name = 'indicateur_objectif'::name) AND (rv.op = 'INSERT'::audit.operation) AND ((((rv.record -> 'annee'::text))::integer)::numeric > EXTRACT(year FROM CURRENT_DATE)) AND ((rv.record ->> 'modified_by'::text) IS NOT NULL))
UNION ALL
 SELECT 'indicateur_personnalise_objectif_futur'::text AS type,
    rv.ts AS "time",
    ((rv.record ->> 'modified_by'::text))::uuid AS user_id,
    ((rv.record -> 'collectivite_id'::text))::integer AS collectivite_id
   FROM audit.record_version rv
  WHERE ((rv.table_name = 'indicateur_personnalise_objectif'::name) AND (rv.op = 'INSERT'::audit.operation) AND ((((rv.record -> 'annee'::text))::integer)::numeric > EXTRACT(year FROM CURRENT_DATE)) AND ((rv.record ->> 'modified_by'::text) IS NOT NULL));

COMMENT ON VIEW posthog.creation IS 'Les actions de creation destinées à être transformées en events.';

CREATE FUNCTION posthog.event(posthog.creation) RETURNS TABLE(event text, "timestamp" text, distinct_id text, properties jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    BEGIN ATOMIC
 SELECT ((($1).type || '_'::text) || 'creation'::text) AS event,
     TRIM(BOTH '"'::text FROM (to_json(($1)."time"))::text) AS "timestamp",
     ($1).user_id AS distinct_id,
     json_build_object('collectivite_id', (($1).collectivite_id)::text, 'niveau_acces', d.niveau_acces, '$set', json_build_object('email', p.email, 'name', ((p.prenom || ' '::text) || p.nom)), '$groups', json_build_object('collectivite', (($1).collectivite_id)::text)) AS properties
    FROM (public.private_utilisateur_droit d
      JOIN public.dcp p USING (user_id))
   WHERE ((($1).collectivite_id = d.collectivite_id) AND (($1).user_id = d.user_id));
END;

COMMENT ON FUNCTION posthog.event(posthog.creation) IS 'Événement de creation.';

CREATE VIEW posthog.latest_score_modification AS
 SELECT statut.collectivite_id,
    definition.referentiel,
    max(statut.modified_at) AS "time"
   FROM (public.action_statut statut
     JOIN public.action_definition definition USING (action_id))
  GROUP BY statut.collectivite_id, definition.referentiel;

COMMENT ON VIEW posthog.latest_score_modification IS 'Les dernières modification de scores.';

CREATE FUNCTION posthog.event(posthog.latest_score_modification) RETURNS TABLE(event text, "timestamp" text, distinct_id text, properties jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    BEGIN ATOMIC
 SELECT 'score_modification'::text AS event,
     TRIM(BOTH '"'::text FROM (to_json(($1)."time"))::text) AS "timestamp",
     statut.modified_by AS distinct_id,
     (jsonb_build_object('collectivite_id', (($1).collectivite_id)::text, 'niveau_acces', d.niveau_acces, '$set', jsonb_build_object('email', p.email, 'name', ((p.prenom || ' '::text) || p.nom)), '$groups', jsonb_build_object('collectivite', (($1).collectivite_id)::text), 'referentiel', ($1).referentiel, 'completude', score.completude) || score.obj) AS properties
    FROM ((((public.action_statut statut
      JOIN public.action_definition def USING (action_id))
      JOIN public.dcp p ON ((p.user_id = statut.modified_by)))
      JOIN public.private_utilisateur_droit d ON (((d.user_id = statut.modified_by) AND (d.collectivite_id = ($1).collectivite_id))))
      JOIN LATERAL ( SELECT action_score.obj,
             ((((action_score.obj -> 'completed_taches_count'::text))::double precision / ((action_score.obj -> 'total_taches_count'::text))::double precision) * (100)::double precision) AS completude
            FROM ( SELECT jsonb_array_elements(client_scores.scores) AS obj
                    FROM public.client_scores
                   WHERE ((client_scores.collectivite_id = ($1).collectivite_id) AND (client_scores.referentiel = ($1).referentiel))) action_score
           WHERE (action_score.obj @> jsonb_build_object('action_id', (($1).referentiel)::text))) score ON (true))
   WHERE ((($1).collectivite_id = statut.collectivite_id) AND (($1)."time" = statut.modified_at) AND (($1).referentiel = def.referentiel));
END;

COMMENT ON FUNCTION posthog.event(posthog.latest_score_modification) IS 'Crée un événement à partir d''une modification de score en utilisant la modification de statut correspondante.';

CREATE VIEW posthog.modification AS
 SELECT 'reponse'::text AS type,
    reponse_binaire.modified_at AS "time",
    reponse_binaire.modified_by AS user_id,
    reponse_binaire.collectivite_id
   FROM (historique.reponse_binaire
     JOIN stats.collectivite_active USING (collectivite_id))
  WHERE (reponse_binaire.modified_by IS NOT NULL)
UNION ALL
 SELECT 'reponse'::text AS type,
    reponse_choix.modified_at AS "time",
    reponse_choix.modified_by AS user_id,
    reponse_choix.collectivite_id
   FROM (historique.reponse_choix
     JOIN stats.collectivite_active USING (collectivite_id))
  WHERE (reponse_choix.modified_by IS NOT NULL)
UNION ALL
 SELECT 'reponse'::text AS type,
    reponse_proportion.modified_at AS "time",
    reponse_proportion.modified_by AS user_id,
    reponse_proportion.collectivite_id
   FROM (historique.reponse_proportion
     JOIN stats.collectivite_active USING (collectivite_id))
  WHERE (reponse_proportion.modified_by IS NOT NULL)
UNION ALL
 SELECT 'justification'::text AS type,
    justification.modified_at AS "time",
    justification.modified_by AS user_id,
    justification.collectivite_id
   FROM (historique.justification
     JOIN stats.collectivite_active USING (collectivite_id))
  WHERE (justification.modified_by IS NOT NULL);

COMMENT ON VIEW posthog.modification IS 'Les actions de modification destinées à être transformées en events.';

CREATE FUNCTION posthog.event(posthog.modification) RETURNS TABLE(event text, "timestamp" text, distinct_id text, properties jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    BEGIN ATOMIC
 SELECT ((($1).type || '_'::text) || 'modification'::text) AS event,
     TRIM(BOTH '"'::text FROM (to_json(($1)."time"))::text) AS "timestamp",
     ($1).user_id AS distinct_id,
     json_build_object('collectivite_id', (($1).collectivite_id)::text, 'niveau_acces', d.niveau_acces, '$set', json_build_object('email', p.email, 'name', ((p.prenom || ' '::text) || p.nom)), '$groups', json_build_object('collectivite', (($1).collectivite_id)::text)) AS properties
    FROM (public.private_utilisateur_droit d
      JOIN public.dcp p USING (user_id))
   WHERE ((($1).collectivite_id = d.collectivite_id) AND (($1).user_id = d.user_id));
END;

COMMENT ON FUNCTION posthog.event(posthog.modification) IS 'Événement de modification.';

CREATE FUNCTION posthog.event(public.collectivite) RETURNS TABLE(event text, distinct_id text, properties jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    AS $_$ -- `crm_usages` étant amené à changer on utilise une chaine de caractères
select '$groupidentify' as event,
       $1.id::text      as distinct_id,
       json_build_object(
               '$group_type', 'collectivite',
               '$group_key', $1.id::text,
               '$group_set', to_jsonb(sc) || to_jsonb(scu)
       )                as properties
from stats.collectivite sc
         join stats.crm_usages scu using (collectivite_id)
where $1.id = scu.collectivite_id;
$_$;

COMMENT ON FUNCTION posthog.event(public.collectivite) IS 'Un event de type $groupidentify pour mettre à jour les données sur PostHog.';

CREATE FUNCTION posthog.properties(public.dcp) RETURNS SETOF jsonb
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    BEGIN ATOMIC
 WITH f AS (
          SELECT array_agg(DISTINCT m.fonction) AS list
            FROM ((public.private_utilisateur_droit pud
              JOIN stats.collectivite_active ca USING (collectivite_id))
              JOIN public.private_collectivite_membre m USING (user_id, collectivite_id))
           WHERE (m.user_id = ($1).user_id)
         )
  SELECT json_build_object('email', ($1).email, 'name', ((($1).prenom || ' '::text) || ($1).nom), 'auditeur', (EXISTS ( SELECT a.auditeur
            FROM public.audit_auditeur a
           WHERE (a.auditeur = ($1).user_id))), 'fonction_referent', ('referent'::public.membre_fonction = ANY (f.list)), 'fonction_conseiller', ('conseiller'::public.membre_fonction = ANY (f.list)), 'fonction_technique', ('technique'::public.membre_fonction = ANY (f.list)), 'fonction_politique', ('politique'::public.membre_fonction = ANY (f.list)), 'fonction_partenaire', ('partenaire'::public.membre_fonction = ANY (f.list))) AS json_build_object
    FROM f;
END;

COMMENT ON FUNCTION posthog.properties(public.dcp) IS 'Les user properties pour PostHog.';

CREATE FUNCTION posthog.event(public.dcp) RETURNS TABLE(event text, "timestamp" text, distinct_id text, properties jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    BEGIN ATOMIC
 SELECT '$identify'::text AS event,
     TRIM(BOTH '"'::text FROM (to_json(($1).modified_at))::text) AS "timestamp",
     ($1).user_id AS distinct_id,
     json_build_object('$set', posthog.properties($1)) AS properties;
END;

COMMENT ON FUNCTION posthog.event(public.dcp) IS 'Un event de type identify pour mettre à jour les données sur PostHog.';

CREATE FUNCTION posthog.event(public.usage) RETURNS TABLE(event text, "timestamp" text, distinct_id text, properties jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    BEGIN ATOMIC
 SELECT ((($1).fonction || '_'::text) || ($1).action) AS event,
     TRIM(BOTH '"'::text FROM (to_json(($1)."time"))::text) AS "timestamp",
     ($1).user_id AS distinct_id,
     json_build_object('$current_url', (('app/'::text ||
         CASE
             WHEN (($1).collectivite_id IS NULL) THEN ''::text
             ELSE 'collectivite/'::text
         END) || ($1).page), 'page', ($1).page, 'collectivite_id', (($1).collectivite_id)::text, 'niveau_acces', ( SELECT pud.niveau_acces
            FROM public.private_utilisateur_droit pud
           WHERE ((pud.collectivite_id = ($1).collectivite_id) AND (pud.user_id = ($1).user_id))), '$set', posthog.properties(p.*), '$groups', json_build_object('collectivite', (($1).collectivite_id)::text)) AS properties
    FROM public.dcp p
   WHERE (p.user_id = ($1).user_id);
END;

CREATE FUNCTION posthog.event(public.visite) RETURNS TABLE(event text, "timestamp" text, distinct_id text, properties jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER ROWS 1
    BEGIN ATOMIC
 SELECT '$pageview'::text AS event,
     TRIM(BOTH '"'::text FROM (to_json(($1)."time"))::text) AS "timestamp",
     ($1).user_id AS distinct_id,
     json_build_object('$current_url', (('app/'::text ||
         CASE
             WHEN (($1).collectivite_id IS NULL) THEN ''::text
             ELSE 'collectivite/'::text
         END) || ($1).page), 'page', ($1).page, 'tag', ($1).tag, 'onglet', ($1).onglet, 'collectivite_id', (($1).collectivite_id)::text, 'niveau_acces', ( SELECT pud.niveau_acces
            FROM public.private_utilisateur_droit pud
           WHERE ((pud.collectivite_id = ($1).collectivite_id) AND (pud.user_id = ($1).user_id))), '$set', posthog.properties(p.*), '$groups', json_build_object('collectivite', (($1).collectivite_id)::text)) AS properties
    FROM public.dcp p
   WHERE (p.user_id = ($1).user_id);
END;

CREATE TABLE posthog.configuration (
    id integer NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL
);

COMMENT ON TABLE posthog.configuration IS 'La configuration de PostHog.';

CREATE FUNCTION posthog.send_events(events jsonb) RETURNS bigint
    LANGUAGE sql
    BEGIN ATOMIC
 SELECT net.http_post(url => conf.api_url, body => jsonb_build_object('api_key', conf.api_key, 'batch', send_events.events)) AS http_post
    FROM posthog.configuration conf
   ORDER BY conf.id DESC
  LIMIT 1;
END;

COMMENT ON FUNCTION posthog.send_events(events jsonb) IS 'Envoie un lot d''événements à PostHog.';

CREATE FUNCTION posthog.validate_event(jsonb) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $_$
begin
    if $1 ->> 'event' is null then
        raise 'Un événement doit avoir un type : %', $1::text;
    end if;
    if $1 ->> 'event' != '$groupidentify' then
        perform (select $1 ->> 'distinct_id')::uuid;
    end if;
    perform (select $1 ->> 'timestamp')::date;
    return true;
exception
    when invalid_text_representation then
        raise 'Un événement doit avoir un distinct_id valide : %', $1::text;
    when invalid_datetime_format then
        raise 'Un événement doit avoir un timestamp valide : %', $1::text;
end
$_$;

COMMENT ON FUNCTION posthog.validate_event(jsonb) IS 'Lève une erreur si l''événement n''est pas valide. On s''en sert pour tester en préprod.';

CREATE SEQUENCE posthog.configuration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE posthog.configuration_id_seq OWNED BY posthog.configuration.id;

ALTER TABLE ONLY posthog.configuration ALTER COLUMN id SET DEFAULT nextval('posthog.configuration_id_seq'::regclass);

ALTER TABLE ONLY posthog.configuration
    ADD CONSTRAINT configuration_pkey PRIMARY KEY (id);

COMMIT;
