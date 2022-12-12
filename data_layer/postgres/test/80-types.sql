-- Créé des tables pour la génération de type, sans pour autant affecter la prod.
create table type_tabular_score of tabular_score;
alter table type_tabular_score enable row level security;
