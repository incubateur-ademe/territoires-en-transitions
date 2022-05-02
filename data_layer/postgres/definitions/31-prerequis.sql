create schema if not exists labellisation;
comment on schema labellisation is
    'Regroupe les éléments hors API qui permettent de déterminer la possibilité d''accéder à une demande d''audit.';


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
    'La description du champ fichier pour chaque palier.';


alter table labellisation_calendrier
    enable row level security;

create policy critere_fichier_read_for_all
    on labellisation_calendrier
    for select
    using (true);


create or replace function
    private.score_of(scores jsonb, action_id action_id)
    returns table
            (
                referentiel          referentiel,
                proportion_fait      float,
                proportion_programme float,
                completude           float,
                complete             boolean,
                concerne             boolean
            )
as
$$
select (score ->> 'referentiel')::referentiel                                                as referentiel,
       case
           when (score ->> 'point_potentiel')::float = 0.0
               then (score ->> 'fait_taches_avancement')::float / (score ->> 'total_taches_count')::float * 100
           else (score ->> 'point_fait')::float / (score ->> 'point_potentiel')::float * 100
           end                                                                               as proportion_fait,
       case
           when (score ->> 'point_potentiel')::float = 0.0
               then (score ->> 'programme_taches_avancement')::float / (score ->> 'total_taches_count')::float * 100
           else (score ->> 'point_programme')::float / (score ->> 'point_potentiel')::float * 100
           end                                                                               as proportion_programme,
       case
           when (score ->> 'total_taches_count')::float = 0.0 then 0.0
           else (score ->> 'completed_taches_count')::float / (score ->> 'total_taches_count')::float
           end                                                                               as completude,
       (score ->> 'completed_taches_count')::float = (score ->> 'total_taches_count')::float as complete,
       (score ->> 'concerne')::boolean                                                       as concerne
from jsonb_array_elements(scores) as score
where score @> ('{"action_id": "' || score_of.action_id || '"}')::jsonb;
$$
    language sql stable;
comment on function private.score_of is
    'Fonction utilitaire pour obtenir un score typé pour une action donnée depuis le json de `client_scores`.';


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
with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
select r.referentiel,
       s.proportion_fait,
       s.proportion_programme,
       s.completude,
       s.complete
from ref r
         join public.client_scores cs on cs.referentiel = r.referentiel
         join private.score_of(cs.scores, r.referentiel::action_id) s on true
where cs.collectivite_id = referentiel_score.collectivite_id;
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


create or replace function
    labellisation.criteres(collectivite_id integer)
    returns table
            (
                referentiel         referentiel,
                action_id           action_id,
                formulation         text,
                score_realise       float,
                min_score_realise   float,
                score_programme     float,
                min_score_programme float,
                atteint             bool
            )
as
$$
select cs.referentiel,
       cla.action_id,
       cla.formulation,
       s.proportion_fait,
       cla.min_realise_percentage,
       s.proportion_programme,
       cla.min_programme_percentage,
       coalesce(s.proportion_fait >= cla.min_realise_percentage, false) or
       coalesce(s.proportion_programme >= cla.min_programme_percentage, false) as atteint
from labellisation_action_critere cla
         join client_scores cs on cs.referentiel = cla.referentiel and
                                  cs.collectivite_id = criteres.collectivite_id

         left join private.score_of(cs.scores, cla.action_id) s on true
where s.concerne
$$
    language sql;
comment on function labellisation.criteres is
    'Renvoie l''état des critères applicables à une collectivité donnée';



create table labellisation_demande
(
    id              serial primary key,
    collectivite_id integer references collectivite not null,
    referentiel     referentiel                     not null,
    etoiles         labellisation.etoile            not null,
    date            timestamptz                     not null default now()
);


create or replace function
    labellisation_parcours(collectivite_id integer)
    returns table
            (
                referentiel      referentiel,
                etoiles          labellisation.etoile,
                completude_ok    boolean,
                criteres         jsonb,
                rempli           boolean,
                calendrier       text,
                derniere_demande jsonb
            )
as
$$
with criteres as (select c.referentiel,
                         bool_and(c.atteint) as atteints,
                         jsonb_agg(
                                 jsonb_build_object(
                                         'formulation', formulation,
                                         'action_id', c.action_id,
                                         'rempli', c.atteint,
                                         'action_identifiant', ad.identifiant,
                                     -- todo better prose.
                                         'statut_ou_score', 'min programmé : ' ||
                                                            c.min_score_programme ||
                                                            ' min réalisé : ' ||
                                                            c.min_score_realise
                                     )
                             )               as liste
                  from labellisation.criteres(labellisation_parcours.collectivite_id) c
                           join action_definition ad on c.action_id = ad.action_id
                  group by c.referentiel)
select e.referentiel,
       e.etoile_objectif,
       rs.complet,
       criteres.liste,
       criteres.atteints,
       calendrier.information,

       case
           when demande.etoiles is null
               then null
           else jsonb_build_object('demandee_le', demande.date, 'etoiles', demande.etoiles)
           end

from labellisation.etoiles(labellisation_parcours.collectivite_id) as e
         join criteres on criteres.referentiel = e.referentiel
         left join labellisation.referentiel_score(labellisation_parcours.collectivite_id) rs
                   on rs.referentiel = e.referentiel
         left join labellisation_calendrier calendrier
                   on calendrier.referentiel = e.referentiel
         left join lateral (select ld.date, ld.etoiles
                            from labellisation_demande ld
                            where ld.collectivite_id = labellisation_parcours.collectivite_id
                              and ld.referentiel = e.referentiel) demande on true

$$
    language sql;
comment on function labellisation_parcours is
    'Renvoie le parcours de labellisation de chaque référentiel pour une collectivité donnée.';
