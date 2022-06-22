create or replace function
    labellisation_demande(collectivite_id integer, referentiel referentiel, etoiles labellisation.etoile)
    returns labellisation.demande
as
$$
with data as (select labellisation_demande.collectivite_id,
                     labellisation_demande.referentiel,
                     labellisation_demande.etoiles
              where is_authenticated())

insert
into labellisation.demande (collectivite_id, referentiel, etoiles)
select *
from data
on conflict do nothing;

select *
from labellisation.demande ld
where ld.collectivite_id = labellisation_demande.collectivite_id
  and ld.referentiel = labellisation_demande.referentiel
  and ld.etoiles = labellisation_demande.etoiles
$$ language sql security definer;
comment on function labellisation_demande is
    'Renvoie la demande de labellisation pour une collectivité, un référentiel et un nombre d''étoiles donnés.'
        'Crée une demande en cours si aucune demande correspondante n''existe.';


create or replace function
    labellisation_submit_demande(collectivite_id integer, referentiel referentiel, etoiles labellisation.etoile)
    returns labellisation.demande
as
$$

with data as (select labellisation_submit_demande.collectivite_id,
                     labellisation_submit_demande.referentiel,
                     labellisation_submit_demande.etoiles
              where is_any_role_on(labellisation_submit_demande.collectivite_id))

insert
into labellisation.demande (collectivite_id, referentiel, etoiles, en_cours)
select *, false
from data
on conflict (collectivite_id, referentiel, etoiles) do update set en_cours = false;

select *
from labellisation.demande ld
where ld.collectivite_id = labellisation_submit_demande.collectivite_id
  and ld.referentiel = labellisation_submit_demande.referentiel
  and ld.etoiles = labellisation_submit_demande.etoiles
$$ language sql security definer ;
comment on function labellisation_submit_demande is
    'Soumet une demande de labellisation pour une collectivité, un référentiel et un nombre d''étoiles donnés.'
        'Met à jour ou créé une demande qui n''est pas en cours.';
