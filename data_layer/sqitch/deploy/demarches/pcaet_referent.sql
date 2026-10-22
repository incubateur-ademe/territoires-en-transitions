-- Deploy tet:demarches/pcaet_referent to pg
-- requires: collectivite/service_etat_import

BEGIN;

CREATE TABLE public.demarche_pcaet_referent (
    id                        integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    organisme_collectivite_id integer     NOT NULL REFERENCES public.collectivite(id) ON DELETE CASCADE,
    user_id                   uuid        NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    libelle                   text        NULL,
    email                     text        NULL,
    created_at                timestamptz NOT NULL DEFAULT now(),
    created_by                uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT demarche_pcaet_referent_membre_ou_contact CHECK (
        (user_id IS NOT NULL AND libelle IS NULL AND email IS NULL)
        OR (user_id IS NULL AND libelle IS NOT NULL AND email IS NOT NULL)
    )
);

CREATE UNIQUE INDEX demarche_pcaet_referent_unique_membre
    ON public.demarche_pcaet_referent (organisme_collectivite_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX demarche_pcaet_referent_unique_contact
    ON public.demarche_pcaet_referent (organisme_collectivite_id, lower(email))
    WHERE email IS NOT NULL;

COMMENT ON TABLE public.demarche_pcaet_referent IS 'Référents PCAET désignés par la DGEC pour une DREAL, un conseil régional ou une DDT : les contacts que voit la collectivité déposante. Une ligne = un membre de l''organisme (user_id) ou un contact hors plateforme (libelle + email).';
COMMENT ON COLUMN public.demarche_pcaet_referent.user_id IS 'Membre de l''organisme ; il n''est affiché que tant que son accès à l''organisme reste actif.';

ALTER TABLE public.demarche_pcaet_referent ENABLE ROW LEVEL SECURITY;

COMMIT;
