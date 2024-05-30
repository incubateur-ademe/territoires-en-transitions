-- Deploy tet:droits to pg
-- requires: collectivites

BEGIN;

drop function collectivite_membres(id integer);

create function collectivite_membres(id integer)
    returns TABLE(user_id text, prenom text, nom text, email text, telephone text, niveau_acces niveau_acces, fonction membre_fonction, details_fonction text, champ_intervention referentiel[], invitation_id text)
    security definer
    language sql
as
$$
with droits_dcp_membre as
         (select d.user_id,
                 p.prenom,
                 p.nom,
                 p.email,
                 p.telephone,
                 d.niveau_acces,
                 m.fonction,
                 m.details_fonction,
                 m.champ_intervention,
                 null::uuid as invitation_id
          from private_utilisateur_droit d
                   left join utilisateur.dcp_display p on p.user_id = d.user_id
                   left join private_collectivite_membre m
                             on m.user_id = d.user_id and m.collectivite_id = d.collectivite_id
          where d.collectivite_id = collectivite_membres.id
            and d.active),
     invitations as (select null::uuid             as user_id,
                            null                   as prenom,
                            null                   as nom,
                            i.email,
                            null                   as telephone,
                            i.niveau::niveau_acces as niveau_acces,
                            null::membre_fonction  as fonction,
                            null                   as details_fonction,
                            null::referentiel[]    as champ_intervention,
                            i.id                   as invitation_id
                     from utilisateur.invitation i
                     where i.collectivite_id = collectivite_membres.id
                       and i.pending),
     merged as (select *
                from droits_dcp_membre
                where is_authenticated() -- limit dcp listing to user with an account.
                union
                select *
                from invitations
                where have_edition_acces(collectivite_membres.id) -- do not show invitations to those who cannot invite.
     )
select *
from merged
where est_verifie() or have_lecture_acces(collectivite_membres.id)
order by invitation_id,
        case fonction
             when 'referent' then 1
             when 'technique' then 2
             when 'politique' then 3
             when 'conseiller' then 4
             else 5
             end,
         nom,
         prenom;
$$;


COMMIT;
