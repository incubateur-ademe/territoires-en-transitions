-- Deploy tet:referentiel/referentiel to pg

BEGIN;

ALTER TYPE referentiel ADD VALUE IF NOT EXISTS 'te';
ALTER TYPE referentiel ADD VALUE IF NOT EXISTS 'te-test';

-- Create the referentiels table. use referentiels instead of referentiel to avoid conflict with enum
create table referentiel_definition
(
    id              varchar(30) primary key,
    nom             varchar(300) not null,
    version         varchar(16) not null default '1.0.0', -- Semver
    hierarchie      action_type ARRAY NOT NULL,
    created_at      timestamp with time zone default CURRENT_TIMESTAMP not null,
    modified_at     timestamp with time zone default CURRENT_TIMESTAMP not null
);
comment on table referentiel_definition is
    'Les référentiels de la plateforme';

insert into referentiel_definition (id, nom, version, hierarchie) values 
('cae', 'Climat Air Energie', '1.0.0', '{"referentiel", "axe", "sous-axe", "action", "sous-action", "tache"}'),
('eci', 'Économie Circulaire', '1.0.0', '{"referentiel", "axe", "action", "sous-action", "tache"}'),
('te', 'Transition Écologique', '0.1.0', '{"referentiel", "axe", "sous-axe", "action", "sous-action", "tache"}'),
('te-test', 'Transition Écologique', '0.1.0', '{"referentiel", "axe", "sous-axe", "action", "sous-action", "tache"}');

create trigger set_modified_at
    before update
    on referentiel_definition
    for each row
execute procedure update_modified_at();

alter table action_definition add column referentiel_id varchar(30);

UPDATE action_definition
SET referentiel_id = referentiel::text;

ALTER TABLE action_definition
    ALTER COLUMN referentiel_id SET NOT NULL;

alter table "public"."action_definition" 
add constraint "referentiel_id_fkey"
foreign key ("referentiel_id") 
references "public"."referentiel_definition" ("id") 
on delete restrict;

COMMIT;
