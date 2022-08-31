-- Revert tet:labellisation/preuve_v2 from pg

BEGIN;

-- revert to previous version
create or replace function
    labellisation.critere_fichier(collectivite_id integer)
    returns table
            (
                referentiel   referentiel,
                preuve_nombre integer,
                atteint       bool
            )
as
$$
with ref as (select unnest(enum_range(null::referentiel)) as referentiel)
select r.referentiel,
       count(lpf.file_id),
       count(lpf.file_id) > 0
from ref r
         left join lateral (select *
                            from labellisation.demande ld
                            where ld.referentiel = r.referentiel
                              and ld.collectivite_id = critere_fichier.collectivite_id) ld on true
         left join labellisation_preuve_fichier lpf on ld.id = lpf.demande_id
group by r.referentiel;
$$ language sql;

-- drop feature
drop view preuve;
drop view labellisation.action_definition_snippet;
drop view labellisation.bibliotheque_fichier_snippet;

drop table preuve_rapport;
drop table preuve_demande;
drop table preuve_reglementaire;
drop table preuve_complementaire;
drop table labellisation.preuve_base;

drop type preuve_type;

COMMIT;
