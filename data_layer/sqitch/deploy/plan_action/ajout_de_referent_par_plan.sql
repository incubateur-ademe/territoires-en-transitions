-- Deploy tet:ajout_de_referent_par_plan to pg

BEGIN;

-- Create plan_referent table
CREATE TABLE plan_referent (
    plan_id INTEGER NOT NULL,
    tag_id INTEGER,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    CONSTRAINT plan_referent_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES axe(id) ON DELETE CASCADE,
    CONSTRAINT plan_referent_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES personne_tag(id) ON DELETE CASCADE,
    CONSTRAINT plan_referent_user_id_fkey FOREIGN KEY (user_id) REFERENCES dcp(user_id) ON DELETE CASCADE
);

-- Create unique index on plan_id, user_id, and tag_id
CREATE UNIQUE INDEX plan_referent_axe_id_user_id_tag_id_key ON plan_referent (plan_id, user_id, tag_id);

-- Create function to get collectivity ID from axe
CREATE FUNCTION private.axe_collectivite_id(axe_id integer) RETURNS integer AS $$
    SELECT collectivite_id FROM axe WHERE id = axe_id;
$$ LANGUAGE sql STABLE;
COMMENT ON FUNCTION private.axe_collectivite_id(integer) IS 'Renvoie la collectivité d''un axe à partir de son id';

-- Enable row level security
ALTER TABLE plan_referent ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY allow_insert ON plan_referent
    FOR INSERT
    WITH CHECK (have_edition_acces(
        private.axe_collectivite_id(plan_id)
    ));

CREATE POLICY allow_read ON plan_referent
    FOR SELECT
    USING (can_read_acces_restreint(
        private.axe_collectivite_id(plan_id)
    ));

CREATE POLICY allow_update ON plan_referent
    FOR UPDATE
    USING (have_edition_acces(
        private.axe_collectivite_id(plan_id)
    ));

CREATE POLICY allow_delete ON plan_referent
    FOR DELETE
    USING (have_edition_acces(
        private.axe_collectivite_id(plan_id)
    ));

COMMIT;
