create or replace function
    test.generate_scores(
    scores private.action_score[] default '{}'::private.action_score[],
    total_points float default 1000.0
)
    returns setof private.action_score
as
$$
with fake_ref as (with axes as (select ar.referentiel,
                                       count(*) as count
                                from action_children ac
                                         join action_relation ar on ar.id = ac.id
                                where depth = 1
                                group by ar.referentiel)
                  select ac.id,
                         ar.referentiel,
                         coalesce(array_length(ac.children, 1), 0)                as children_count,
                         (axes.count * total_points) /
                         sum(array_length(ac.children, 1)) over (order by depth ) as points
                  from action_children ac
                           join action_relation ar on ar.id = ac.id
                           join axes on axes.referentiel = ar.referentiel),
     s as (select *
           from unnest(scores))
select fr.referentiel,
       fr.id,
       coalesce(s.concerne, true),
       coalesce(s.desactive, false),
       coalesce(s.point_fait, fr.points),
       coalesce(s.point_pas_fait, 0.0),
       coalesce(s.point_potentiel, fr.points),
       coalesce(s.point_programme, 0.0),
       coalesce(s.point_referentiel, fr.points),
       coalesce(s.total_taches_count, fr.children_count),
       coalesce(s.point_non_renseigne, 0.0),
       coalesce(s.point_potentiel_perso, fr.points),
       coalesce(s.completed_taches_count, fr.children_count),
       coalesce(s.fait_taches_avancement, fr.children_count),
       coalesce(s.pas_fait_taches_avancement, 0.0),
       coalesce(s.programme_taches_avancement, 0.0),
       coalesce(s.pas_concerne_taches_avancement, 0.0)
from fake_ref fr
         left join s on s.action_id = fr.id
$$ language sql;
comment on function test.generate_scores is
    'Interpole de faux scores *fait* par default, avec des scores optionnels donnés '
        'afin de tester les critères labellisation en fonction de scores. '
        'Attention les scores ne sont pas sommés.';

create or replace function
    test_write_scores(
    collectivite_id integer,
    scores private.action_score[] default '{}'::private.action_score[]
)
    returns void
as
$$
delete
from client_scores cs
where cs.collectivite_id = test_write_scores.collectivite_id;

insert into client_scores
select test_write_scores.collectivite_id,
       s.referentiel,
       jsonb_agg(s),
       now()
from test.generate_scores((select array_agg(s) from private.action_score s)) s
group by s.referentiel;
$$ language sql;
comment on function test_write_scores is
    'Écrit de faux scores *fait* par default interpolés avec des scores optionnels donnés '
        'afin de tester les critères labellisation en fonction de scores. '
        'Attention les scores ne sont pas sommés.';


create or replace view test.min_requirements
as
select action_id,
       referentiel,
       etoile,
       -- null is the maximum value, as programme < fait - we prefer a null programme
       case
           when null_programme.yes then null
           else max(min_programme_percentage) end as min_programme_percentage,
       max(min_realise_percentage)                as min_realise_percentage
from labellisation_action_critere lac
         -- for every requirement we check if there is a null
         join lateral (select ll.min_programme_percentage is null as yes
                       from labellisation_action_critere ll
                       where ll.action_id = lac.action_id
                       order by min_programme_percentage nulls first
                       limit 1 ) null_programme on true
group by action_id, referentiel, etoile, null_programme.yes;
comment on view test.min_requirements is
    'Les prérequis par étoile pour les fonctions de test, permet de générer les scores minimums.';


create or replace function
    test_fulfill(
    collectivite_id integer,
    etoile labellisation.etoile
)
    returns void
as
$$
truncate private.action_score; -- use action_score as a temp table

-- required actions scores
insert into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                                  completed_taches_count, total_taches_count)
select mr.referentiel,
       mr.action_id,
       -- take the bare minimum programme or realise.
       case
           when mr.min_programme_percentage is not null then .0
           else mr.min_realise_percentage
           end,
       coalesce(mr.min_programme_percentage, .0),
       --
       1,
       4,
       4
from test.min_requirements mr
where mr.etoile = test_fulfill.etoile;

-- root actions scores
with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
insert
into private.action_score (referentiel, action_id, point_fait, point_programme, point_potentiel,
                           completed_taches_count, total_taches_count)
select ref.referentiel, ref.referentiel::action_id, em.min_realise_percentage, .0, 100, 4, 4
from ref
         join labellisation.etoile_meta em on em.etoile = test_fulfill.etoile;

-- insert client scores
select
from test_write_scores(
        test_fulfill.collectivite_id,
        (select array_agg(s) from private.action_score s)
    );

truncate private.action_score; -- clean up
$$ language sql;
comment on function test_fulfill is
    'Insert des faux scores pour q''une collectivité atteigne une étoile. '
        'Attention les scores ne sont pas cohérents, le score d''un référentiel n''est pas égal la somme de ses axes.';
