-- Deploy tet:ajout_de_pilote_par_plan to pg

BEGIN;

-- Create plan_pilote table
CREATE TABLE plan_pilote (
    plan_id INTEGER NOT NULL,
    tag_id INTEGER,
    user_id UUID,
    CONSTRAINT plan_pilote_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES axe(id) ON DELETE CASCADE,
    CONSTRAINT plan_pilote_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES personne_tag(id) ON DELETE CASCADE,
    CONSTRAINT plan_pilote_user_id_fkey FOREIGN KEY (user_id) REFERENCES dcp(user_id) ON DELETE CASCADE
);

-- Create unique index on plan_id, user_id, and tag_id
CREATE UNIQUE INDEX plan_pilote_axe_id_user_id_tag_id_key ON plan_pilote (plan_id, user_id, tag_id);

-- Enable row level security
ALTER TABLE plan_pilote ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY allow_insert ON plan_pilote
    FOR INSERT
    WITH CHECK (have_edition_acces(
        private.axe_collectivite_id(plan_id)
    ));

CREATE POLICY allow_read ON plan_pilote
    FOR SELECT
    USING (can_read_acces_restreint(
        private.axe_collectivite_id(plan_id)
    ));

CREATE POLICY allow_update ON plan_pilote
    FOR UPDATE
    USING (have_edition_acces(
        private.axe_collectivite_id(plan_id)
    ));

CREATE POLICY allow_delete ON plan_pilote
    FOR DELETE
    USING (have_edition_acces(
        private.axe_collectivite_id(plan_id)
    ));

COMMIT; 