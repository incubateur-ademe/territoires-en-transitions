-- Revert tet:evaluation/drop-question-thematique-completude from pg

BEGIN;

-- private.reponse_count_by_thematique source
CREATE OR REPLACE FUNCTION private.reponse_count_by_thematique(collectivite_id integer, thematique_id character varying)
 RETURNS integer
 LANGUAGE sql
 STABLE
BEGIN ATOMIC
 SELECT ((count(rb.*) + count(rp.*)) + count(rc.*)) AS count
    FROM (((question q
      LEFT JOIN reponse_binaire rb ON ((((rb.question_id)::text = (q.id)::text) AND (rb.collectivite_id = reponse_count_by_thematique.collectivite_id) AND (rb.reponse IS NOT NULL))))
      LEFT JOIN reponse_proportion rp ON ((((rp.question_id)::text = (q.id)::text) AND (rp.collectivite_id = reponse_count_by_thematique.collectivite_id) AND (rp.reponse IS NOT NULL))))
      LEFT JOIN reponse_choix rc ON ((((rc.question_id)::text = (q.id)::text) AND (rc.collectivite_id = reponse_count_by_thematique.collectivite_id) AND (rc.reponse IS NOT NULL))))
   WHERE ((q.thematique_id)::text = (reponse_count_by_thematique.thematique_id)::text);
END
;
COMMENT ON FUNCTION private.reponse_count_by_thematique(int4, varchar) IS 'Le nombre de réponses d''une collectivités sur une question.';
ALTER FUNCTION private.reponse_count_by_thematique(int4, varchar) OWNER TO postgres;
GRANT ALL ON FUNCTION private.reponse_count_by_thematique(int4, varchar) TO postgres;

-- private.question_count_for_thematique source
CREATE OR REPLACE FUNCTION private.question_count_for_thematique(collectivite_id integer, thematique_id character varying)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
select count(*)
from collectivite c
         join question q on q.types_collectivites_concernees @> private.collectivite_type(c.id) or
                            types_collectivites_concernees is null
         join question_thematique qt on q.thematique_id = qt.id
where c.id = question_count_for_thematique.collectivite_id
  and qt.id = question_count_for_thematique.thematique_id
$function$
;
COMMENT ON FUNCTION private.question_count_for_thematique(int4, varchar) IS 'Le nombre de questions applicables pour une collectivité sur une thématique.';
ALTER FUNCTION private.question_count_for_thematique(int4, varchar) OWNER TO postgres;
GRANT ALL ON FUNCTION private.question_count_for_thematique(int4, varchar) TO postgres;

-- public.question_thematique_display source
CREATE OR REPLACE VIEW public.question_thematique_display
AS WITH qt AS (
         SELECT qa.action_id,
            q.thematique_id
           FROM question_action qa
             JOIN question q ON qa.question_id::text = q.id::text
        ), qr AS (
         SELECT qt.thematique_id,
            array_agg(DISTINCT r.referentiel) AS referentiels
           FROM qt
             JOIN action_relation r ON r.id::text = qt.action_id::text
          GROUP BY qt.thematique_id
        )
 SELECT t.id,
    t.nom,
    qr.referentiels
   FROM question_thematique t
     LEFT JOIN qr ON qr.thematique_id::text = t.id::text
  WHERE is_authenticated();
ALTER TABLE public.question_thematique_display OWNER TO postgres;
GRANT ALL ON TABLE public.question_thematique_display TO postgres;
GRANT ALL ON TABLE public.question_thematique_display TO anon;
GRANT ALL ON TABLE public.question_thematique_display TO authenticated;
GRANT ALL ON TABLE public.question_thematique_display TO service_role;

-- public.question_thematique_completude source
CREATE OR REPLACE VIEW public.question_thematique_completude
AS SELECT c.id AS collectivite_id,
    qtd.id,
    qtd.nom,
    qtd.referentiels,
        CASE
            WHEN private.reponse_count_by_thematique(c.id, qt.id) >= private.question_count_for_thematique(c.id, qt.id) THEN 'complete'::thematique_completude
            ELSE 'a_completer'::thematique_completude
        END AS completude
   FROM collectivite c
     LEFT JOIN question_thematique qt ON true
     LEFT JOIN question_thematique_display qtd ON qtd.id::text = qt.id::text
  WHERE qtd.referentiels IS NOT NULL AND (est_verifie() OR have_lecture_acces(c.id))
  ORDER BY (
        CASE
            WHEN qtd.id::text = 'identite'::text THEN '0'::text
            ELSE qtd.nom
        END);
ALTER TABLE public.question_thematique_completude OWNER TO postgres;
GRANT ALL ON TABLE public.question_thematique_completude TO postgres;
GRANT ALL ON TABLE public.question_thematique_completude TO anon;
GRANT ALL ON TABLE public.question_thematique_completude TO authenticated;
GRANT ALL ON TABLE public.question_thematique_completude TO service_role;

-- public.question_display source
CREATE OR REPLACE VIEW public.question_display
AS WITH actions AS (
         SELECT question_action.question_id,
            array_agg(question_action.action_id) AS action_ids
           FROM question_action
          GROUP BY question_action.question_id
        ), q AS (
         SELECT q_1.id,
            a.action_ids,
            q_1.thematique_id,
            q_1.type,
            t.nom AS thematique_nom,
            q_1.description,
            q_1.types_collectivites_concernees,
            q_1.formulation,
            q_1.ordonnancement,
            cx.json AS choix
           FROM question q_1
             JOIN question_thematique t ON t.id::text = q_1.thematique_id::text
             JOIN actions a ON q_1.id::text = a.question_id::text
             LEFT JOIN LATERAL ( SELECT array_agg(json_build_object('id', c.id, 'label', c.formulation, 'ordonnancement', c.ordonnancement)) AS json
                   FROM question_choix c
                  WHERE c.question_id::text = q_1.id::text) cx ON true
        )
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
     JOIN collectivite_identite i ON q.types_collectivites_concernees && i.type OR q.types_collectivites_concernees IS NULL
  WHERE is_authenticated();
COMMENT ON VIEW public.question_display IS 'Questions avec leurs choix par collectivité pour l''affichage dans le client';
ALTER TABLE public.question_display OWNER TO postgres;
GRANT ALL ON TABLE public.question_display TO postgres;
GRANT ALL ON TABLE public.question_display TO anon;
GRANT ALL ON TABLE public.question_display TO authenticated;
GRANT ALL ON TABLE public.question_display TO service_role;

-- public.reponse_display source
CREATE OR REPLACE VIEW public.reponse_display
AS SELECT r.collectivite_id,
    q.id AS question_id,
    json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse', r.reponse) AS reponse,
    ( SELECT j.texte
           FROM justification j
          WHERE j.collectivite_id = r.collectivite_id AND j.question_id::text = r.question_id::text) AS justification
   FROM reponse_binaire r
     JOIN question q ON r.question_id::text = q.id::text
  WHERE est_verifie() OR have_lecture_acces(r.collectivite_id)
UNION ALL
 SELECT r.collectivite_id,
    q.id AS question_id,
    json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse', r.reponse) AS reponse,
    ( SELECT j.texte
           FROM justification j
          WHERE j.collectivite_id = r.collectivite_id AND j.question_id::text = r.question_id::text) AS justification
   FROM reponse_proportion r
     JOIN question q ON r.question_id::text = q.id::text
  WHERE est_verifie() OR have_lecture_acces(r.collectivite_id)
UNION ALL
 SELECT r.collectivite_id,
    q.id AS question_id,
    json_build_object('question_id', q.id, 'collectivite_id', r.collectivite_id, 'type', q.type, 'reponse', r.reponse) AS reponse,
    ( SELECT j.texte
           FROM justification j
          WHERE j.collectivite_id = r.collectivite_id AND j.question_id::text = r.question_id::text) AS justification
   FROM reponse_choix r
     JOIN question q ON r.question_id::text = q.id::text
  WHERE est_verifie() OR have_lecture_acces(r.collectivite_id);
ALTER TABLE public.reponse_display OWNER TO postgres;
GRANT ALL ON TABLE public.reponse_display TO postgres;
GRANT ALL ON TABLE public.reponse_display TO anon;
GRANT ALL ON TABLE public.reponse_display TO authenticated;
GRANT ALL ON TABLE public.reponse_display TO service_role;

-- public.after_reponse_insert_write_event source
CREATE OR REPLACE FUNCTION public.after_reponse_insert_write_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    insert into reponse_update_event (collectivite_id) values (new.collectivite_id);
    return null;
end;
$function$
;
COMMENT ON FUNCTION public.after_reponse_insert_write_event() IS 'Écrit un évènement après chaque écriture de réponse par un utilisateur.';
ALTER FUNCTION public.after_reponse_insert_write_event() OWNER TO postgres;
GRANT ALL ON FUNCTION public.after_reponse_insert_write_event() TO public;
GRANT ALL ON FUNCTION public.after_reponse_insert_write_event() TO postgres;
GRANT ALL ON FUNCTION public.after_reponse_insert_write_event() TO anon;
GRANT ALL ON FUNCTION public.after_reponse_insert_write_event() TO authenticated;
GRANT ALL ON FUNCTION public.after_reponse_insert_write_event() TO service_role;

-- public.after_reponse_call_business source
CREATE OR REPLACE FUNCTION public.after_reponse_call_business()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
begin
    perform evaluation.evaluate_regles(
            new.collectivite_id,
            'personnalisation_consequence',
            'client_scores'
        );
    return new;
exception -- si l'appel lève une erreur on continue.
    when others then return new;
end
$function$
;
ALTER FUNCTION public.after_reponse_call_business() OWNER TO postgres;
GRANT ALL ON FUNCTION public.after_reponse_call_business() TO public;
GRANT ALL ON FUNCTION public.after_reponse_call_business() TO postgres;
GRANT ALL ON FUNCTION public.after_reponse_call_business() TO anon;
GRANT ALL ON FUNCTION public.after_reponse_call_business() TO authenticated;
GRANT ALL ON FUNCTION public.after_reponse_call_business() TO service_role;

-- triggers after_reponse_insert source
create trigger after_reponse_insert after
insert
    or
update
    on
    public.reponse_binaire for each row execute function after_reponse_call_business();
create trigger after_reponse_insert after
insert
    or
update
    on
    public.reponse_choix for each row execute function after_reponse_call_business();
create trigger after_reponse_insert after
insert
    or
update
    on
    public.reponse_proportion for each row execute function after_reponse_call_business();

COMMIT;
