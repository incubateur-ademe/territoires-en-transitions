Territoires en Transitions est la plateforme publique (ADEME, beta.gouv.fr) qui
aide les collectivités à piloter leur transition écologique : plans d'action,
fiches action, indicateurs, référentiels de labellisation (CAE, ECI, TE). Ses
utilisateurs sont des agents et des élus de collectivités : l'interface est
sobre, dense en information, institutionnelle (État, DSFR) et accessible
(RGAA).

Ce design system reflète le code de `@tet/ui`, la bibliothèque de l'app. Chaque
nom (token, composant, variante) est celui du code : une maquette qui s'en tient
à ce vocabulaire se transpose telle quelle dans l'app.

## Avant de dessiner

Ces règles s'appliquent à chaque élément de chaque maquette, sans exception :

1. **Uniquement des composants `TeT.*`**, avec leurs props et variantes
   existantes. Aucun élément d'interface dessiné à la main (`div` stylée,
   `role="progressbar"`, pastille, carte, graphique…).
2. **Uniquement des tokens** : espacements sur l'échelle 0, 4, 8, 16, 24,
   32px ; couleurs, rayons, ombres et styles de texte de ce design system.
   Jamais de valeur au pixel près.
3. **Le style d'un texte vient de sa balise ou de sa classe, jamais d'un
   style inline.** Comme dans l'app, un titre a le style de son élément : un
   titre de 18px en gras est un `h6`, jamais un `h3` dont on change la
   taille. Le texte courant prend une classe `paragraphe-*` ou `text-*`.
   Aucune `font-size`, `font-weight` ni `line-height` écrite à la main ; une
   couleur de texte est toujours un token (`var(--primary-9)`).
4. **Un besoin non couvert se dit avant de se dessiner.** Si un élément voulu
   n'a pas de composant ou de token, s'arrêter, le dire au designer et lui
   proposer l'option conforme la plus proche. Ne rien dessiner tant qu'il n'a
   pas tranché.
5. **Une exception décidée par le designer se note.** S'il maintient le
   besoin, la maquette garde l'option conforme et le canevas porte une note
   « Proposition : … » qui nomme le besoin. Sans cette note, l'écart sera
   renvoyé à la maquette lors du passage en prototype.

## Correspondance avec le code

- Composer avec les composants de `@tet/ui` et leurs variantes existantes
  (`Button variant="primary" size="sm"`, `Badge variant="success"`,
  `PageHeader`, `Card`, `Modal`…), sans en redessiner.
- Dans un design, ces composants sont ceux du bundle, sous `window.TeT` :
  `TeT.Button`, `TeT.Stack`, `TeT.PageHeader`… avec les mêmes props que dans
  le code (voir chaque fiche et `index.d.ts`). `TeT.Button` dans une maquette
  devient `import { Button } from '@tet/ui'` dans l'app.
- La mise en page se compose avec `TeT.Stack`, `TeT.Inline`, `TeT.Grid` et
  `TeT.Box`, jamais avec des classes ou styles de layout écrits à la main.
- Les fiches marquées « planche d'exemples » montrent des compositions tirées
  des stories ; leur nom n'est pas un composant à importer.
- Ne jamais inventer de couleur, de taille ni d'espacement : chaque valeur est
  un token de ce design system. Un espacement est toujours un pas de l'échelle
  (0, 4, 8, 16, 24 ou 32px), jamais 12px, 20px ou une valeur « au pixel ».
- Une maquette suit le design system avant tout : si le rendu voulu semble
  demander autre chose (une valeur hors échelle, un composant ou une variante
  qui n'existe pas), le dire au designer dans la conversation, avant de
  l'écrire, et lui proposer ce que le design system permet (les deux pas les
  plus proches, le composant existant le plus proche). C'est au designer de
  trancher.
- Ajouter un pas d'espacement, un token, un composant ou une variante est une
  décision du design system, pas d'une maquette. Si le designer décide de la
  demander quand même, la maquette garde la solution conforme et porte une
  note « Proposition : … » qui nomme le besoin. Dans le repo, elle ira dans
  un dossier `proposals/` à côté de la page prototypée ; tout écart sans
  cette note est renvoyé à la maquette.

## Contenu et ton

- Français, vouvoiement, phrases courtes et factuelles. Exemples réels :
  « Le document sera définitivement supprimé. Voulez-vous vraiment le
  supprimer ? », « Aucun historique de modification ».
- Majuscule à l'initiale seulement : « Télécharger le graphique », jamais
  « Télécharger Le Graphique ».
- Boutons : un verbe à l'infinitif qui dit ce qui se passe (« Enregistrer »,
  « Ajouter », « Supprimer », « Télécharger »).
- États vides : dire ce qui manque (« Aucun résultat », « Aucun
  téléchargement préparé pour le moment. »).
- Vocabulaire métier en français et tel quel : plan, fiche action, mesure,
  indicateur, collectivité, référentiel, labellisation, pilote.
- Pas d'emoji.

## Couleurs

- `primary-7` est la couleur de marque : boutons principaux, liens, icônes,
  éléments actifs. Survol : `primary-8`.
- Titres en `primary-9` ; paragraphes en `primary-10` ; texte courant
  `text-body`. Textes secondaires en `grey-8` (5,74:1 sur blanc).
- Fonds : blanc pour les cartes et la page, `grey-2` pour les zones neutres,
  `primary-1` et `primary-2` pour les zones mises en avant ou sélectionnées.
- Bordures : `grey-3` pour les cartes et tableaux, `grey-4` pour les champs,
  `primary-3` pour les séparateurs de marque (header, `PageHeader`).
- Statuts : `success-1`, `warning-1`, `error-1`, `info-1`, `new-1`, chacun
  avec son fond clair (`success-2`…). Un statut est toujours porté aussi par
  un libellé ou une icône : ces couleurs sont sous 4,5:1 sur blanc, et
  `warning-1` (1,92:1) ne s'emploie jamais en texte.
- `bf500` (Bleu France) appartient à l'identité de l'État : le réserver au
  bloc-marque République française.
- Pas de dégradé ; un seul thème clair.

## Typographie

- Une seule famille : Marianne (`sans`), la police de l'État, en 300, 400, 500
  et 700, romain et italique.
- Titres `h1` à `h6`, toujours en gras (700) et en `primary-9`. Le titre de
  page est un `h1` dans `PageHeader.Title`. Les titres réduisent sous le point
  de rupture `md` (voir la note de chaque style).
- Texte courant : `paragraphe-16` par défaut, `paragraphe-14` dans les cartes,
  tableaux et aides, `paragraphe-18` pour une introduction.
- Libellés, badges et contrôles : l'échelle `text-xs` à `text-lg`.

## Espacement et mise en page

- La mise en page passe par les primitives `Stack` (vertical), `Inline`
  (horizontal), `Grid` (colonnes) et `Box` (padding). Le parent porte
  l'espacement avec `gap` : jamais de marge sur les enfants.
- Échelle unique : `space-none` 0, `space-xs` 4px, `space-sm` 8px, `space-md`
  16px, `space-lg` 24px, `space-xl` 32px. `space-md` entre les blocs d'une
  section, `space-lg` entre les sections et dans les cartes, `space-sm` entre
  les éléments d'une ligne.
- Chaque prop varie par point de rupture (`sm`, `md`, `lg`, `xl`, mobile
  first). Une ligne d'actions passe en colonne sur mobile
  (`Inline collapseBelow="md"`).
- Toute page vit dans la coque `AppShell` : header de l'app, contenu centré
  sur `max-w-8xl` (90rem) avec 8px de marge latérale sur mobile, 16px dès
  `md` et 24px dès `lg`, puis footer. Une page commence par `PageHeader`
  (titre, actions, métadonnées), jamais par un titre fait main.

## Formes et profondeur

- Rayons : `radius-lg` (8px) pour les cartes, boutons et badges, le plus
  courant ; `radius-md` pour les champs ; `radius-full` pour les pastilles.
- Les surfaces se distinguent par une bordure (`grey-3`) plutôt que par une
  ombre. Ombres réservées aux boutons (`shadow-button`) et aux cartes
  (`shadow-card`).
- Superpositions : respecter l'ordre `z-sticky-header` < `z-header` <
  `z-side-panel` < `z-dropdown` < `z-modal` < `z-tooltip`.

## Statuts et badges

- `Badge` porte un statut : `variant` parmi `default`, `standard`, `high`,
  `success`, `warning`, `new`, `error`, `info`, `grey` ; `type` parmi
  `outlined` (fond blanc, bordure `grey-5`), `solid` (fond clair de la
  couleur) et `inverted` (fond plein, texte blanc).

## Iconographie

- Icônes : Remix Icon, en ligne (`-line`) par défaut et en plein (`-fill`)
  pour un état actif, via le composant `Icon` (`icon="add-line"`) ou la prop
  `icon` des boutons. Tailles de `2xs` (12px) à `2xl` (32px), `md` (20px) par
  défaut.
- Pictogrammes : ceux du DSFR (`PictoWarning`, `PictoPadlock`…).
- Pas d'emoji, pas d'illustration générique.

## Logos

- Le header (composant `Header`) aligne, dans cet ordre : République
  française, ADEME, Électrifions la France, Territoire engagé Transition
  écologique, puis Territoires en Transitions. Sur mobile : République
  française et ADEME seulement. Ne pas recolorer ni redessiner un logo.

## Non synchronisé

- Composants : `@tet/ui` hors suivi d'audience (`components/tracking`, lié à
  l'API de l'app) et hors composants dépréciés (`DEPRECATED_Table`). Les
  exemples rejouent les stories sans leurs fonctions d'interaction (`play`).
- Navigation : les liens et hooks de routage de Next sont remplacés par des
  liens simples et une page fixe ; un composant qui lit l'URL s'affiche dans
  son état par défaut.
- Pictogrammes DSFR et jeu d'icônes Remix : utilisables via les composants
  (`Icon`, `PictoWarning`…), pas copiés comme fichiers.
- Tokens non repris : points de rupture (`2xl` 1440px, les autres sont ceux
  de Tailwind), `maxHeight` `80vh`, largeur du panneau latéral (32rem) et
  animation `spin-slow`.

## Version et mise à jour des maquettes

Ce design system est republié depuis la branche `main` du repo chaque fois que
`@tet/ui` change : `tokens.json` porte le commit source dans `meta.ref`. Une
maquette garde la copie installée à sa création (`designSystems` de son
`canvas.json`, avec `version` et `copiedAt`).

- Avant de modifier une maquette qui utilise ce design system, comparer la
  `version` enregistrée dans son `canvas.json` à la version actuelle de ce
  design system. Si elle est plus ancienne, réinstaller ses fichiers dans la
  maquette avant toute autre modification, et le dire au designer en une
  phrase : les composants et leurs props peuvent avoir changé.
- Un composant qui n'existe plus, ou dont une prop a changé, se signale au
  designer : ne pas le remplacer par un équivalent dessiné à la main.
