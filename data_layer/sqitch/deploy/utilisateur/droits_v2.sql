-- Deploy tet:droits to pg
-- requires: collectivites

BEGIN;

comment on function claim_collectivite(integer) is
    'Fonction dépréciée pour rejoindre une collectivité.';

create function claim_collectivite(
    collectivite_id integer,
    role membre_fonction,
    poste text,
    champ_intervention referentiel[]
) returns json
    security definer
    language plpgsql
    volatile
as
$$
begin
    if not is_authenticated() then
        perform set_config('response.status', '401', true);
        return json_build_object('message', 'Vous n''êtes pas connecté.');
    end if;

    -- si la collectivité n'a pas d'utilisateur actif existant
    if not exists (select 1
                   from private_utilisateur_droit pud
                   where pud.active
                     and pud.collectivite_id = $1)
    then
        -- alors on créé un droit
        insert
        into private_utilisateur_droit(user_id, collectivite_id, niveau_acces, active)
        values (auth.uid(), $1, 'admin', true);

        -- puis on ajoute les informations complémentaires
        insert
        into private_collectivite_membre(user_id, collectivite_id, fonction, details_fonction, champ_intervention)
        values (auth.uid(), $1, $2, $3, $4);

        -- enfin on renvoie un message
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous êtes administrateur de la collectivité.');
    else
        -- sinon on renvoie une erreur 409: Conflict
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'La collectivité dispose déjà d''un administrateur.');
    end if;
end
$$;
comment on function claim_collectivite(integer, membre_fonction, text, referentiel[]) is
    'Permet à l''utilisateur de rejoindre une collectivité sans utilisateur.';

COMMIT;
