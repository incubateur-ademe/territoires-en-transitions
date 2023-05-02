-- Deploy tet:retool/utilisateur to pg

BEGIN;

create function stats.export_utilisateurs_en_colonne_csv_text()
    returns text as $$
declare
    rank int;
    nb_user_max int;
    request text;
    column_list text;
    row_line text;
    to_return text;
begin
    -- Crée une table temporaire qui contient les données voulues des utilisateurs
    execute 'create temp table temp_users_col as
    select nc.collectivite_id,
                          nc.nom                           as collectivite_nom,
                          concat(dcp.prenom, '' '', dcp.nom) as identite,
                          dcp.email,
                          pud.niveau_acces,
                          pcm.fonction,
                          pcm.details_fonction,
                          au.last_sign_in_at               as derniere_connexion
                   from stats.collectivite nc
                            left join private_utilisateur_droit pud on nc.collectivite_id = pud.collectivite_id
                            join dcp on dcp.user_id = pud.user_id
                            join auth.users au on dcp.user_id = au.id
                            left join private_collectivite_membre pcm
                                      on pcm.user_id = pud.user_id and pcm.collectivite_id = nc.collectivite_id
                   where pud.active';

    -- Calcul le nombre d'utilisateur max pour une collectivité pour adapter le nombre de colonnes
    with nb_users_by_col as
             (select collectivite_id, count(email) as nb_user
              from temp_users_col group by collectivite_id)
    select max(nb_user) from nb_users_by_col into nb_user_max;

    -- Met les données au bon format dans une seconde table temporaire
    request = 'create temp table temp_result_users_col as select collectivite_id, collectivite_nom';
    for rank in 1..nb_user_max loop
            request = request || '
                      , max(case when rn = '||rank ||' then identite end) AS u'||rank ||'_identite
                      , max(case when rn = '||rank ||' then email end) AS u'||rank ||'_email
                      , max(case when rn = '||rank ||' then niveau_acces end) AS u'||rank ||'_niveau_acces
                      , max(case when rn = '||rank ||' then fonction end) AS u'||rank ||'_fonction
                      , max(case when rn = '||rank ||' then details_fonction end) AS u'||rank ||'_details_fonction
                      , max(case when rn = '||rank ||' then derniere_connexion end) AS u'||rank ||'_derniere_connexion';
        end loop;
    request = request || ' from (
             select *, row_number() over (partition by collectivite_id order by identite) as rn
             from temp_users_col
         ) subquery
    group by collectivite_id, collectivite_nom';

    execute request;

    -- Récupère l'en tête du csv à partir de la seconde table temporaire
    select string_agg(quote_ident(attname), ',')
    from pg_attribute
    where attrelid = 'temp_result_users_col'::regclass
      and attnum > 0
      and not attisdropped
    into column_list;

    to_return = column_list;

    -- Récupère les données du csv à partir de la seconde table temporaire
    for row_line in execute
        'select replace(
                    replace(
                        string_agg(quote_nullable(t.*), '',''), ''''''('', ''''),
                    '')'''''', ''''
                ) as row_data
        from (
            select ' || column_list || '
            from temp_result_users_col
        ) t
        group by collectivite_id'
        loop
            to_return = to_return || E'\n' || row_line;
        end loop;

    -- Supprimer les tables temporaires
    execute 'drop table if exists temp_result_users_col';
    execute 'drop table if exists temp_users_col';

    return to_return;
end;
$$ language plpgsql;

COMMIT;
