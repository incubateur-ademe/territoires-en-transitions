// Modèle d'esquisse (pitch Shape Up) de l'équipe, servi au modèle comme
// ressource MCP `tet://docs/esquisse-modele`. Reprend la structure du gabarit
// Notion « [FORMALISATION] » (Cycles & Roadmap) et le dictionnaire français de
// Shape Up TeT. À faire évoluer quand le gabarit Notion change.
export const ESQUISSE_MODELE_DOC = `# Modèle d'esquisse (formalisation Shape Up)

Vocabulaire de l'équipe, à utiliser tel quel : **formalisation** (shape), **esquisse** (pitch), **appétit**, **fournée** (batch), **piège** (rabbit hole), **table des paris** (betting table), **pari**, **morceau** (slice), **colline** (hill chart), **décompression** (cool-down), **construction** (build).

Pendant la formalisation, le PS (product strategist) consulte à la demande des experts : métier, bizdev / support, designer, tech. L'esquisse est ajustée jusqu'à alignement ; elle peut repartir de zéro ou être abandonnée.

Rendre le texte en Markdown, dans cet ordre et avec ces titres, prêt à coller dans la page Notion. Supprimer les aides au remplissage. Ne rien inventer : un chiffre sans requête ou un retour utilisateur sans source n'a pas sa place ; l'écrire dans « Inconnues ».

---

## 🤔 Problème

Expression claire et concise du problème. Pas de solution ici, pas de « il faudrait ».

- Quel besoin n'est pas satisfait aujourd'hui ?
- Pour quel persona ? (auditeur·rice, conseiller·ère, pilote de plan, pilote d'action, élu·e, supra, ADEME, services déconcentrés, interne, administrés, partenaires externes)
- À quelle fréquence ?

#### Impact

S'appuyer si possible sur des valeurs d'indicateurs cibles pour mesurer l'impact.

| | |
| --- | --- |
| 🤩 Quel impact positif si on le résout ? | … |
| 😱 Quel impact négatif si on ne le résout pas ? | … |
| 🧭 Quel alignement avec la stratégie globale ? | … (objectifs 2026 : activation, rétention, qualité, impact, légitimité, performance budgétaire) |

#### Signaux

Quels signaux valident et justifient le traitement du problème ? Chaque signal cite sa source (retour Crisp, page Notion, requête).

| | |
| --- | --- |
| 💬 Retours utilisateurs | … |
| 📈 Stats d'usage | … (chiffres issus des outils, avec la requête en section Recherche) |
| 💡 Intention ou intuition stratégique interne | … |
| 🫡 Contrainte externe ou commande sponsor | … |

## 🍕 Appétit

L'appétit est l'investissement humain et budgétaire justifié pour ce problème. Ce n'est pas une estimation : c'est l'appétit qui guide vers une solution plutôt qu'une autre, et la solution doit s'y inscrire. Garder une seule ligne et la justifier.

| | |
| --- | --- |
| 🍪 Petite fournée (2 sem.) | … |
| 🎂 Grande fournée (6 sem.) | … |

(Les fournées existantes dans Notion : très petite 1 sem., petite 2 sem., moyenne 4 sem., grande 6 sem.)

## 💎 Solution

Texte, croquis au feutre épais, schéma. Volontairement rudimentaire : des rectangles, des flèches, des mots. Pas de maquette précise, pas de cahier des charges exhaustif. Décrire les morceaux qui peuvent se construire et se tester indépendamment.

## 🕳️ Pièges

Qu'est-ce qui pourrait faire échouer la construction dans le temps imparti ? Tous les pièges doivent être résolus avant la table des paris ; un piège non résolu impose de chercher une autre solution. Pièges classiques : dépendance à des livrables externes manquants, à des spécifications métier manquantes (formules, définitions d'indicateurs), interdépendance avec une autre esquisse. Existe-t-il des projets passés similaires sur lesquels s'appuyer ?

| | Piège | Pourquoi c'est un piège | Contournement |
| --- | --- | --- | --- |
| 🕳️ | … | … | … |

## 🙅‍♂️ Hors périmètre

Tout ce que la solution ne sera ou ne fera pas. Frontière explicite pour clarifier l'attendu et sécuriser la construction, souvent alimentée par les pièges. Pas de « sauf si on a le temps ».

---

## 🔎 Recherche

Pour chaque chiffre cité plus haut : la question, l'outil utilisé, la requête exacte (SQL ou HogQL) et le résultat brut, pour qu'un lecteur puisse la rejouer. Puis les précédents consultés (esquisses, rétros, retours de table des paris) avec leur lien.

## ❓ Inconnues

Ce qui n'a pas pu être établi : chiffres non obtenus, hypothèses à valider, expert à consulter (métier, bizdev / support, designer, tech).
`;
