create schema if not exists labellisation;
comment on schema labellisation is
    'Regroupe les éléments hors API qui permettent de déterminer la possibilité d''accéder à une demande d''audit.';
grant usage on schema labellisation to postgres, anon, authenticated, service_role;


create type labellisation.etoile as enum ('1', '2', '3', '4', '5');
create table labellisation.etoile_meta
(
    etoile                 labellisation.etoile primary key,
    prochaine_etoile       labellisation.etoile,
    long_label             varchar(30) not null,
    short_label            varchar(15) not null,
    min_realise_percentage integer     not null,
    min_realise_score      double precision generated always as ( min_realise_percentage * 0.01) stored
);
comment on table labellisation.etoile_meta is
    'Les données relatives aux étoiles.';


create table if not exists labellisation_action_critere
(
    etoile                   labellisation.etoile                 not null,
    prio                     integer                              not null,
    referentiel              referentiel                          not null,
    action_id                action_id references action_relation not null,
    formulation              text                                 not null,
    min_realise_percentage   integer,
    min_programme_percentage integer,

    min_realise_score        double precision generated always as ( min_realise_percentage * 0.01) stored,
    min_programme_score      double precision generated always as ( min_programme_percentage * 0.01 ) stored,

    primary key (referentiel, etoile, prio)
);
comment on table labellisation_action_critere is
    'Les critères administrables à remplir pour accéder à une demande de labellisation';


alter table labellisation_action_critere
    enable row level security;

create policy critere_read_for_all
    on labellisation_action_critere
    for select
    using (true);

create table if not exists labellisation_fichier_critere
(
    referentiel referentiel          not null,
    etoile      labellisation.etoile not null,
    description text                 not null,
    primary key (referentiel, etoile)
);
comment on table labellisation_fichier_critere is
    'La description du champ fichier pour chaque palier.';


alter table labellisation_fichier_critere
    enable row level security;

create policy critere_fichier_read_for_all
    on labellisation_fichier_critere
    for select
    using (true);


create table if not exists labellisation_calendrier
(
    referentiel referentiel primary key,
    information text not null
);
comment on table labellisation_calendrier is
    'La description du champ calendrier pour chaque palier.';


alter table labellisation_calendrier
    enable row level security;

create policy critere_fichier_read_for_all
    on labellisation_calendrier
    for select
    using (true);


create table private.action_score
(
    referentiel                    referentiel not null,
    action_id                      action_id   not null,
    concerne                       boolean     not null default true,
    desactive                      boolean     not null default false,
    point_fait                     float       not null default .0,
    point_pas_fait                 float       not null default .0,
    point_potentiel                float       not null default .0,
    point_programme                float       not null default .0,
    point_referentiel              float       not null default .0,
    total_taches_count             float       not null default .0,
    point_non_renseigne            float       not null default .0,
    point_potentiel_perso          float                default .0,
    completed_taches_count         float       not null default .0,
    fait_taches_avancement         float       not null default .0,
    pas_fait_taches_avancement     float       not null default .0,
    programme_taches_avancement    float       not null default .0,
    pas_concerne_taches_avancement float       not null default .0
);
comment on table private.action_score is
    'A score related to an action. Used for typing, not storing actual data.';

create or replace function
    private.convert_client_scores(scores jsonb)
    returns setof private.action_score
as
$$
select (score ->> 'referentiel')::referentiel,
       (score ->> 'action_id')::action_id,
       (score ->> 'concerne')::boolean,
       (score ->> 'desactive')::boolean,
       (score ->> 'point_fait')::float,
       (score ->> 'point_pas_fait')::float,
       (score ->> 'point_potentiel')::float,
       (score ->> 'point_programme')::float,
       (score ->> 'point_referentiel')::float,
       (score ->> 'total_taches_count')::integer,
       (score ->> 'point_non_renseigne')::float,
       (score ->> 'point_potentiel_perso')::float,
       (score ->> 'completed_taches_count')::integer,
       (score ->> 'fait_taches_avancement')::float,
       (score ->> 'pas_fait_taches_avancement')::float,
       (score ->> 'programme_taches_avancement')::float,
       (score ->> 'pas_concerne_taches_avancement')::float
from jsonb_array_elements(scores) as score
$$ language sql;
comment on function private.convert_client_scores is
    'Convert json data from business to typed scores.';

create or replace function
    private.score_summary_of(score private.action_score)
    returns table
            (
                referentiel          referentiel,
                action_id            action_id,
                proportion_fait      float,
                proportion_programme float,
                completude           float,
                complete             boolean,
                concerne             boolean,
                desactive               boolean
            )
as
$$
select score.referentiel,
       score.action_id,
       case
           when (score.point_potentiel)::float = 0.0
               then (score.fait_taches_avancement)::float / (score.total_taches_count)::float
           else (score.point_fait)::float / (score.point_potentiel)::float
           end,
       case
           when (score.point_potentiel)::float = 0.0
               then (score.programme_taches_avancement)::float / (score.total_taches_count)::float
           else (score.point_programme)::float / (score.point_potentiel)::float
           end,
       case
           when (score.total_taches_count)::float = 0.0 then 0.0
           else (score.completed_taches_count)::float / (score.total_taches_count)::float
           end,
       (score.completed_taches_count)::float = (score.total_taches_count)::float,
       (score.concerne)::boolean,
       (score.desactive)::boolean
$$
    language sql stable;
comment on function private.score_summary_of is
    'Fonction utilitaire pour obtenir un résumé d''un score donné.';


create or replace function
    labellisation.referentiel_score(collectivite_id integer)
    returns table
            (
                referentiel     referentiel,
                score_fait      float,
                score_programme float,
                completude      float,
                complet         boolean
            )
as
$$
with ref as (select unnest(enum_range(null::referentiel)) as referentiel),
     scores as (select s.*
                from ref
                         left join client_scores cs on cs.referentiel = ref.referentiel
                         join private.convert_client_scores(cs.scores) s on true
                where cs.collectivite_id = referentiel_score.collectivite_id)
select s.referentiel,
       ss.proportion_fait,
       ss.proportion_programme,
       ss.completude,
       ss.complete
from scores s
         join private.score_summary_of(s) ss on true
where s.action_id = s.referentiel::action_id;
$$
    language sql;
comment on function labellisation.referentiel_score is
    'Extrait les éléments nécessaires pour la labellisation d''une collectivité donnée à partir du score client';


create or replace function
    labellisation.etoiles(collectivite_id integer)
    returns table
            (
                referentiel                    referentiel,
                etoile_labellise               labellisation.etoile,
                prochaine_etoile_labellisation labellisation.etoile,
                etoile_score_possible          labellisation.etoile,
                etoile_objectif                labellisation.etoile
            )
as
$$
with ref as (select unnest(enum_range(null::referentiel)) as referentiel),
     -- étoile déduite de la labellisation obtenue
     l_etoile as (select r.referentiel,
                         em.etoile,
                         em.prochaine_etoile
                  from ref r
                           join public.labellisation l on r.referentiel = l.referentiel
                           join labellisation.etoile_meta em
                                on em.etoile = l.etoiles::varchar::labellisation.etoile
                  where l.collectivite_id = etoiles.collectivite_id),
     score as (select * from labellisation.referentiel_score(etoiles.collectivite_id)),
     -- étoile déduite du score
     s_etoile as (select r.referentiel,
                         case
                             when s.complet then max(em.etoile)
                             end as etoile_atteinte
                  from ref r
                           join score s on r.referentiel = s.referentiel
                           join labellisation.etoile_meta em
                                on em.min_realise_percentage <= s.score_fait
                  group by r.referentiel, s.complet)

select s.referentiel,
       l.etoile                                                       as etoile_labellise,
       l.prochaine_etoile                                             as prochaine_etoile_labellisation,
       s.etoile_atteinte                                              as etoile_score_possible,
       greatest(l.etoile, l.prochaine_etoile, s.etoile_atteinte, '1') as etoile_objectif
from s_etoile s
         left join l_etoile l on l.referentiel = s.referentiel;
$$
    language sql;
comment on function labellisation.etoiles is
    'Renvoie l''état des étoiles pour chaque référentiel pour une collectivité donnée.';


create or replace function
    labellisation.critere_score_global(collectivite_id integer)
    returns table
            (
                referentiel      referentiel,
                etoile_objectif  labellisation.etoile,
                score_a_realiser float,
                score_fait       float,
                atteint          bool
            )
as
$$
with score as (select * from labellisation.referentiel_score(critere_score_global.collectivite_id))
select e.referentiel,
       e.etoile_objectif,
       em.min_realise_score,
       s.score_fait,
       s.score_fait >= em.min_realise_score
from labellisation.etoiles(critere_score_global.collectivite_id) as e
         left join labellisation.etoile_meta em on em.etoile = e.etoile_objectif
         left join score s on e.referentiel = s.referentiel
$$
    language sql;
comment on function labellisation.critere_score_global is
    'Renvoie le critère de score pour une collectivité donnée.';


create or replace function
    labellisation.critere_action(collectivite_id integer)
    returns table
            (
                referentiel         referentiel,
                etoiles             labellisation.etoile,
                action_id           action_id,
                formulation         text,
                score_realise       float,
                min_score_realise   float,
                score_programme     float,
                min_score_programme float,
                atteint             bool, 
                prio                integer
            )
as
$$
with scores as (select s.*
                from client_scores cs
                         join private.convert_client_scores(cs.scores) s on true
                where cs.collectivite_id = critere_action.collectivite_id)
select ss.referentiel,
       cla.etoile,
       cla.action_id,
       cla.formulation,
       ss.proportion_fait,
       cla.min_realise_percentage,
       ss.proportion_programme,
       cla.min_programme_percentage,
       coalesce(ss.proportion_fait * 100  >= cla.min_realise_percentage, false) or
       coalesce((ss.proportion_programme + ss.proportion_fait) * 100 >= cla.min_programme_percentage, false) as atteint,
       cla.prio
from labellisation_action_critere cla
         join scores sc on sc.action_id = cla.action_id
         join private.score_summary_of(sc) ss on true
where not ss.desactive
$$
    language sql;
comment on function labellisation.critere_action is
    'Renvoie l''état des critères applicables à une collectivité donnée pour toute les étoiles.';



create table labellisation_demande
(
    id              serial primary key,
    en_cours        boolean                         not null default true,
    collectivite_id integer references collectivite not null,
    referentiel     referentiel                     not null,
    etoiles         labellisation.etoile            not null,
    date            timestamptz                     not null default now()
);

alter table labellisation_demande
    enable row level security;

create policy allow_read
    on labellisation_demande for select
    using (is_authenticated());

create policy allow_insert
    on labellisation_demande for insert
    with check (is_any_role_on(collectivite_id));

create policy allow_update
    on labellisation_demande for update
    using (is_any_role_on(collectivite_id));


