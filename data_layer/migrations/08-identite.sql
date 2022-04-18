-- Create tables.
--- 01-import.sql: l10 - l45

-- Import data.
--- 01-region.sql
--- 02-departement.sql
--- 03-commune.sql
--- 04-banatic.sql

-- Add type syndicat.
alter type type_collectivite add value 'syndicat' after 'commune';

-- Create and update views.
--- 27-caracteristiques.sql
