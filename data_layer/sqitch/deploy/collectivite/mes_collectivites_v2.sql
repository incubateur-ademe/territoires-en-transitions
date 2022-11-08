-- Deploy tet:collectivite/mes_collectivites_v2 to pg
-- requires: utilisateur/niveaux_acces

BEGIN;

/*
Dit si l'utilisateur courant est auditeur sur une collectivité
     Paramètres :
        col             collectivite.id
 */
create function est_auditeur(col integer) returns boolean as
$$
with
    ref as (select unnest(enum_range(null::referentiel)) as referentiel),
    audit_en_cours as (
        select auditeur
        from ref left join labellisation.current_audit(est_auditeur.col,ref.referentiel) on true
    )
select coalesce(bool_or(auth.uid()=audit_en_cours.auditeur), false) from audit_en_cours;
$$ language sql security definer;
comment on function est_auditeur is
    'Dit si l''utilisateur courant est auditeur sur une collectivité
     Paramètres :
        col             collectivite.id';


-- permet au client d'afficher les noms des collectivités et de les filtrer sur les critères de droits.
create or replace view collectivite_niveau_acces
as
with current_droits as (select *
                        from private_utilisateur_droit
                        where user_id = auth.uid()
                          and active)
select named_collectivite.collectivite_id,
       named_collectivite.nom,
       niveau_acces,
       est_auditeur(named_collectivite.collectivite_id) as est_auditeur
from named_collectivite
         left join current_droits on named_collectivite.collectivite_id = current_droits.collectivite_id
order by unaccent(nom);


create or replace view mes_collectivites
as
select *
from collectivite_niveau_acces
where niveau_acces is not null
order by unaccent(nom);

COMMIT;
