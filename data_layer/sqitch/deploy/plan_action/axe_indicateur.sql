-- Deploy tet:plan_action/axe_indicateur to pg

BEGIN;

CREATE TABLE public.axe_indicateur (
	indicateur_id int4 NOT NULL,
	axe_id int4 NOT NULL,
	CONSTRAINT axe_indicateur_pkey PRIMARY KEY (indicateur_id, axe_id),
	CONSTRAINT axe_indicateur_axe_id_fkey FOREIGN KEY (axe_id) REFERENCES public.axe(id) ON DELETE CASCADE,
	CONSTRAINT axe_indicateur_indicateur_id_fkey FOREIGN KEY (indicateur_id) REFERENCES public.indicateur_definition(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.axe_indicateur IS 'Lien entre un indicateur et un axe d''un plan';

ALTER TABLE public.axe_indicateur OWNER TO postgres;
GRANT REFERENCES, SELECT, TRUNCATE, INSERT, DELETE, TRIGGER, UPDATE ON TABLE public.axe_indicateur TO postgres;
GRANT REFERENCES, SELECT, TRUNCATE, INSERT, DELETE, TRIGGER, UPDATE ON TABLE public.axe_indicateur TO service_role;

COMMIT;
