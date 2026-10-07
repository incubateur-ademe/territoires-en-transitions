# Import des correspondants d'un service de l'État

Rattache les correspondants d'un fichier au service qu'ils représentent et leur
écrit **une fois**. Sert les six familles : DREAL, conseils régionaux, DDT,
DR ADEME, ADEME siège, DGEC.

## Où vivent les fichiers

**Nulle part dans ce dépôt.** Il est public, et les listes fournies par le métier
portent des adresses nominatives d'agents. Déposez-les dans `contacts/` à la
racine — le dossier est dans le `.gitignore`, ce qui protège d'un `git add`
distrait.

Le format est décrit dans
[data_layer/seed/sources/service-etat/README.md](../../../../../data_layer/seed/sources/service-etat/README.md) :
un seul en-tête pour les six familles, le `type` désignant la colonne clé.

## Lancer l'import

Depuis un poste, contre l'environnement visé. Le script est un client de l'API :
il n'a rien à faire tourner sur un serveur.

```bash
# L'URL du backend et la clé de service de l'environnement visé.
export TET_API_URL="https://api.territoiresentransitions.fr"
export TET_API_TOKEN="<SUPABASE_SERVICE_ROLE_KEY de cet environnement>"

S=apps/tools/src/migrations/import-correspondants-service-etat/index.ts

# 1. À blanc : rien n'est écrit, rien n'est envoyé. Lit tous les CSV de contacts/.
node --experimental-strip-types $S --initiateur=prenom.nom@beta.gouv.fr

# 2. Relire le rapport avec la personne métier : chaque adresse doit tomber sur
#    le bon service, et le nombre d'envois doit être celui qu'on attend.

# 3. Envoyer.
node --experimental-strip-types $S --initiateur=prenom.nom@beta.gouv.fr --envoi

# 4. Rejouer à blanc : plus aucun envoi prévu. C'est le contrôle qu'un second
#    passage n'écrit à personne deux fois.
```

Un chemin peut être passé en argument pour ne traiter qu'un fichier :
`node --experimental-strip-types $S contacts/dreal-contacts.csv --initiateur=…`.

**Le script se relance quand on veut.** Il lit tous les CSV du dossier à chaque
passage : les familles déjà importées ressortent `deja_invite` ou `deja_membre`
sans qu'un message reparte, et seule une liste nouvellement déposée déclenche
des envois. Ajouter les conseils régionaux, c'est déposer leur CSV et relancer.

En local, contre le backend de développement, les messages atterrissent dans
Mailpit (http://127.0.0.1:54324) :

```bash
export TET_API_URL="http://localhost:8080"
export TET_API_TOKEN="$(npx dotenvx get SUPABASE_SERVICE_ROLE_KEY)"
```

Node 24 exécute le TypeScript sans transpilation : `tsx` n'est pas une
dépendance de ce dépôt.

`--initiateur` est l'adresse d'un membre de l'équipe **ayant un compte sur
l'environnement visé** : elle signe les invitations créées (`created_by`) et
n'apparaît jamais dans le message reçu.

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

## Prérequis de déploiement

Les migrations ne se jouent pas seules : `utilisateur/dcp_email_lower_index`
demande un `sqitch deploy` manuel après le déploiement du backend.
