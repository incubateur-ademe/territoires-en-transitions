# Rattrapage des saisines PCAET

Saisit les services instructeurs que les transmissions passées ont oubliés.

## Pourquoi

Une saisine (`demarche_pcaet_demande_avis`) naît à la **transmission** d'un
dossier, pour les services qui couvraient alors la collectivité déposante. Un
service entré dans le dispositif après coup n'en a donc aucune sur les dossiers
déjà partis : son périmètre les couvre, mais il ne peut pas les ouvrir — la
liste d'instruction les lui montre en « Service non saisi ».

Le cas s'est vu à l'arrivée des services nationaux (DGEC, ADEME siège), et il se
reproduira à chaque nouveau service. Sur la base de développement, le rattrapage
portait sur 30 saisines : 12 pour les services nationaux, mais aussi 6 DDT,
6 DR ADEME et 6 conseils régionaux — le trou n'est pas propre au national.

## Ce que le script fait, et ne fait pas

Il **rejoue `saisirInstructeurs`**, l'opération même de la transmission, sur les
dossiers déjà transmis. Aucune règle de couverture n'est réécrite : elle reste
dans `PcaetInstructeursRepository`, ce qui interdit toute divergence entre le
rattrapage et la transmission.

- **Idempotent** : l'insertion porte un `onConflictDoNothing` sur la paire
  (démarche, instructeur). Rejouable sans doublon, et les saisines existantes
  ne bougent pas — leur date de saisine fait foi.
- **`source` reste `transmission`** : la ligne dit vrai, ce service est bien
  destinataire de la transmission de ce dossier. Son `created_at`, très
  postérieur au `transmitted_at` de la démarche, suffit à repérer les lignes
  nées ici. Ajouter une valeur d'énumération aurait demandé une migration de
  schéma pour une information que la donnée porte déjà.
- **Critère : `transmitted_at is not null`**, et non le statut. C'est la
  transmission qui crée les saisines ; un dossier jamais transmis n'a saisi
  personne, même s'il porte un statut avancé. Sur la base de développement,
  24 dossiers sont dans ce cas — des fixtures créées directement en `publie` ou
  `archive`, ce que le workflow ne produit pas.
- Il **ne touche pas aux dossiers en élaboration** : ils n'ont été transmis à
  personne, et le service n'a pas à les ouvrir.

## Usage

À blanc par défaut — le script n'écrit rien et dit ce qu'il ferait :

```sh
SUPABASE_DATABASE_URL="postgresql://..." \
  pnpx tsx apps/tools/src/migrations/rattraper-saisines-pcaet/index.ts
```

Écriture réelle :

```sh
SUPABASE_DATABASE_URL="postgresql://..." \
  pnpx tsx apps/tools/src/migrations/rattraper-saisines-pcaet/index.ts --confirm
```

## Quand le rejouer

À chaque fois qu'un service instructeur entre dans le dispositif, ou qu'un
périmètre est recalculé (l'import Banatic annuel déplace des EPCI d'un
département ou d'une région à l'autre). Le mode à blanc dit s'il y a lieu.
