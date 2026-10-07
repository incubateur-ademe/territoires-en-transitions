-- Revert tet:stats/drop_amplitude from pg

BEGIN;

-- Définitions reprises de la base avant suppression. La ligne de
-- stats.amplitude_configuration (url et clé d'API) n'est pas restaurée.
-- Le cron amplitude_send_yesterday_events, créé par la première version de
-- cron/send_to_amplitude, avait une commande sans select qui échouait à chaque
-- exécution : il est recréé ici avec une commande valide.
set local check_function_bodies = off;

CREATE TYPE stats.amplitude_content_event AS (
	"time" timestamp with time zone,
	user_id uuid,
	collectivite_id integer
);

COMMENT ON TYPE stats.amplitude_content_event IS 'Un événement qui concerne un utilisateur sur un contenu.';

CREATE TYPE stats.amplitude_crud_type AS ENUM (
    'created',
    'updated'
);

COMMENT ON TYPE stats.amplitude_crud_type IS 'Le type d''événement crud remonté à Amplitude.';

CREATE TYPE stats.amplitude_event AS (
	user_id text,
	event_type text,
	"time" integer,
	insert_id text,
	event_properties jsonb,
	user_properties jsonb,
	app_version text,
	groups jsonb
);

COMMENT ON TYPE stats.amplitude_event IS 'Un `event` à envoyer en batch.';

CREATE FUNCTION stats.amplitude_build_crud_events(events stats.amplitude_content_event[], name text, type stats.amplitude_crud_type) RETURNS SETOF stats.amplitude_event
    LANGUAGE sql
    BEGIN ATOMIC
 WITH auditeurs AS (
          SELECT aa.auditeur AS user_id
            FROM public.audit_auditeur aa
         )
  SELECT (e.ev).user_id AS user_id,
     ((amplitude_build_crud_events.name || '_'::text) || amplitude_build_crud_events.type) AS event_type,
     (EXTRACT(epoch FROM (e.ev)."time"))::integer AS "time",
     md5(((amplitude_build_crud_events.name || amplitude_build_crud_events.type) || (e.ev).user_id)) AS insert_id,
     NULL::jsonb AS event_properties,
     jsonb_build_object('fonctions', ( SELECT array_agg(DISTINCT m.fonction) AS array_agg
            FROM (public.private_collectivite_membre m
              JOIN public.private_utilisateur_droit pud ON (((m.user_id = pud.user_id) AND (m.collectivite_id = pud.collectivite_id))))
           WHERE ((m.user_id = (e.ev).user_id) AND (m.fonction IS NOT NULL) AND pud.active)), 'auditeur', ((e.ev).user_id IN ( SELECT auditeurs.user_id
            FROM auditeurs))) AS user_properties,
     ( SELECT v.name
            FROM stats.release_version v
           WHERE (v."time" < (e.ev)."time")
           ORDER BY v."time" DESC
          LIMIT 1) AS app_version,
     jsonb_build_object('collectivite_id', (e.ev).collectivite_id, 'collectivite_nom', ( SELECT nc.nom
            FROM public.named_collectivite nc
           WHERE (nc.collectivite_id = (e.ev).collectivite_id))) AS groups
    FROM ( SELECT unnest(amplitude_build_crud_events.events) AS ev) e
   WHERE (((e.ev).user_id IS NOT NULL) AND ((e.ev)."time" IS NOT NULL));
END;

COMMENT ON FUNCTION stats.amplitude_build_crud_events(events stats.amplitude_content_event[], name text, type stats.amplitude_crud_type) IS 'Construit des `events` crud Amplitude à partir d''événements de contenus.';

CREATE FUNCTION stats.amplitude_build_crud_events(events stats.amplitude_content_event[], name text, type stats.amplitude_crud_type, question_id public.question_id) RETURNS SETOF stats.amplitude_event
    LANGUAGE sql
    BEGIN ATOMIC
 WITH auditeurs AS (
          SELECT aa.auditeur AS user_id
            FROM public.audit_auditeur aa
         )
  SELECT (e.ev).user_id AS user_id,
     ((amplitude_build_crud_events.name || '_'::text) || amplitude_build_crud_events.type) AS event_type,
     (EXTRACT(epoch FROM (e.ev)."time"))::integer AS "time",
     md5(((amplitude_build_crud_events.name || amplitude_build_crud_events.type) || (e.ev).user_id)) AS insert_id,
     jsonb_build_object('question_id', amplitude_build_crud_events.question_id) AS event_properties,
     jsonb_build_object('fonctions', ( SELECT array_agg(DISTINCT m.fonction) AS array_agg
            FROM (public.private_collectivite_membre m
              JOIN public.private_utilisateur_droit pud ON (((m.user_id = pud.user_id) AND (m.collectivite_id = pud.collectivite_id))))
           WHERE ((m.user_id = (e.ev).user_id) AND (m.fonction IS NOT NULL) AND pud.active)), 'auditeur', ((e.ev).user_id IN ( SELECT auditeurs.user_id
            FROM auditeurs))) AS user_properties,
     ( SELECT v.name
            FROM stats.release_version v
           WHERE (v."time" < (e.ev)."time")
           ORDER BY v."time" DESC
          LIMIT 1) AS app_version,
     jsonb_build_object('collectivite_id', (e.ev).collectivite_id, 'collectivite_nom', ( SELECT nc.nom
            FROM public.named_collectivite nc
           WHERE (nc.collectivite_id = (e.ev).collectivite_id))) AS groups
    FROM ( SELECT unnest(amplitude_build_crud_events.events) AS ev) e
   WHERE (((e.ev).user_id IS NOT NULL) AND ((e.ev)."time" IS NOT NULL));
END;

COMMENT ON FUNCTION stats.amplitude_build_crud_events(events stats.amplitude_content_event[], name text, type stats.amplitude_crud_type, question_id public.question_id) IS 'Construit des `events` crud Amplitude à partir d''événements de contenus liés à des questions.';

CREATE FUNCTION stats.amplitude_registered(range tstzrange) RETURNS SETOF stats.amplitude_event
    LANGUAGE sql
    BEGIN ATOMIC
 WITH auditeurs AS (
          SELECT aa.auditeur AS user_id
            FROM public.audit_auditeur aa
         )
  SELECT p.user_id,
     'registered'::text AS event_type,
     (EXTRACT(epoch FROM p.created_at))::integer AS "time",
     md5(('registered'::text || p.user_id)) AS insert_id,
     jsonb_build_object('telephone', ((p.telephone IS NOT NULL) AND ((p.telephone)::text <> ''::text))) AS event_properties,
     jsonb_build_object('fonctions', ( SELECT array_agg(DISTINCT m.fonction) AS array_agg
            FROM (public.private_collectivite_membre m
              JOIN public.private_utilisateur_droit pud ON (((m.user_id = pud.user_id) AND (m.collectivite_id = pud.collectivite_id))))
           WHERE ((m.user_id = p.user_id) AND (m.fonction IS NOT NULL) AND pud.active)), 'auditeur', (p.user_id IN ( SELECT auditeurs.user_id
            FROM auditeurs))) AS user_properties,
     ( SELECT release_version.name
            FROM stats.release_version
           WHERE (release_version."time" < p.created_at)
           ORDER BY release_version."time" DESC
          LIMIT 1) AS app_version,
     NULL::jsonb AS groups
    FROM public.dcp p
   WHERE (amplitude_registered.range @> p.created_at);
END;

COMMENT ON FUNCTION stats.amplitude_registered(range tstzrange) IS 'Les `events` registered Amplitude construits à partir de la création des DCPs.';

CREATE FUNCTION stats.amplitude_send_events(amplitude_events stats.amplitude_event[], range tstzrange, batch_size integer DEFAULT 1000) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'net'
    AS $$
declare
    batches  jsonb[];
    batch    jsonb;
    response bigint;
    i        integer := 1;
begin
    -- on commence par grouper les événements par lot de `batch_size` dans `batches`
    with events as (select jsonb_agg(json_array) as batch
                    from (select to_jsonb(av.*)                                                        as json_array,
                                 -- en divisant le numéro de la ligne obtenu avec `rank`
                                 -- par la taille du batch, on obtient le nombre `g`
                                 (rank() over (order by time) / amplitude_send_events.batch_size)::int as g
                          from (select * from unnest(amplitude_events)) av) numbered
                    group by g)
    select array_agg(events.batch)
    into batches
    from events;

    if batches is null
    then
        return;
    end if;

    -- puis on itère sur les lots :
    foreach batch in array batches
        loop
        -- on lance une requête asynchrone avec pg_net
        -- et on récupère son id dans `response`
            select net.http_post(
                           url := ac.api_url,
                           body := jsonb_build_object(
                                   'api_key', ac.api_key,
                                   'events', batch
                               )
                       )
            from stats.amplitude_configuration ac
            order by id desc
            limit 1
            into response;

            -- on enregistre l'id et les paramètres pour diagnostiquer par la suite d'éventuelles erreurs.
            insert into stats.amplitude_log (response, range, batch_size, batch_index)
            values (response, range, batch_size, i);

            -- on incrémente le lot
            i := i + 1;
        end loop;
end;
$$;

CREATE FUNCTION stats.amplitude_send_yesterday_creations() RETURNS void
    LANGUAGE plpgsql
    AS $$
declare
    yesterday tstzrange;
begin
    yesterday = tstzrange(current_timestamp::date - interval '1 day', current_timestamp::date);

    perform (with -- transforme les fiches de la veille en content events.
                  ce as (select (created_at, modified_by, collectivite_id)::stats.amplitude_content_event as events
                         from fiche_action
                         where yesterday @> created_at
                           and modified_by is not null),
                  -- transforme les content events en crud events,
                  crud as (select stats.amplitude_build_crud_events(array_agg(ce.events), 'fiche', 'created') as events
                           from ce)
             -- envoie les crud event et spécifie le range pour le log.
             select stats.amplitude_send_events(array_agg(crud.events), yesterday)
             from crud);

    perform (with -- transforme les plans de la veille en content events.
                  ce as (select (created_at, modified_by, collectivite_id)::stats.amplitude_content_event as events
                         from axe
                         where yesterday @> created_at
                           and modified_by is not null
                           and parent is null),
                  -- transforme les content events en crud events,
                  crud as (select stats.amplitude_build_crud_events(array_agg(ce.events), 'plan', 'created') as events
                           from ce)
             -- envoie les crud event et spécifie le range pour le log.
             select stats.amplitude_send_events(array_agg(crud.events), yesterday)
             from crud);

    perform (with -- transforme les réponses de la veille en content events.
                  ce as (select (modified_at, modified_by, collectivite_id)::stats.amplitude_content_event as event,
                                r.question_id
                         from historique.reponse_binaire r
                         where yesterday @> modified_at
                           and modified_by is not null
                         union all
                         select (modified_at, modified_by, collectivite_id)::stats.amplitude_content_event as event,
                                r.question_id
                         from historique.reponse_choix r
                         where yesterday @> modified_at
                           and modified_by is not null
                         union all
                         select (modified_at, modified_by, collectivite_id)::stats.amplitude_content_event as event,
                                r.question_id
                         from historique.reponse_proportion r
                         where yesterday @> modified_at
                           and modified_by is not null),
                  -- transforme les content events en crud events,
                  crud as (select stats.amplitude_build_crud_events(
                                          array_agg(ce.event),
                                          'reponse',
                                          'created',
                                          question_id := ce.question_id) as events
                           from ce
                           group by ce.question_id)
             -- envoie les crud event et spécifie le range pour le log.
             select stats.amplitude_send_events(array_agg(crud.events), yesterday)
             from crud);

    perform (with -- transforme les justifications de la veille en content events.
                  ce as (select (modified_at, modified_by, collectivite_id)::stats.amplitude_content_event as event,
                                j.question_id
                         from historique.justification j
                         where yesterday @> modified_at
                           and modified_by is not null),
                  -- transforme les content events en crud events,
                  crud as (select stats.amplitude_build_crud_events(
                                          array_agg(ce.event),
                                          'justification',
                                          'created',
                                          question_id := ce.question_id) as events
                           from ce
                           group by ce.question_id)
             -- envoie les crud event et spécifie le range pour le log.
             select stats.amplitude_send_events(array_agg(crud.events), yesterday)
             from crud);
end;
$$;

COMMENT ON FUNCTION stats.amplitude_send_yesterday_creations() IS 'Envoi les événements de creation de contenus de la veille à Amplitude.';

CREATE FUNCTION stats.amplitude_send_yesterday_events() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
    yesterday tstzrange;
begin
    yesterday = tstzrange(current_timestamp::date - interval '1 day', current_timestamp::date);

    perform stats.amplitude_send_events(array_agg(e), yesterday)
    from stats.amplitude_visite(yesterday) e;

    perform stats.amplitude_send_events(array_agg(e), yesterday)
    from stats.amplitude_registered(yesterday) e;
end;
$$;

COMMENT ON FUNCTION stats.amplitude_send_yesterday_events() IS 'Envoi les événements de visite et de creation de compte de la veille à Amplitude.';

CREATE FUNCTION stats.amplitude_visite(range tstzrange) RETURNS SETOF stats.amplitude_event
    LANGUAGE sql
    BEGIN ATOMIC
 WITH auditeurs AS (
          SELECT aa.auditeur AS user_id
            FROM public.audit_auditeur aa
         )
  SELECT v.user_id,
     (v.page || '_viewed'::text) AS event_type,
     (EXTRACT(epoch FROM v."time"))::integer AS "time",
     md5(((('visite'::text || v.page) || (v.user_id)::text) || (v."time")::text)) AS insert_id,
     jsonb_build_object('page', v.page, 'tag', v.tag, 'onglet', v.onglet, 'collectivite_id', v.collectivite_id, 'niveau_acces', pud.niveau_acces, 'fonction', pcm.fonction, 'champ_intervention', pcm.champ_intervention, 'collectivite', to_json(c.*)) AS event_properties,
     jsonb_build_object('fonctions', ( SELECT array_agg(DISTINCT m.fonction) AS array_agg
            FROM (public.private_collectivite_membre m
              JOIN public.private_utilisateur_droit pud_1 ON (((m.user_id = pud_1.user_id) AND (m.collectivite_id = pud_1.collectivite_id))))
           WHERE ((m.user_id = v.user_id) AND (m.fonction IS NOT NULL) AND pud_1.active)), 'auditeur', (v.user_id IN ( SELECT auditeurs.user_id
            FROM auditeurs))) AS user_properties,
     ( SELECT release_version.name
            FROM stats.release_version
           WHERE (release_version."time" < v."time")
           ORDER BY release_version."time" DESC
          LIMIT 1) AS app_version,
     jsonb_build_object('collectivite_id', v.collectivite_id, 'collectivite_nom', ( SELECT nc.nom
            FROM public.named_collectivite nc
           WHERE (nc.collectivite_id = v.collectivite_id))) AS groups
    FROM (((public.visite v
      LEFT JOIN public.private_utilisateur_droit pud ON (((v.user_id = pud.user_id) AND (v.collectivite_id = pud.collectivite_id))))
      LEFT JOIN public.private_collectivite_membre pcm ON (((v.collectivite_id = pcm.collectivite_id) AND (v.user_id = pcm.user_id))))
      LEFT JOIN stats.collectivite c ON ((v.collectivite_id = c.collectivite_id)))
   WHERE (amplitude_visite.range @> v."time");
END;

COMMENT ON FUNCTION stats.amplitude_visite(range tstzrange) IS 'Les `events` Amplitude construits à partir des visites.';

CREATE TABLE stats.amplitude_configuration (
    id integer NOT NULL,
    api_url text NOT NULL,
    api_key text NOT NULL
);

COMMENT ON TABLE stats.amplitude_configuration IS 'La configuration du service Amplitude pour envoyer les `events` par batch. `https://www.docs.developers.amplitude.com/analytics/apis/batch-event-upload-api/`';

CREATE SEQUENCE stats.amplitude_configuration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE stats.amplitude_configuration_id_seq OWNED BY stats.amplitude_configuration.id;

CREATE TABLE stats.amplitude_log (
    response bigint,
    range tstzrange,
    batch_size integer,
    batch_index integer
);

COMMENT ON TABLE stats.amplitude_log IS 'Permet de diagnostiquer et reconstituer les appels à Amplitude.';

ALTER TABLE ONLY stats.amplitude_configuration ALTER COLUMN id SET DEFAULT nextval('stats.amplitude_configuration_id_seq'::regclass);

ALTER TABLE ONLY stats.amplitude_configuration
    ADD CONSTRAINT amplitude_configuration_pkey PRIMARY KEY (id);

select cron.schedule('amplitude_send_yesterday_events',
                     '0 3 * * *',
                     $$select stats.amplitude_send_yesterday_events();$$);

select cron.schedule('amplitude_send_yesterday_creations',
                     '1 3 * * *',
                     $$select stats.amplitude_send_yesterday_creations();$$);

COMMIT;
