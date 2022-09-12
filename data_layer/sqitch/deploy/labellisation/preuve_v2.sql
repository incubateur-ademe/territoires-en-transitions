-- Deploy tet:labellisation/preuve_v2 to pg

BEGIN;

-- les différents type de preuves.
create type preuve_type as enum ('complementaire', 'reglementaire', 'labellisation', 'rapport');

-- table de base pour les preuves, elle contient les colones et les contraintes
-- qui sont copiées avec `like labellisation.preuve_base including ...`
create table labellisation.preuve_base
(
    collectivite_id integer references collectivite not null,

    fichier_id      integer references labellisation.bibliotheque_fichier,
    url             text,
    titre           text                            not null default '',

    commentaire     text                            not null default '',

    modified_by     uuid references auth.users      not null default auth.uid(),
    modified_at     timestamptz                     not null default CURRENT_TIMESTAMP,

    check ( (fichier_id is not null and url is null) or (url is not null and fichier_id is null) ), -- xor on null
    lien            jsonb generated always as (
                        case
                            when url is not null then
                                jsonb_object(array ['url', url, 'titre', titre])
                            end
                        ) stored
);
comment on column labellisation.preuve_base.fichier_id
    is 'L''id du fichier dans la bibliothèque, null si la preuve est un lien.';
comment on column labellisation.preuve_base.url
    is 'L''url du lien, null si la preuve est un fichier.';
comment on column labellisation.preuve_base.titre
    is 'Le titre du lien.';
comment on column labellisation.preuve_base.lien
    is 'Le lien au format json, null si la preuve est un fichier.';


-- Une preuve complémentaire est attachée directement à une action.
create table preuve_complementaire
(
    id        serial primary key,                 -- on ne copie pas l'index pour des raisons de permissions.
    like labellisation.preuve_base including all, -- on copie les colonnes et toutes les contraintes.
    action_id action_id references action_relation not null
);

-- Une preuve rattachée à la definition d'une preuve réglementaire.
create table preuve_reglementaire
(
    id        serial primary key,
    like labellisation.preuve_base including all,
    preuve_id preuve_id references preuve_reglementaire_definition not null
);

-- Une preuve rattachée à une demande de labellisation.
create table preuve_labellisation
(
    id         serial primary key,
    like labellisation.preuve_base including all,
    demande_id integer references labellisation.demande not null
);

-- Une preuve rattachée à une collectivité.
create table preuve_rapport
(
    id   serial primary key,
    like labellisation.preuve_base including all,
    date timestamptz not null
);

do
$$
    declare
        name text;
    begin
        -- Pour chaque type, et donc chaque table nommée preuve_[type]
        foreach name in array enum_range(NULL::preuve_type)
            loop
                -- On ajoute les triggers
                perform private.add_modified_at_trigger('public', 'preuve_' || name);
                perform utilisateur.add_modified_by_trigger('public', 'preuve_' || name);

                -- Et les RLS
                execute format('alter table preuve_%I
                    enable row level security;', name);
                --- Tout les membres de Territoires en transitions peuvent lire.
                execute format('create policy allow_read
                    on preuve_%I using (is_authenticated());', name);
                --- Seuls les membres ayant un accès en édition peuvent écrire.
                execute format('create policy allow_insert
                    on preuve_%I
                    with check (have_edition_acces(collectivite_id));', name);
                execute format('create policy allow_update
                    on preuve_%I
                    using (have_edition_acces(collectivite_id));', name);
            end loop;
    end;
$$;

-- Vue partielle `bibliotheque_fichier` en json.
create view labellisation.bibliotheque_fichier_snippet as
select id,
       jsonb_build_object(
               'filename', filename,
               'hash', hash,
               'bucket_id', bucket_id,
               'filesize', filesize) as snippet
from public.bibliotheque_fichier;

-- Vue partielle de `action_definition` en json.
create view labellisation.action_snippet as
with score as (select *
               from client_scores cs
                        left join private.convert_client_scores(cs.scores) on true)
select ad.action_id,
       score.collectivite_id,
       jsonb_build_object(
               'action_id', ad.action_id,
               'identifiant', ad.identifiant,
               'referentiel', ad.referentiel,
               'desactive', score.desactive,
               'concerne', score.concerne,
               'nom', ad.nom,
               'description', ad.description
           ) as snippet
from collectivite c
         join action_definition ad on true
         join score on score.collectivite_id = c.id and score.action_id = ad.action_id;


-- La vue utilisée par le client qui regroupe tout les types de preuves.
create or replace view preuve
as
-- Les preuves complémentaires.
select -- champs communs
       'complementaire':: preuve_type              as preuve_type,
       pc.id,
       pc.collectivite_id,
       fs.snippet                                  as fichier,
       pc.lien,
       pc.commentaire,
       pc.modified_at                              as created_at,
       pc.modified_by                              as created_by,
       utilisateur.modified_by_nom(pc.modified_by) as created_by_nom,
       snippet.snippet                             as action,
       null:: jsonb                                as preuve_reglementaire,
       null:: jsonb                                as demande,
       null:: jsonb                                as rapport
from preuve_complementaire pc
         left join labellisation.bibliotheque_fichier_snippet fs
                   on fs.id = pc.fichier_id
         left join labellisation.action_snippet snippet
                   on snippet.action_id = pc.action_id
                       and snippet.collectivite_id = pc.collectivite_id
union all

-- Toutes les preuves réglementaires par collectivité, avec ou sans fichier.
select 'reglementaire',
       pr.id,
       c.id,
       fs.snippet,
       pr.lien,
       pr.commentaire,
       pr.modified_at,
       pr.modified_by,
       utilisateur.modified_by_nom(pr.modified_by),
       null,
       (select jsonb_build_object(
                       'id', prd.id,
                       'nom', prd.nom,
                       'description', prd.description)),
       null,
       null
from collectivite c -- toutes les collectivités ...
         left join preuve_reglementaire_definition prd on true -- ... x toutes les preuves réglementaires
         left join preuve_reglementaire pr on prd.id = pr.preuve_id
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = pr.fichier_id
union all

select 'labellisation',
       p.id,
       d.collectivite_id,
       fs.snippet,
       p.lien,
       p.commentaire,
       p.modified_at,
       p.modified_by,
       utilisateur.modified_by_nom(p.modified_by),
       null,
       null,
       (select jsonb_build_object(
                       'en_cours', d.en_cours,
                       'referentiel', d.referentiel,
                       'etoiles', d.etoiles,
                       'date', d.date,
                       'id', d.id
                   )),
       null


from labellisation.demande d
         left join preuve_labellisation p on p.demande_id = d.id
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id

union all
select 'rapport',
       p.id,
       p.collectivite_id,
       fs.snippet,
       p.lien,
       p.commentaire,
       p.modified_at,
       p.modified_by,
       utilisateur.modified_by_nom(p.modified_by),
       null,
       null,
       null,
       jsonb_build_object('date', p.date)
from preuve_rapport p
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id
;

-- Mets à jour la fonction critère fichier.
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
       count(pd.fichier_id),
       count(pd.fichier_id) > 0
from ref r
         left join lateral (select *
                            from labellisation.demande ld
                            where ld.referentiel = r.referentiel
                              and ld.collectivite_id = critere_fichier.collectivite_id) ld on true
         left join preuve_labellisation pd on ld.id = pd.demande_id
group by r.referentiel;
$$ language sql;

COMMIT;
