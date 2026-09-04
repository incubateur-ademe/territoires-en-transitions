---
title: 'Phase 3 — Reporting ADEME'
parent: ./README.md
kind: phase
phase: 3
---

# Phase 3 — Reporting ADEME

[← Index](README.md)

Restitution multi-collectivités : complétude et progression par territoire, engagement et
géographie, sous permission dédiée, puis POC avant décision de surface.

**Prérequis** : formules complétude/progression validées ; valeurs datées + catalogue (Phases 1-2).

## Task 3.1 — Contrat de reporting

**Complétude** (formule à figer) :

```text
périodes attendues et renseignées / périodes attendues et applicables
```

À définir : première période attendue ; mois courant attendu ou seulement mois clos ; délai de
grâce ; `resultat` seul ou objectif aussi ; quelles sources comptent ; indicateur inactif ;
applicabilité en cours de campagne. Absence = `null`, `0` = renseigné.

**Progression** : pas de formule générique. Selon l'indicateur : somme de flux / dernière valeur
de stock / ratio num-dénom / moyenne pondérée / jalon / aucune. Règle portée par le catalogue,
testée par indicateur. **Jamais** de moyenne simple de % sans dénominateur.

## Task 3.2 — API agrégée + permissions

- requêtes multi-collectivités **serveur** (le navigateur ne lance pas une requête par lauréat) ;
- filtres campagne/engagement/indicateur/période/département/région ;
- totaux régionaux/nationaux calculés à la lecture, **jamais persistés** comme valeurs d'indicateur ;
- permission métier dédiée ; tests de cloisonnement et confidentialité ;
- vérifier le plan d'exécution, index justifiés uniquement (collectivité, indicateur, date).

## Task 3.3 — POC puis décision de surface

- extract serveur **authentifié** pour Streamlit — jamais d'accès direct à la base, colonnes et
  collectivités filtrées par permission ;
- valider avec l'ADEME, puis panel de lauréats après levée d'embargo/autorisation ;
- vue TeT seulement si le POC confirme les usages ; heatmap seulement si métrique validée.

Si état soumis à historiser (revue ADEME à date fixe) : snapshot type diagnostic PCAET. Sinon,
assumer que le reporting montre l'état courant.
