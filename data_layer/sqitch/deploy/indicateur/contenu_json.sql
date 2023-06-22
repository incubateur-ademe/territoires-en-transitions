-- Deploy tet:indicateur/json_content to pg

BEGIN;

create or replace function
    private.upsert_indicateurs(indicateurs jsonb)
    returns void
as
$$
declare
    indicateur jsonb;
begin
    -- on utilise une table temporaire pour ne pas avoir les contraintes sur les `valeur_indicateur`
    create temporary table definition
    (
        like indicateur_definition
    ) on commit drop;

    for indicateur in select * from jsonb_array_elements(indicateurs)
        loop
            insert into definition
            (id, groupe, identifiant, valeur_indicateur, nom, description, unite,
             parent, participation_score, source, titre_long, type,
             thematiques, programmes, modified_at)
            values ((indicateur ->> 'id')::indicateur_id,
                    (indicateur ->> 'groupe')::indicateur_group,
                    indicateur ->> 'identifiant',
                    (indicateur ->> 'valeur_indicateur')::indicateur_id,
                    indicateur ->> 'nom',
                    indicateur ->> 'description',
                    indicateur ->> 'unite',
                    indicateur ->> 'parent',
                    (indicateur -> 'participation_score')::bool,
                    indicateur ->> 'source',
                    indicateur ->> 'titre_long',
                    (indicateur ->> 'type')::indicateur_referentiel_type,
                    (select array(
                                    select jsonb_array_elements_text((indicateur -> 'thematiques'))
                                )::indicateur_thematique[]),
                    (select array(
                                    select jsonb_array_elements_text((indicateur -> 'programmes'))
                                )::indicateur_programme[]),
                    now());
        end loop;

    -- on commence par insérer les définitions sans parents
    insert into indicateur_definition
    select *
    from definition
    where parent is null
      and valeur_indicateur is null
    on conflict (id) do update
        set groupe              = excluded.groupe,
            identifiant         = excluded.identifiant,
            nom                 = excluded.nom,
            description         = excluded.description,
            unite               = excluded.unite,
            participation_score = excluded.participation_score,
            source              = excluded.source,
            titre_long          = excluded.titre_long,
            type                = excluded.type,
            thematiques         = excluded.thematiques,
            programmes          = excluded.programmes,
            modified_at         = excluded.modified_at;

    -- puis le reste
    insert into indicateur_definition
    select *
    from definition
    where not (parent is null and valeur_indicateur is null)
    on conflict (id) do update
        set groupe              = excluded.groupe,
            identifiant         = excluded.identifiant,
            valeur_indicateur   = excluded.valeur_indicateur,
            nom                 = excluded.nom,
            description         = excluded.description,
            unite               = excluded.unite,
            parent              = excluded.parent,
            participation_score = excluded.participation_score,
            source              = excluded.source,
            titre_long          = excluded.titre_long,
            type                = excluded.type,
            thematiques         = excluded.thematiques,
            programmes          = excluded.programmes,
            modified_at         = excluded.modified_at;

    -- les liens entre indicateur et action
    for indicateur in select * from jsonb_array_elements(indicateurs)
        loop
            if indicateur -> 'action_ids' != 'null'
            then
                --- insert les liens
                insert into indicateur_action (indicateur_id, action_id)
                select indicateur ->> 'id',
                       jsonb_array_elements_text(indicateur -> 'action_ids')::action_id
                on conflict (indicateur_id, action_id) do nothing;
                --- enlève les liens qui n'existent plus
                delete
                from indicateur_action ia
                where ia.indicateur_id = (indicateur ->> 'id')::indicateur_id
                  and ia.action_id not in
                      (select id::action_id from jsonb_array_elements_text(indicateur -> 'action_ids') as id);
            end if;
        end loop;
end ;
$$ language plpgsql security definer;

COMMIT;
