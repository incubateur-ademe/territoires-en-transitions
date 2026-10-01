-- Les dates antérieures et les ACL originales ne peuvent pas être inventées.
-- Bloquer AVANT tout revert de la pile, même sans valeurs non annuelles.
BEGIN;
DO $$
BEGIN
    RAISE EXCEPTION USING ERRCODE = '55000',
        MESSAGE = 'Le nettoyage des périodicités ferme le retour arrière Sqitch ; restaurer une sauvegarde complète avec les versions applicatives correspondantes, ou corriger en avant';
END $$;
ROLLBACK;
