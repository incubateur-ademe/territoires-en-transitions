-- Deploy tet:plan_action/fiches to pg

BEGIN;

--
-- 1. TAGS DE SUIVI LIBRES
CREATE TABLE libre_tag (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  collectivite_id INTEGER REFERENCES collectivite(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  UNIQUE(nom, collectivite_id)  -- Prevent duplicate tags within same collectivite
);

alter table libre_tag enable row level security;
create policy allow_read on libre_tag for select using(is_authenticated());
create policy allow_insert on libre_tag for insert with check(have_edition_acces(collectivite_id));
create policy allow_update on libre_tag for update using(have_edition_acces(collectivite_id));
create policy allow_delete on libre_tag for delete using(have_edition_acces(collectivite_id));

-- Junction table for the many-to-many relationship
create table fiche_action_libre_tag(
  fiche_action_id integer references fiche_action not null,
  libre_tag_id integer references libre_tag not null,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  primary key (fiche_action_id, libre_tag_id)
);

alter table fiche_action_libre_tag enable row level security;
create policy allow_read on fiche_action_libre_tag for select using(is_authenticated());
create policy allow_insert on fiche_action_libre_tag for insert with check(peut_modifier_la_fiche(fiche_action_id));
create policy allow_update on fiche_action_libre_tag for update using(peut_modifier_la_fiche(fiche_action_id));
create policy allow_delete on fiche_action_libre_tag for delete using(peut_modifier_la_fiche(fiche_action_id));

--
-- 2. INSTANCES DE GOUVERNANCE
alter table fiche_action add column instance_gouvernance text;

--
-- 3. PARTICIPATION CITOYENNE
alter table fiche_action add column participation_citoyenne text;
alter table fiche_action add column participation_citoyenne_type varchar(30);

--
-- 4. TEMPS DE MISE EN OEUVRE
alter table fiche_action add column temps_mise_en_oeuvre integer
REFERENCES action_impact_temps_de_mise_en_oeuvre(niveau);

COMMIT;

