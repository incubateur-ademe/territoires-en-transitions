-- Revert tet:demarche/pcaet_diagnostic_drop_referentiel_tables from pg
-- Note: le référentiel seedé n'est pas reconstruit ici. Pour le retrouver,
-- redéployer demarche/pcaet_diagnostic (+ ordre réglementaire) sur une base
-- neuve. Ce revert ne sert qu'à débloquer un sqitch revert local.

BEGIN;

-- Les tables étaient créées par demarche/pcaet_diagnostic ; un vrai revert
-- nécessiterait de rejouer ce deploy. On laisse volontairement vide pour
-- forcer une réinitialisation de base plutôt qu'un schéma partiel incorrect.

COMMIT;
