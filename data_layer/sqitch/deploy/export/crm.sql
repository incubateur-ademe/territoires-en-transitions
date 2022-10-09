-- Deploy tet:export/crm to pg

BEGIN;


-- dcp onboarding
select dcp.prenom,
       dcp.nom,
       dcp.email,
       dcp.telephone
from utilisateur.dcp_display dcp
;

-- dcp
select dcp.prenom,
       dcp.nom,
       dcp.email,
       dcp.telephone,
       u.created_at       as creation,
       u.last_sign_in_at  as derniere_connexion,
       (select count(*)
        from private_utilisateur_droit pud
        where pud.user_id = dcp.user_id
          and pud.active) as nb_collectivite
from utilisateur.dcp_display dcp
         join auth.users u on u.id = dcp.user_id
;

-- collectivites
with last_labellisation as (select l.collectivite_id,
                                   max(l.annee) filter ( where referentiel = 'cae' ) as annee_label_cae,
                                   max(l.annee) filter ( where referentiel = 'eci' ) as annee_label_eci
                            from labellisation l
                            group by l.referentiel,
                                     l.collectivite_id)
select cc.collectivite_id,
       unaccent(nom)                                    as nom_sans_accent,
       cc.nom,
       r.libelle                                        as region_name,
       d.libelle                                        as depatement_name,
       cc.type_collectivite,
       cc.population,
       cc.code_siren_insee,
       cc.completude_cae,
       cc.completude_eci,

       (select count(*)
        from private_utilisateur_droit pud
        where active
          and cc.collectivite_id = pud.collectivite_id) as nb_membres,

       ll.annee_label_cae,
       ll.annee_label_eci

from collectivite_card cc
         join imports.region r on cc.region_code = r.code
         join imports.departement d on cc.departement_code = d.code
         left join last_labellisation ll on ll.collectivite_id = cc.collectivite_id
;

-- membres
select dcp.email,
       pud.collectivite_id,
       unaccent(nc.nom) as collectivite,
       m.fonction,
       m.details_fonction,
       coalesce(m.champ_intervention && '{cae}', false) as cae,
       coalesce( m.champ_intervention && '{eci}', false) as eci

from utilisateur.dcp_display dcp
         left join private_utilisateur_droit pud on pud.active and pud.user_id = dcp.user_id
         left join named_collectivite nc on pud.collectivite_id = nc.collectivite_id
         left join private_collectivite_membre m on m.user_id = pud.user_id
;

COMMIT;
