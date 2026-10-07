-- Deploy tet:utilisateur/dcp_email_lower_index to pg
-- requires: utilisateur/dcp

-- Retrouver un compte par son adresse.
--
-- `dcp` n'avait aucun index sur `email` : seule la clé primaire sur `user_id`
-- existait. Chaque invitation parcourait donc la table entière, et l'import des
-- correspondants le fait pour chaque ligne d'un fichier.
--
-- L'index porte sur `lower(email)` parce que c'est ainsi que la comparaison se
-- fait : `dcp` hérite son adresse de `auth.users` et rien n'y garantit la casse,
-- alors que les adresses saisies sont normalisées.
--
-- Pas d'unicité : deux comptes ont pu naître avec la même adresse à des casses
-- différentes, et ce n'est pas ce change qui doit trancher ce ménage.

BEGIN;

CREATE INDEX dcp_email_lower_idx ON public.dcp (lower(email));

COMMENT ON INDEX public.dcp_email_lower_idx IS 'Rapprochement d''un compte par son adresse, insensible à la casse (invitations, import des correspondants).';

COMMIT;
