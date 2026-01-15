-- Deploy tet:ajout_created_columns_tags to pg

BEGIN;

ALTER TABLE financeur_tag
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN created_by UUID REFERENCES dcp(user_id) ON DELETE SET NULL DEFAULT auth.uid();

ALTER TABLE partenaire_tag
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN created_by UUID REFERENCES dcp(user_id) ON DELETE SET NULL DEFAULT auth.uid();

ALTER TABLE service_tag
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN created_by UUID REFERENCES dcp(user_id) ON DELETE SET NULL DEFAULT auth.uid();

ALTER TABLE structure_tag
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN created_by UUID REFERENCES dcp(user_id) ON DELETE SET NULL DEFAULT auth.uid();

ALTER TABLE personne_tag
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN created_by UUID REFERENCES dcp(user_id) ON DELETE SET NULL DEFAULT auth.uid();

ALTER TABLE instance_de_gouvernance_tag
  DROP CONSTRAINT IF EXISTS instance_de_gouvernance_tag_created_by_fkey;
ALTER TABLE instance_de_gouvernance_tag
  ADD CONSTRAINT instance_de_gouvernance_tag_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES dcp(user_id) ON DELETE SET NULL;

COMMIT;

