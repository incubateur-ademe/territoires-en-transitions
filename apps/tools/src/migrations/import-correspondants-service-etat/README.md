# Import des correspondants d'un service de l'État

Rattache les correspondants d'un fichier au service qu'ils représentent et leur
écrit **une fois**. Sert les six familles : DREAL, conseils régionaux, DDT,
DR ADEME, ADEME siège, DGEC.

Les fichiers vivent dans `data_layer/seed/sources/service-etat/contacts/`, dont
le README décrit le format. Ajouter une famille, c'est y déposer un CSV.

## En staging et en production : le workflow

L'import se joue depuis GitHub, onglet **Actions → Import des correspondants de
service → Run workflow**. Rien à lancer sur le serveur : le script est un client
de l'API, et le workflow le fait tourner sur un runner avec la clé de service
prise dans les secrets de l'environnement — elle ne transite jamais par un poste.

Trois champs : l'environnement, votre adresse, et le mode — le chemin a une
valeur par défaut qui couvre tout le dossier `contacts/`. Le mode `a-blanc` est
le défaut ; le rapport ligne à ligne s'affiche dans le résumé du run, à relire
avec la personne métier avant de relancer en `envoi`.

**Le script se relance quand on veut.** Il lit tous les CSV du dossier à chaque
passage : les familles déjà importées ressortent `deja_invite` ou `deja_membre`
sans qu'un message reparte, et seule une liste nouvellement déposée déclenche
des envois. Ajouter les conseils régionaux, c'est donc déposer leur CSV et
relancer — sans rien cibler ni compter.

Deux réglages GitHub à vérifier une fois pour toutes, côté Settings :

- l'environnement `prod` doit avoir des **required reviewers**, sinon n'importe
  qui déclenche un envoi réel sans approbation ;
- il porte `BACKEND_URL` (variable) et `SUPABASE_SERVICE_ROLE_KEY` (secret) — les
  mêmes que les workflows de déploiement.

Le workflow sérialise les exécutions par environnement : deux campagnes lancées
en même temps écriraient aux mêmes personnes deux fois.

## En local

Utile pour la mise au point, contre le backend de développement et Mailpit.

```bash
export TET_API_URL="http://localhost:8080"
export TET_API_TOKEN="$(npx dotenvx get SUPABASE_SERVICE_ROLE_KEY)"

CSV=data_layer/seed/sources/service-etat/contacts/dreal-contacts.csv
S=apps/tools/src/migrations/import-correspondants-service-etat/index.ts

# Tout le dossier contacts/ (défaut), à blanc puis pour de vrai.
node --experimental-strip-types $S --initiateur=camille@dreal.fr
node --experimental-strip-types $S --initiateur=camille@dreal.fr --envoi

# Une seule famille, en passant son fichier.
node --experimental-strip-types $S $CSV --initiateur=camille@dreal.fr
```

Les messages atterrissent dans Mailpit (http://127.0.0.1:54324). Node 24 exécute
le TypeScript sans transpilation : `tsx` n'est pas une dépendance du dépôt.

`--initiateur` est l'adresse d'un membre de l'équipe : elle signe les invitations
créées (`created_by`) et n'apparaît jamais dans le message reçu.

## Lire le rapport

| Statut | Ce qui s'est passé |
|---|---|
| `invite` | Pas de compte : invitation créée, lien envoyé |
| `rattache` | Compte existant : droit posé, lien vers l'espace du service envoyé |
| `deja_membre` | Déjà membre actif : rien à faire, aucun message |
| `deja_invite` | Une invitation pendante existe déjà : rien à faire |
| `revoquee` | Invitation désactivée à la main : l'import ne la ressuscite pas |
| `echec_envoi` | Le rattachement est en place, le transport a refusé le message |
| `erreur` | Ligne inexploitable (service introuvable, adresse invalide, deux clés) |

## Le piège de la préproduction

`SMTP_TO_EMAIL_WHITELIST` annule silencieusement tout envoi hors liste. En
staging, attendez-vous à voir la plupart des lignes en `echec_envoi /
not-whitelisted` : c'est normal. Elles ne repartiront pas d'elles-mêmes — le
rattachement est posé, donc un second passage les verra `deja_invite` ou
`deja_membre` selon que la personne avait un compte ou non.

**En production, vérifiez que cette variable n'est pas positionnée** avant
l'étape 3 — sinon l'import « réussit » sans que rien ne parte.

## Si un message n'est pas parti

**Aucun rejeu automatique** : l'import écrit une fois, et une ligne en
`echec_envoi` a bien eu son rattachement. Un second passage la verra
`deja_invite` (invitation créée) ou `deja_membre` (compte déjà existant) et
n'enverra rien. C'est assumé — le rattrapage se fait à la main, et il dépend de
la branche :

- `invite` (pas de compte) : la page des membres du service liste l'invitation
  en attente et sait la renvoyer ;
- `rattache` (compte existant) : il n'y a rien à renvoyer, la personne a déjà son
  accès et peut se connecter. Un mot par un autre canal suffit à le lui dire.

Les lignes en `erreur` et `revoquee`, elles, n'ont rien écrit du tout : corriger
le fichier ou l'invitation révoquée, puis rejouer, les traitera normalement.
