-- Deploy tet:plan_action/add_report_generation_table to pg

BEGIN;

-- Create plan_report_generation table
CREATE TABLE plan_report_generation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id INTEGER NOT NULL,
    template_ref TEXT NOT NULL,
    file_id INTEGER,
    options JSONB,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT plan_report_generation_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES axe(id) ON DELETE CASCADE,
    CONSTRAINT plan_report_generation_file_id_fkey FOREIGN KEY (file_id) REFERENCES labellisation.bibliotheque_fichier(id) ON DELETE CASCADE
);

-- Enable row level security
ALTER TABLE plan_report_generation ENABLE ROW LEVEL SECURITY;

COMMIT;
