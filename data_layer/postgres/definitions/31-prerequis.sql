create schema if not exists labellisation;
comment on schema labellisation is
    'Regroupe les éléments hors API qui permettent de déterminer la possibilité d''accéder à une demande d''audit.';

create or replace function
    labellisation.critere_1_1(collectivite_id integer, referentiel referentiel)
    returns boolean
as
$$
with ref as (select id as action_id
             from action_relation r
             where r.referentiel = critere_1_1.referentiel),
     statuts as (select s.action_id
                 from action_statut s
                          join ref on ref.action_id = s.action_id
                 where s.collectivite_id = critere_1_1.collectivite_id)
select count(*) = 0
from ((select * from ref) except (select * from statuts)) as r
$$ language sql;
comment on function labellisation.critere_1_1 is
    'Critère 1.1 : Renseigner tous les statuts';


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


create table if not exists critere_labellisation_action
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
comment on table critere_labellisation_action is
    'Les critères administrables à remplir pour accéder à une demande de labellisation';


alter table critere_labellisation_action
    enable row level security;

create policy critere_read_for_all
    on critere_labellisation_action
    for select
    using (true);

create table if not exists critere_labellisation_fichier
(
    referentiel referentiel          not null,
    etoile      labellisation.etoile not null,
    description text                 not null,
    primary key (referentiel, etoile)
);
comment on table critere_labellisation_fichier is
    'La description du champ fichier pour chaque palier.';


alter table critere_labellisation_fichier
    enable row level security;

create policy critere_fichier_read_for_all
    on critere_labellisation_fichier
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
     score as (select jsonb_array_elements(scores) as o
               from ref r
                        join public.client_scores cs on cs.referentiel = r.referentiel
               where cs.collectivite_id = referentiel_score.collectivite_id)
select r.referentiel,
       (score.o ->> 'point_fait')::float / (score.o ->> 'point_referentiel')::float * 100        as score_fait,
       (score.o ->> 'point_programme')::float / (score.o ->> 'point_referentiel')::float * 100   as score_programme,
       (score.o ->> 'completed_taches_count')::float / (score.o ->> 'total_taches_count')::float as completute,
       (score.o ->> 'completed_taches_count')::float = (score.o ->> 'total_taches_count')::float as complete

from ref r
         join score on true
where score.o @> ('{"action_id": "' || r.referentiel || '"}')::jsonb;
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
                         max(em.etoile) as etoile_atteinte
                  from ref r
                           join score s on r.referentiel = s.referentiel
                           join labellisation.etoile_meta em
                                on em.min_realise_percentage <= s.score_fait
                  group by r.referentiel)

select s.referentiel,
       l.etoile                                                  as etoile_labellise,
       l.prochaine_etoile                                        as prochaine_etoile_labellisation,
       s.etoile_atteinte                                         as etoile_score_possible,
       greatest(l.etoile, l.prochaine_etoile, s.etoile_atteinte) as etoile_objectif
from s_etoile s
         left join l_etoile l on l.referentiel = s.referentiel;
$$
    language sql;
comment on function labellisation.etoiles is
    'Renvoie l''état des étoiles pour chaque référentiel pour une collectivité donnée.';

