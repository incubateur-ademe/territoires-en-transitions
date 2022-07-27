-- Deploy tet:labellisation/prerequis to pg
-- requires: labellisation/schema
-- requires: labellisation/labellisation
-- requires: referentiel/contenu

BEGIN;

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


create table labellisation_action_critere
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

create table labellisation_fichier_critere
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


create table labellisation_calendrier
(
    referentiel referentiel primary key,
    information text not null
);
comment on table labellisation_calendrier is
    'La description du champ calendrier pour chaque palier.';


alter table labellisation_calendrier
    enable row level security;

create policy read_for_all
    on labellisation_calendrier
    for select
    using (true);

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
                                on em.min_realise_score <= s.score_fait
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

create table labellisation.demande
(
    id              serial primary key,
    en_cours        boolean                         not null default true,
    collectivite_id integer references collectivite not null,
    referentiel     referentiel                     not null,
    etoiles         labellisation.etoile            not null,
    date            timestamptz                     not null default now(),
    unique (collectivite_id, referentiel, etoiles)
);

COMMIT;
