-- Deploy tet:referentiel/justification_ajustement to pg

BEGIN;

-- Desactivate triggers
ALTER TABLE action_commentaire DISABLE TRIGGER save_history;
ALTER TABLE action_commentaire DISABLE TRIGGER set_modified_at_before_action_commentaire_update;

-- Insert new rows into action_commentaire or update existing rows
INSERT INTO action_commentaire (collectivite_id, action_id, commentaire, modified_by, modified_at)
SELECT
  ja.collectivite_id,
  ja.action_id,
  ja.texte AS commentaire,
  ja.modified_by,
  ja.modified_at
FROM
  justification_ajustement ja
ON CONFLICT (collectivite_id, action_id)
DO UPDATE
SET
  commentaire = action_commentaire.commentaire || '
–
' || EXCLUDED.commentaire,
  modified_by = CASE
    WHEN action_commentaire.modified_at > EXCLUDED.modified_at THEN action_commentaire.modified_by
    ELSE EXCLUDED.modified_by
  END,
  modified_at = CASE
    WHEN action_commentaire.modified_at > EXCLUDED.modified_at THEN action_commentaire.modified_at
    ELSE EXCLUDED.modified_at
  END
  ;

-- Re-enable triggers after the modifications
ALTER TABLE action_commentaire ENABLE TRIGGER save_history;
ALTER TABLE action_commentaire ENABLE TRIGGER set_modified_at_before_action_commentaire_update;

-- For a later migration once validated: drop the justification_ajustement table and its triggers

-- drop table justification_ajustement;
-- drop trigger if exists modified_at on justification_ajustement;
-- drop trigger if exists modified_by on justification_ajustement;

-- drop trigger if exists save_history on justification_ajustement;
-- drop function if exists historique.save_justification_ajustement();
-- drop table historique.justification_ajustement;

COMMIT;
