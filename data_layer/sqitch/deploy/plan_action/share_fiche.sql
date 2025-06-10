-- Deploy territoires-en-transitions:plan_action/share_fiche to pg
-- requires: plan_action/fiche_action

BEGIN;

-- Create table for tracking shared fiche actions
CREATE TABLE fiche_action_sharing (
    fiche_id INTEGER NOT NULL REFERENCES fiche_action(id) ON DELETE CASCADE,
    collectivite_id INTEGER NOT NULL REFERENCES collectivite(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid default auth.uid() references auth.users,
    CONSTRAINT "fiche_action_sharing_fiche_id_collectivite_id_pkey" PRIMARY KEY("fiche_id","collectivite_id")
);

-- Add indexes for common queries
CREATE INDEX idx_fiche_action_sharing_fiche_id ON fiche_action_sharing(fiche_id);
CREATE INDEX idx_fiche_action_sharing_collectivite_id ON fiche_action_sharing(collectivite_id);

COMMIT;
