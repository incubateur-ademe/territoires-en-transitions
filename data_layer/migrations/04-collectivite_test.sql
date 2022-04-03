drop trigger before_commune_write on commune;
drop trigger before_epci_write on epci;
drop function before_epci_write_create_collectivite;

-- then execute 12-collectivite.sql
--- l 47:61
--- l 82:134

-- then execute 21-retool.sql to exclude from retool active collectivité
--- l 67:74

-- then execute 13-droits.sql to exclude from active_collectivite
--- l 104:114

-- then execute 23-stats.sql to exclude from stats
--- l 1:18
