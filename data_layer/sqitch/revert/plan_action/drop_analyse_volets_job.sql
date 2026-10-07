-- Revert tet:plan_action/drop_analyse_volets_job from pg

BEGIN;

create table public.analyse_volets_job
(
    id                uuid                     not null default gen_random_uuid()
        constraint analyse_volets_job_pkey primary key,
    collectivite_id   integer                  not null
        constraint analyse_volets_job_collectivite_id_fkey references public.collectivite (id) on delete cascade,
    created_by        uuid                     not null
        constraint analyse_volets_job_created_by_fkey references auth.users (id) on delete cascade,
    status            text                     not null
        constraint analyse_volets_job_status_check check (status = any (array ['pending', 'running', 'done', 'failed'])),
    processed_batches integer                  not null default 0,
    total_batches     integer                  not null default 0,
    report            jsonb,
    token_usage       jsonb,
    error             text,
    created_at        timestamp with time zone not null default now(),
    modified_at       timestamp with time zone not null default now(),
    enjeu             public.enjeu             not null,
    etape             text                     not null
        constraint analyse_volets_job_etape_check check (etape = any (array ['classification', 'mobilisation']))
);

alter table public.analyse_volets_job enable row level security;

create unique index analyse_volets_job_in_flight_unique
    on public.analyse_volets_job (collectivite_id, enjeu)
    where status = any (array ['pending', 'running']);

create index analyse_volets_job_derniere_analyse
    on public.analyse_volets_job (collectivite_id, enjeu, created_at desc, id desc);

comment on table public.analyse_volets_job is 'Job asynchrone d''analyse IA des fiches d''une collectivite par volet : classification puis mobilisation.';
comment on column public.analyse_volets_job.created_by is 'Utilisateur ayant lance la classification.';
comment on column public.analyse_volets_job.status is 'pending | running | done | failed.';
comment on column public.analyse_volets_job.processed_batches is 'Nombre de lots termines, reussis ou non ; sert la progression.';
comment on column public.analyse_volets_job.total_batches is 'Nombre de lots a traiter, connu une fois les fiches lues.';
comment on column public.analyse_volets_job.report is 'Compte rendu de la classification (ClassificationReport) : par fiche, la justification du modele et les volets retenus, fiches sans levier comprises. Ecrit dans la meme transaction que les volets, jamais soumis a validation ; NULL tant que le job n''est pas done.';
comment on column public.analyse_volets_job.token_usage is 'Jetons consommes, cumules sur tous les lots.';
comment on column public.analyse_volets_job.error is 'Renseigne quand status = failed.';
comment on column public.analyse_volets_job.enjeu is 'Sans defaut : chaque enfilement nomme son enjeu. Le NOT NULL porte aussi l''unicite, un NULL n''entrant dans aucun conflit d''index.';
comment on column public.analyse_volets_job.etape is 'Etape de l''analyse. Hors de la cle d''unicite in-flight : la mobilisation consomme la sortie de la classification, les deux ne peuvent pas tourner ensemble sur une meme collectivite.';
comment on index public.analyse_volets_job_derniere_analyse is 'Sert la lecture de la derniere analyse d''une collectivite, interrogee en boucle pendant qu''un job tourne. L''index unique in-flight ne couvre que les jobs en vol, la cle primaire ne connait pas la collectivite.';

COMMIT;
