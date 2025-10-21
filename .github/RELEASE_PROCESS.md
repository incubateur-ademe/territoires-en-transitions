# Processus de Release Automatisé

Ce document décrit le processus de release automatisé basé sur les labels des Pull Requests.

## 🚀 Workflow

### 1. Création d'une PR

- Le développeur crée une Pull Request
- Il ajoute le label approprié (`major`, `minor`, ou `patch`) selon le type de changement

### 2. Review et Merge

- La PR est reviewée et approuvée
- La PR est mergée sur `main`

### 3. Release Automatique

Le workflow GitHub Actions s'exécute automatiquement et :

- Détermine le bump de version basé sur les labels des PRs mergées
- Met à jour la version dans tous les `package.json`
- Crée un tag Git
- Crée une release GitHub avec un changelog automatique
- Déploie le tag sur l'environnement de staging

## 🏷️ Labels de Versioning

### Labels Principaux

- **`major`** : Changements breaking (bump version majeure)

  - Changements d'API incompatibles
  - Suppression de fonctionnalités
  - Changements de base de données majeurs

- **`minor`** : Nouvelles fonctionnalités (bump version mineure)

  - Ajout de nouvelles fonctionnalités
  - Améliorations non-breaking
  - Nouvelles routes API

- **`patch`** : Corrections de bugs (bump version patch)
  - Corrections de bugs
  - Améliorations de performance mineures
  - Corrections de sécurité

### Labels Optionnels

- `breaking-change` : Changements breaking qui nécessitent une migration
- `enhancement` : Nouvelles fonctionnalités et améliorations
- `bug` : Corrections de bugs
- `documentation` : Mises à jour de documentation
- `chore` : Tâches de maintenance
- `security` : Corrections de sécurité

## 📋 Règles de Bump de Version

### Priorité des Labels

1. **`major`** : Override tous les autres labels
2. **`minor`** : Override `patch` mais pas `major`
3. **`patch`** : Niveau le plus bas

### Exemple

Si plusieurs PRs sont mergées ensemble :

- PR #1 avec label `patch`
- PR #2 avec label `minor`
- PR #3 avec label `patch`

→ Le bump sera **`minor`** (le plus haut niveau)

## 🔧 Configuration

### Labels GitHub

Les labels sont configurés automatiquement via le workflow `.github/workflows/setup-labels.yml`

### Workflow de Release

Le workflow principal est dans `.github/workflows/release.yml`

### Template de PR

Utilisez le template `.github/pull_request_template.md` pour vos PRs

## 📝 Changelog Automatique

Le changelog est généré automatiquement avec :

- **🚨 Breaking Changes** : PRs avec label `major`
- **✨ New Features** : PRs avec label `minor`
- **🐛 Bug Fixes** : PRs avec label `patch`

Chaque entrée inclut :

- Le titre de la PR
- Un lien vers la PR
- Une icône selon le type de changement

## 🚀 Déploiement

### Staging

- Déploiement automatique sur staging à chaque release
- Utilise le tag Git créé

### Production

- Déploiement manuel depuis la release GitHub
- Validation manuelle requise

## 🔍 Monitoring

### Vérification des Releases

- Vérifiez les releases dans l'onglet "Releases" de GitHub
- Consultez les logs du workflow dans l'onglet "Actions"

### Debugging

Si une release ne se déclenche pas :

1. Vérifiez que les PRs ont bien les bons labels
2. Consultez les logs du workflow `determine-version`
3. Vérifiez que les commits sont bien des merges de PRs

## 📚 Ressources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
