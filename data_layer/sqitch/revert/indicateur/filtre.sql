-- Deploy tet:indicateur/filtre to pg

BEGIN;

-- Revert les axes pour appliquer de nouveau la verification de droits

create or replace function
    axes(indicateur_definitions)
    returns setof axe
    language sql
    security definer
    stable
begin
    atomic
    select axe
    from fiche_action_indicateur fai
             join fiche_action_axe faa using (fiche_id)
             join axe on faa.axe_id = axe.id
             left join definition_referentiel($1) def on true
    where
       -- indicateur prédéfini
        (($1.indicateur_id is not null
            and fai.indicateur_id = $1.indicateur_id
            and collectivite_id = $1.collectivite_id)
       -- indicateur prédéfini dont les valeurs sont celles d'un autre
       or ($1.indicateur_id is not null
        and fai.indicateur_id = def.valeur_indicateur
        and collectivite_id = $1.collectivite_id)
       -- indicateur perso
       or ($1.indicateur_perso_id is not null
        and fai.indicateur_personnalise_id = $1.indicateur_perso_id))
    and can_read_acces_restreint(axe.collectivite_id);
end;
comment on function axes(indicateur_definitions) is
    'Les axes (plans d''action) associés à un indicateur.';

COMMIT;
