-- Vues
create materialized view confidentialite_tables_a_tester as
select table_name as element
from information_schema.tables
where table_schema = 'public'
  and table_name not like 'test_%'
  and table_name not like 'confidentialite_%'
  and table_type = 'BASE TABLE'
order by table_name;
comment on materialized view confidentialite_tables_a_tester is 'Liste des tables à tester';

create materialized view confidentialite_fonctions_a_tester as
select routine_name as element
from information_schema.routines
where routine_schema = 'public'
  and routine_definition is not null
  and data_type != 'trigger'
  and routine_name not like 'test_%'
  and routine_name not like 'confidentialite_%'
  and routine_name != 'fiche_resume' and routine_name != 'geojson' -- fonction en doublon
order by routine_name;
comment on materialized view confidentialite_fonctions_a_tester is 'Liste des fonctions à tester';

create materialized view confidentialite_vues_a_tester as
select table_name as element, is_trigger_insertable_into as c, is_trigger_updatable as u, is_trigger_deletable as d
from information_schema.views
where table_schema = 'public'
  and table_name not like 'test_%'
  and table_name not like 'confidentialite_%'
  and table_name not like 'stats_%'
  and view_definition is not null
order by table_name;
comment on materialized view confidentialite_vues_a_tester is 'Liste des vues à tester';

create materialized view confidentialite_tables_colonnes as
select table_name as element, column_name as colonne,
       case when data_type = 'USER-DEFINED' then udt_name else data_type end as type
from information_schema.columns
where table_schema = 'public'
  and is_nullable = 'NO' and column_default is null;
comment on materialized view confidentialite_tables_colonnes
    is 'Liste des colonnes essentielles pour chaque table à tester';

create materialized view confidentialite_vues_colonnes as
select isc.table_name as element, isc.column_name as colonne,
       case when isc.data_type = 'USER-DEFINED' then isc.udt_name else isc.data_type end as type
from information_schema.columns isc
         join information_schema.views isv on isv.table_name = isc.table_name and isv.table_schema = isc.table_schema
where isc.table_schema = 'public';
comment on materialized view confidentialite_vues_colonnes
    is 'Liste des colonnes essentielles pour chaque vue à tester';

create materialized view confidentialite_fonctions_parametres as
select r.routine_name as element,
       p.parameter_name as colonne,
       case when p.data_type = 'USER-DEFINED' then p.udt_name else p.data_type end as type
from information_schema.routines r
         join information_schema.parameters p on r.specific_name = p.specific_name
where r.routine_schema = 'public'
  and r.routine_definition is not null
  and p.parameter_mode = 'IN';
comment on materialized view confidentialite_fonctions_parametres
    is 'Liste des paramètres essentiels pour chaque fonction à tester';

create materialized view confidentialite_types_enum as
select pt.typname as type_nom, min(pe.enumlabel) as enum_nom
from pg_enum pe
         join pg_type pt on pe.enumtypid = pt.oid
group by pt.typname;
comment on materialized view confidentialite_types_enum is 'Liste des enums';

create materialized view confidentialite_cle_primaire_compose as
select table_name
from information_schema.key_column_usage
where table_schema = 'public'
  and constraint_name like '%_pkey'
group by table_name
having count(constraint_name)>1;
comment on materialized view confidentialite_cle_primaire_compose
    is 'Liste des tables ayant une clé primaire composé.
    Ces tables nécessitent d''être reset dans les tests après un insert pour éviter les conflits';