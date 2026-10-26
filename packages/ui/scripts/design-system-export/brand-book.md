Territoires en Transitions est la plateforme publique (ADEME, beta.gouv.fr) qui
aide les collectivités à piloter leur transition écologique : plans d'action,
fiches action, indicateurs, référentiels de labellisation (CAE, ECI, TE). Ses
utilisateurs sont des agents et des élus de collectivités : l'interface est
sobre, dense en information, institutionnelle (État, DSFR) et accessible
(RGAA).

Ce design system reflète le code de `@tet/ui`, la bibliothèque de l'app. Chaque
nom (token, composant, variante) est celui du code : une maquette qui s'en tient
à ce vocabulaire se transpose telle quelle dans l'app.

## Correspondance avec le code

- Composer avec les composants de `@tet/ui` et leurs variantes existantes
  (`Button variant="primary" size="sm"`, `Badge variant="success"`,
  `PageHeader`, `Card`, `Modal`…), sans en redessiner.
- Un besoin non couvert (nouveau composant, nouvelle variante, valeur hors
  échelle) est une **proposition** à nommer comme telle : « variante de
  `Button` » ou « nouveau composant », avec le besoin qu'elle sert. Dans le
  repo, elle va dans un dossier `proposals/` à côté de la page prototypée.
- Ne jamais inventer de couleur, de taille ni d'espacement : chaque valeur est
  un token de ce design system.

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

- Composants : pas encore publiés ici (aperçus et code). Les noms et variantes
  cités ci-dessus sont ceux de `@tet/ui`.
- Pictogrammes DSFR et icônes Remix : non copiés.
- Tokens non repris : points de rupture (`2xl` 1440px, les autres sont ceux
  de Tailwind), `maxHeight` `80vh`, largeur du panneau latéral (32rem) et
  animation `spin-slow`.
