# Validation du découpage — 30 septembre 2026

Chaîne vérifiée : réparations #5220 → schéma additif → backend annuel #5214 →
activation #5215. Les trois premières étapes ont été rebasées sur `main`
`742a9b36f0780041b896344b7edea9afe8e17d88`.

## Contrôles réalisés

Tests exécutés sur PostgreSQL 15 isolé et bases jetables, sans données de production.
Le schéma métier vide provient de la sauvegarde de schéma du 29 septembre, complété
par les migrations récentes de typologie SINOE et de suppression des RPC du site.
Les extensions réseau/chiffrement inutilisées par les scénarios ont été omises ;
les rôles, droits nécessaires aux fixtures et vues matérialisées vides ont été préparés.

| Contrôle | Résultat |
| --- | --- |
| Réparations de dates : vrais deploy/verify/revert, refus et archives | 55 assertions pgTAP |
| Schéma compatible : défauts, anciens upserts, droits, dates, revert | 18 assertions pgTAP |
| Correction de formule déplacée vers #5214 | 27 assertions pgTAP |
| Réservation des écritures au backend et retour exact des ACL | 38 assertions pgTAP |
| Cycle SQL complet, concurrence, audit, contraintes et retours arrière | Script `periodicite-migration-lifecycle.sh` réussi |
| Compatibilité de restauration : deux scripts × trois sources × trois cibles | 18 cas réels réussis avec archives synthétiques |
| Backend historique, avant puis après le schéma | Insertion, upsert par date, édition par identifiant, lecture, suppression réussis dans les deux états |
| Backend annuel : autorisations REST et mise à jour de définition | 43 tests réussis |
| Backend annuel : endpoints publics du site | 6 tests réussis |
| Tests unitaires ciblés indicateurs, PCAET, scores et permissions | 338 tests / 57 fichiers réussis |
| TypeScript backend application et tests | Réussi après régénération des dépendances |
| Gardes shell de restauration | Réussi |

Le scénario du backend historique vérifie notamment un résultat nul (`0`), un
objectif effacé (`NULL`), la conservation de l'identifiant lors d'un upsert et
une date au 1er mars : le schéma seul ne la normalise pas. La normalisation au
1er janvier appartient à la bascule backend. Les vrais fichiers SQL sont exécutés ;
le lanceur pgTAP local utilise `psql` et le parseur Perl TAP disponible sur ce poste.

Les tests API utilisent Redis et PostgreSQL dédiés, des identifiants factices et
un faux fournisseur LLM qui interdit tout appel externe. Aucun import de catalogue
externe ni appel à un modèle payant n'a été effectué.

## Limites et conditions de déploiement

Cette vérification ne mesure pas les verrous ni la durée de construction des index
sur le volume de production. Les chiffres et anomalies du 29 septembre restent
historiques : aucune nouvelle restauration de production n'a été faite pour ce
découpage. Répéter les contrôles sur une sauvegarde récente avant déploiement.

Les migrations de schéma nécessitent une courte suspension des écritures pour leurs
verrous DDL. La bascule #5214 nécessite l'arrêt des anciens producteurs jusqu'à la
mise en service du backend compatible. Les contrôles bloquent les collisions apparues
entre les livraisons ; ils ne décident pas à la place du métier quelle valeur garder.

Les protections des saisies manuelles restent dans #5214. La correction de formule
les accompagne et n'effectue aucun recalcul SQL. L'automatisation du catalogue doit
utiliser les endpoints authentifiés documentés dans le runbook avant sa reprise.

Les résultats ci-dessus portent sur le découpage et les scénarios indiqués ; ils
ne constituent ni une répétition de production ni une approbation de review complète.
