BEGIN;

CREATE TABLE instance_de_gouvernance (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,    
    collectivite_id INTEGER NOT NULL REFERENCES collectivite(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nom, collectivite_id)

);

CREATE INDEX idx_instance_de_gouvernance_collectivite_id ON instance_de_gouvernance(collectivite_id);

CREATE TABLE fiche_action_instance_de_gouvernance (
    fiche_action_id INTEGER NOT NULL REFERENCES fiche_action(id),
    instance_de_gouvernance_id INTEGER NOT NULL REFERENCES instance_de_gouvernance(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (fiche_action_id, instance_de_gouvernance_id)
);

CREATE INDEX idx_fiche_action_instance_de_gouvernance_fiche_action_id ON fiche_action_instance_de_gouvernance(fiche_action_id);
CREATE INDEX idx_fiche_action_instance_de_gouvernance_instance_de_gouvernance_id ON fiche_action_instance_de_gouvernance(instance_de_gouvernance_id);

COMMIT;
