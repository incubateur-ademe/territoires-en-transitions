-- Verify tet:demarches/pcaet_avis_president_region on pg

BEGIN;

DO $$
BEGIN
    ASSERT (
        SELECT pg_get_constraintdef(oid) LIKE '%president_region%'
        FROM pg_constraint
        WHERE conname = 'demarche_pcaet_avis_au_titre_de_check'
    ), 'Le titre president_region doit être permis par la contrainte';

    -- Les arguments d'un trigger sont concaténés, séparés par des octets nuls :
    -- on cherche la liste des types permis telle qu'elle est passée.
    ASSERT (
        SELECT encode(tgargs, 'escape') LIKE '%dreal,region%'
        FROM pg_trigger
        WHERE tgname = 'check_emetteur'
          AND tgrelid = 'public.demarche_pcaet_avis'::regclass
    ), 'Le conseil régional doit être un émetteur permis';
END $$;

ROLLBACK;
