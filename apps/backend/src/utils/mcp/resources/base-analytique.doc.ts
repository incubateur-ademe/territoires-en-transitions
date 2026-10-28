// Documentation des tables de statistiques de la base analytique, reprise
// telle quelle du dashboard de Baptiste (BaptisteTCS/dashboard_tet,
// data/bdd_olap.md). À mettre à jour quand la base change : elle est servie
// au modèle comme ressource MCP `tet://docs/base-analytique`.

export const BASE_ANALYTIQUE_DOC = `# Documentation Base de données OLAP - Territoires en Transitions

> Base de données analytique alimentée quotidiennement depuis la base de production via Datalore. Contient l'ensemble des métriques, agrégations et exports pour les dashboards internes, statistiques publiques et partenaires externes.

---

## Tables Principales

### Activité & Engagement

#### \`feature_all\`
**Description :** Donne l'utilisation de toutes les features de l'app (plan, action, export, indicateurs, etc). Il y a autant de lignes par [mois,collectivite_id,email] que l'user a utlisé la feature ce mois-ci.

#### \`activite_semaine\`
**Description :** Source de vérité pour mesurer l'utilisation de l'application. Trace l'activité hebdomadaire par collectivité et par utilisateur.

**Contenu :**
- Activité hebdomadaire par collectivité et utilisateur : par (semaine/collectivite_id) il y a un email si la personne a visité l'app
- Exclut : utilisateurs internes, conseillers, BE (partenaires), adresses @ademe.fr
- Inclut : détection des modifications côté application (contourne les ad-blockers Posthog)

**Calculé dans :** [OKRs > L-2](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**Utilisé pour :** Dashboard OKRs, stats publiques.

---

#### \`user_actif_12_mois\`
**Description :** Agrégation mensuelle des utilisateurs actifs à 12 mois, dérivée de \`activite_semaine\`. Pour chaque mois, on regarde ce mois et les 11 précédents et on compte le nombre de distinct email dans \`activite_semaine\`.

**Calculé dans :** [OKRs > L-2](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**Utilisé pour :** Dashboard OKRs, stats publiques.

---

#### \`user_actifs_ct_mois\`
**Description :** Liste des utilisateurs actifs par collectivité et par mois. ⚠️ Inclut les BE et conseillers (contrairement à \`activite_semaine\`). C'est à utiliser quand on veut les stats globales de fréquentation (tous les utilisateurs) mais pas dans la plupart des cas quand on veut juste les utilisateurs des collectivités (agents)

**Calculé dans :** [Stats > User actifs](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

**Utilisé pour :** Dahsboard okrs, stats publiques.

---

### Collectivités

#### \`ct_actives\`
**Description :** Table des collectivités activées avec métadonnées enrichies. Utile pour les stats notamment avec la colonne catégorie qui es pertinente. Cette table n'est uniquement à utiliser pour faire des croisements et/ou quand on parle d'activation. Pour l'activité, c'est activite_semaine à utiliser.

**Contenu :**
- Date d'activation : première attribution d'un membre (hors BE/partenaires/conseillers)
- Catégorisation : EPCI, Syndicats, Communes, Départements, Régions
- ⚠️ Peut inclure des collectivités ayant uniquement des conseillers/BE si fonction non renseignée

**Calculé dans :** [Stats > Date activation](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

**Utilisé pour :** Stat publiques.

---

#### \`collectivite\`
**Description :** Export de la table collectivités pour l'ADEME via Metabase. Contient toutes les info nécessaires sur les collectivités. Sauf cas spécifique, pour les stats on préfère utiliser ct_actives pour directement avoir les ct activés.

**Calculé dans :** [Export TET → Ademe > Collectivités](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

**Utilisé pour :** Export ADEME

---

#### \`internal_users\`
**Description :** Liste des emails des utilisateurs internes TET, utilisée pour filtrer les stats.

**Usage :** Filtrage systématique dans toutes les métriques publiques/clients

---

### Plans d'Action 

#### \`pap_date_passage\`
**Description :** 🔑 **Table critique** - Historique des dates de passage PAP (Plan d'Action Pilotable) pour chaque plan.

**Contenu :**
- Permet de déduire les collectivités PAP via \`SELECT DISTINCT collectivite_id\`

**Calculé dans :** [Calcul PAP & Score > Passage PAP](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/TUsBeh2ErVoeFgtptt9A8g/)

**Cas d'usage typique :** "Donne-moi les stats uniquement pour les collectivités PAP" → récupérer les ids depuis cette table

---

#### \`passage_pap_region\`
**Description :** Enrichissement de \`pap_date_passage\` avec région/département. Utilisée par les statistiques publiques.

**Calculé dans :** [Stats > Evolution pap region](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

**Différence avec \`pap_date_passage\` :** Ajoute la dimension géographique, version utilisée en front

---

#### \`plan_distrib\`
**Description :** Statut et caractéristiques des plans d'action.

**Contenu :**
- Statut "actif à 12 mois" (≥5 fiches modifiées dans les 12 derniers mois)
- Score > 5
- Plan pilotable (oui/non)
- Département et région

**Calculé dans :** [Stats > plan_distrib](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

---

#### \`pap_statut_5_fiches_modifiees_52_semaines\`
**Description :** 🌟 **North Star publique** - Plans avec ≥5 fiches pilotables modifiées dans les 52 dernières semaines.

**Calculé dans :** [OKRs > Activité fiche | A-1](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**Indicateur clé :** Mesure l'engagement actif des collectivités (critère public)

---

#### \`pap_statut_5_fiches_modifiees_13_semaines\`
**Description :** 🌟 **North Star interne** - Version 13 semaines de la métrique ci-dessus.

**Calculé dans :** [OKRs > Activité fiche | A-1](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**Indicateur clé :** Mesure l'engagement actif des collectivités (critère interne, plus exigeant)

---

### Scoring

#### \`pap_note\`
**Description :** Ancien système de notation des plans (échelle sur 5). ⚠️ En cours de migration vers le nouveau scoring sur 10.

**Calculé dans :** [Calcul PAP & Score > Score PAP](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/TUsBeh2ErVoeFgtptt9A8g/)

**Historisation :** \`pap_note_backup\` contient l'évolution temporelle

**Statut :** Encore utilisé par les dashboards Streamlit, migration à venir

---

#### \`pap_note_snapshot\`
**Description :** Snapshot actuel des notes (sans historique), version instantanée de \`pap_note\`.

**Calculé dans :** [Calcul PAP & Score > Score PAP](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/TUsBeh2ErVoeFgtptt9A8g/)

---

#### \`note_plan_historique\`
**Description :** Nouveau système de notation des plans (échelle sur 10), calculé comme moyenne des notes des actions.

**Calculé dans :** [OKRs > New pap note](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**Historisation :** \`note_plan_historique_backup\`

---

#### \`note_fiche_historique\`
**Description :** Nouveau système de notation des fiches d'action (échelle sur 10).

**Calculé dans :** [OKRs > New fiche note](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**Historisation :** \`note_fiche_historique_backup\`

---

#### \`pap_note_region\`
**Description :** ⚠️ Table obsolète - Ancien scoring associé aux régions/départements.

**Calculé dans :** [Stats > Evolution note region](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

**Statut :** Utilisé par dashboard interne, à faire évoluer

---

### Fiches d'Action

#### \`fa_distrib\`
**Description :** Distribution des fiches d'action par département/région et par mois (valeurs cumulées).

**Contenu :**
- Nombre d'actions
- Nombre d'actions pilotables
- Nombre d'actions pilotables actives
- Nombre d'actions réalisées

**Calculé dans :** [Stats > fa_distrib](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

**Terminologie front :** "action" = action pilotable, "action active" = action pilotable active

---

#### \`nb_fap_13\` / \`nb_fap_52\`
**Description :** Nombre de fiches d'action pilotables (FAP) actives sur 13/52 semaines.

**Calculé dans :** [OKRs > A-3](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**Note :** Redondant avec calcul A-1, à factoriser. Utilisé uniquement pour OKRs internes.

---

#### \`nb_fap_pilote_13\` / \`nb_fap_pilote_52\`
**Description :** Variante "pilotable" des tables ci-dessus.

**Calculé dans :** [OKRs > A-3](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

#### \`statut_fiche_13_semaines\` / \`statut_fiche_52_semaines\`
**Description :** Donne pour chaque mois le statut d'une fiche en prenant comme critère une modification sur les 13/52 dernières semaines

**Calculé dans :** [OKRs > Activité fiche | A-1](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

---

### Indicateurs

#### \`evolution_ind_pers\`
**Description :** Évolution mensuelle des indicateurs personnalisés par département/région.

**Contenu :**
- \`nb_ind_perso\` : nombre d'indicateurs personnalisés créés
- \`nb_ind_perso_ct\` : nombre de collectivités ayant créé des indicateurs personnalisés

**Calculé dans :** [Stats > evolution ind pers et od](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

---

#### \`evolution_ind_od\`
**Description :** Évolution mensuelle du nombre de valeurs OD (Objectif et Données) cumulées par département/région.

**Calculé dans :** [Stats > evolution ind pers et od](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

---

#### \`ind_od_producteur_indicateur\`
**Description :** Couples indicateurs/producteurs par département/région.

**Calculé dans :** [Stats > evolution ind pers et od](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

---

### Labellisation

#### \`labellisation\`
**Description :** Historique complet de toutes les labellisations.

**Usage :** Pour connaître le niveau d'étoiles actuel d'une collectivité → prendre la dernière valeur de \`etoiles\` pour le référentiel souhaité (\`cae\` ou \`eci\`)

**Calculé dans :** [Stats > labellisation_region](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

---

#### \`labellisation_region\`
**Description :** Enrichissement de \`labellisation\` avec données géographiques (région/département).

**Calculé dans :** [Stats > labellisation_region](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

**Recommandation :** Préférer cette table à \`evolution_labellisation\` et recalculer à la volée si nécessaire

---

#### \`labellisation_stock_evolution\`
**Description :** Évolution mensuelle du stock de collectivités par niveau d'étoiles, par département/région.

**Calculé dans :** [Stats > labellisation_stock_evolution](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/zDBnbKbrbzhC1RYZAKnhxB/)

---

#### \`evolution_labellisation\`
**Description :** Nombre de labellisations cumulées par mois.

**Calculé dans :** [OKRs > L-3](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**Recommandation :** Préférer \`labellisation_region\` et recalculer à la volée

---

### Statistiques Publiques

#### \`stats_hero_section_site\`
**Description :** Statistiques affichées dans la hero section de la landing page du site public.

**Calculé dans :** [OKRs > hero section stat public](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/Dz9DmMwquBQiWTJN0JKlCn/)

**⚠️ Ne pas modifier sans validation**

---

## 📤 Tables Export & Intégrations

### Export ADEME (via Metabase)

#### \`audit\`
**Description :** Export des données d'audit pour l'ADEME.

**Calculé dans :** [Export TET → Ademe > Audits](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

#### \`auditeur\`
**Description :** Export des données auditeurs pour l'ADEME.

**Calculé dans :** [Export TET → Ademe > Audits](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

#### \`visite_annuelle\`
**Description :** Export des visites annuelles pour l'ADEME.

**Calculé dans :** [Export TET → Ademe > Audits](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

#### \`cot\`
**Description :** Export COT (Conseiller en Organisation Territoriale) pour l'ADEME.

**Calculé dans :** [Export TET → Ademe > Collectivités](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

#### \`Score_mesures\`
**Description :** ⚠️ Attention à la casse (S majuscule) - Scores par mesure exportés vers l'ADEME.

**Calculé dans :** [Export TET → Ademe > Score mesures](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

#### \`score_snapshot\`
**Description :** Snapshot des scores pour l'ADEME.

**Calculé dans :** [Export TET → Ademe > Score snapshot](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

#### \`utilisateurs\`
**Description :** Export de la table utilisateurs pour l'ADEME.

**Calculé dans :** [Export TET → Ademe > Utilisateurs](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

#### \`utilisateurs_droits\`
**Description :** Export des droits utilisateurs pour l'ADEME.

**Calculé dans :** [Export TET → Ademe > Utilisateurs](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

### Synchro Airtable & stats bizdevs

#### \`airtable_sync\`
**Description :** Synchronisation quotidienne avec le CRM Airtable. Contient de nombreuses stats majeures par collectivité.

**Calculé dans :** [Airtable Sync > Envoi Airtable](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/D4qN6QMCVwFY39YFhLg3u2/)

---

#### \`airtable_sync_semaine\`
**Description :** Sauvegarde hebdomadaire de l'état de \`airtable_sync\`.

**Calculé dans :** [Airtable Sync > Envoi Airtable](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/D4qN6QMCVwFY39YFhLg3u2/)

---

#### \`bizdev_A_F_contact\`
**Description :** Contacts BizDev pour le tableau de bord commercial.

**Calculé dans :** [Airtable Sync > Airtable reach](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/D4qN6QMCVwFY39YFhLg3u2/)

---

#### \`bizdev_note_de_suivi_contact\`
**Description :** Notes de suivi des contacts BizDev.

**Calculé dans :** [Airtable Sync > Airtable reach](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/D4qN6QMCVwFY39YFhLg3u2/)

---

#### \`bizdev_contact_collectivite\`
**Description :** Mapping contacts BizDev ↔ collectivités.

**Calculé dans :** [Airtable Sync](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/D4qN6QMCVwFY39YFhLg3u2/)

---

#### \`calendly_events\`
**Description :** Événements Calendly pour le tableau de bord BizDev.

**Calculé dans :** [Airtable Sync > Calendly (events)](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/D4qN6QMCVwFY39YFhLg3u2/)

---

#### \`calendly_invitees\`
**Description :** Participants aux événements Calendly.

**Calculé dans :** [Airtable Sync > Calendly (invitees)](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/D4qN6QMCVwFY39YFhLg3u2/)

---

#### \`evenements_airtable\`
**Description :** Synchronisation événements Calendly → Airtable.

**Calculé dans :** [Airtable Sync > Calendly (events)](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/D4qN6QMCVwFY39YFhLg3u2/)

---

## 🔧 Tables Techniques & Versioning

#### \`feature\`
**Description :** Tracking des features mises en production (MEP).

**Calculé dans :** [MEPS](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/hyvTHBsHKmqrrcIzNm0UpY/) (tous les onglets alimentent cette table)
---

#### \`indicateurs_od\`
**Description :** Listing de tous les indicateurs disponibles en open data sur Territoires en Transitions.

**Calculé dans :** [Calcul PAP & Score > Indicateurs OD](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/TUsBeh2ErVoeFgtptt9A8g/)

#### \`fiche_action_plan\`
**Description :** Permet de faire le lien entre les id de fiche action (fiche_id) et les plans (plan)

**Calculé dans:** [Export TET → ADEME > fiche_action_plan](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

## 🗑️ Tables à Ignorer

#### \`action_referentiel\`
**Description :** Probablement utilisé par Power BI Benchmark. **À ignorer.**

---

#### \`tmp_backup_indicateur_source_metadonnee\`
**Description :** Backup du 13/04/2026 avant import données RARE. **À ignorer.**

---

#### \`tmp_backup_indicateur_valeur\`
**Description :** Backup du 13/04/2026 avant import données RARE. **À ignorer.**

---

#### \`indicateur_definition\`
**Description :** Définitions des indicateurs. Pourrait être utile à l'Ademe **À ignorer.**

**Calculé dans :** [Export TET → Ademe > Indicateurs](https://datalore.jetbrains.com/notebook/3z8wdKwizolR7wA321R4Rl/LhsccNs3HBiP4wnuv67kP7/)

---

#### \`indicateurs_valeurs_olap\`
**Description :** Utilisé par le module d'import des indicateurs Ecolab vers la prod. **À ignorer.**

---

#### \`mapping_levier_mesure\`
**Description :** Mapping leviers TE ↔ mesures référentiel pour l'outil de priorisation. **À ignorer.**

---

#### \`modelisation_impact\`
**Description :** Données pour l'outil de priorisation. **À ignorer.**

---

#### \`tr_comm\`
**Description :** Lien collectivités têtes ↔ format SIRET. **À ignorer.**

---

## 📖 Glossaire

| Terme | Définition |
|-------|------------|
| **PAP** | Plan d'Action Pilotable - Un plan d'action qui a au moins 5 fiches avec un titre, un statut, une personne ou service/direction pilote |
| **PAP actif 13/52 semaines** | Un plan d'action pilotable qui a eu au moins 5 fiches modifiées au cours des 13/52 dernières semaines |
| **FAP** | Fiche Action Pilotable - Une fiche action qui a au moins un titre, un statut et une personne ou service/direction pilote |
| **BE** | Bureau d'Études (partenaire en back sur l'app) |
| **CT** | Collectivité |
| **OD** | Open Data (indicateurs) |
| **CAE** | Climat-Air-Énergie (référentiel de labellisation) |
| **ECI** | Économie Circulaire (référentiel de labellisation) |
| **COT** | Contrat d'Objectif Territoriale |
| **North Star** | Métrique principale de succès de Territoires en Transitions |

---

## 🎯 Cas d'Usage Fréquents

### "Je veux uniquement les collectivités PAP"
\`\`\`sql
SELECT DISTINCT collectivite_id 
FROM pap_date_passage
\`\`\`

### "Quelles sont les collectivités actives sur les 3 derniers mois"
\`\`\`sql
SELECT distinct collectivite_id 
FROM activite_semaine
WHERE TO_DATE(semaine, 'YYYY-MM-DD') >= CURRENT_DATE - INTERVAL '3 months';
\`\`\`

### "Niveau de labellisation actuel des collectivités sur le référentiel cae"
\`\`\`sql
select collectivite_id, max(etoiles)
from labellisation l 
where referentiel ='cae'
group by collectivite_id 
\`\`\`

### "PAP actifs 52 semaines (North Star publique)"
\`\`\`sql
SELECT * FROM pap_statut_5_fiches_modifiees_52_semaines 
where mois= (select max(mois) from pap_statut_5_fiches_modifiees_52_semaines) 
and statut = 'actif'
\`\`\`

---

## ⚠️ Notes Importantes

1. **Filtrage systématique** : Toutes les stats excluent par défaut les utilisateurs internes et collectivités tests
2. **Casse importante** : \`Score_mesures\` (avec S majuscule)
`;
