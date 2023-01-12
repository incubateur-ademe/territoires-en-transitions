begin;

select plan(6);

select isnt_empty('select * from imports.departement');
select isnt_empty('select * from imports.region');
select isnt_empty('select * from stats.iso_3166');

select is_empty(
               'select *
               from imports.departement d
                    left join stats.iso_3166 i on i.nom = d.libelle
               where i is null;',
               'On devrait pouvoir rapprocher tout les départements des codes ISO.');
select is_empty(
               'select *
               from imports.region r
                    left join stats.iso_3166 i on i.nom = r.libelle
               where i is null;',
               'On devrait pouvoir rapprocher toutes les régions des codes ISO.');

select function_returns('stats', 'refresh_views', 'void', 'La fonction stats.refresh devrait renvoyer void');

-- appel la fonction pour vérifier qu'elle ne crashe pas
select stats.refresh_views();

rollback;
