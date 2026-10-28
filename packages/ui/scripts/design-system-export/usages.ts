/*
 * Notes d'usage des tokens publiés : où le code les emploie (classes Tailwind
 * de `@tet/ui` et de l'app, `variantClassNames` de `@tet/design-tokens`).
 * Une gamme (`primary`) sert de note par défaut à ses teintes (`primary-3`).
 * Les contrastes cités sont mesurés (WCAG 2) ; une paire du code sous le seuil
 * est gardée telle quelle et signalée.
 */
export const usages: Readonly<Record<string, string>> = {
  // Couleurs : marque
  primary:
    'Couleur de marque, alias de `primary-7` : boutons principaux (`bg-primary-7`), liens, icônes, éléments actifs.',
  'primary-0': 'Fond le plus clair de la gamme (`bg-primary-0`).',
  'primary-1':
    'Fond teinté des badges `default` en variante solid (`bg-primary-1`) et des zones mises en avant.',
  'primary-2':
    'Fond teinté des badges `standard` et `high` en variante solid, états sélectionnés.',
  'primary-3':
    'Bordures et séparateurs de la marque : header (`border-primary-3`), panneau latéral, divider du `PageHeader`.',
  'primary-4': 'Bordures (`border-primary-4`) et anneaux de focus.',
  'primary-5': 'Bordure des champs au focus (`focus-within:border-primary-5`).',
  'primary-6': 'Séparation des boutons divisés au survol.',
  'primary-7':
    'Couleur de marque : fonds de boutons primaires et de badges inverted, icônes, liens. Texte blanc dessus : 4,22:1, sous le seuil de 4,5:1 (réservé au texte gras ≥ 19px). En texte sur blanc : 4,22:1, idem.',
  'primary-8':
    'Survol des boutons primaires (`hover:bg-primary-8`). Texte blanc dessus : 6,05:1.',
  'primary-9':
    'Encre des titres (`h1`–`h6`) et des textes forts ; fond des badges `high` inverted. 8,87:1 sur blanc, 7,86:1 sur `primary-2`.',
  'primary-10': 'Texte des paragraphes (`.paragraphe-*`). 13,08:1 sur blanc.',
  'primary-11': 'Texte le plus foncé de la gamme (`.paragraphe-primary-11`).',
  bf500:
    'Bleu France du DSFR (#000091), employé par le logo République française. 14,91:1 sur blanc.',
  grey425: 'Gris DSFR d’un texte secondaire. 5,74:1 sur blanc.',
  grey975: 'Gris DSFR, non utilisé dans le code actuel.',
  grey: 'Neutres de l’interface : fonds, bordures, textes secondaires.',
  'grey-1':
    'Fond de carte presque blanc ; texte sur fonds foncés (`.paragraphe-grey-1`).',
  'grey-2':
    'Fond des en-têtes compactés (`PageHeader` collant) et des zones neutres.',
  'grey-3': 'Bordures des cartes et des tableaux (`border-grey-3`).',
  'grey-4': 'Bordures des champs au repos.',
  'grey-5':
    'Bordures des badges outlined et des contrôles. 1,57:1 sur blanc : bordure décorative, pas un repère de contrôle.',
  'grey-6':
    'Textes discrets : fil d’Ariane, compteurs. 3,11:1 sur blanc, sous le seuil pour du texte courant.',
  'grey-7':
    'Textes et icônes secondaires. 3,45:1 sur blanc, sous le seuil pour du texte courant.',
  'grey-8':
    'Texte secondaire et texte des badges `default` (`text-grey-8`). 5,74:1 sur blanc.',
  'grey-9': 'Texte secondaire appuyé. 7,79:1 sur blanc.',
  'grey-10': 'Texte le plus foncé des neutres. 18,1:1 sur blanc.',
  'text-body':
    'Couleur du texte courant, définie sur `body` dans `global.css`. 11,37:1 sur blanc.',
  secondary: 'Accent jaune de la marque.',
  'secondary-1':
    'Accent jaune : séparation des boutons divisés `secondary` au survol.',
  'secondary-2': 'Jaune clair : séparation des boutons divisés `secondary`.',
  new: 'Statut « nouveau » (badges `new`).',
  'new-1':
    'Texte, bordure et fond inverted des badges `new`. 3,21:1 sur blanc, 2,68:1 sur `new-2` : sous le seuil pour du texte courant.',
  'new-2': 'Fond des badges `new` en variante solid.',
  success: 'Statut de réussite, alias de `success-1`.',
  'success-1':
    'Texte, icône, bordure et fond inverted des badges `success`. 2,97:1 sur blanc, 2,76:1 sur `success-2` : sous le seuil, le statut doit aussi être porté par un libellé ou une icône.',
  'success-2': 'Fond des badges `success` en variante solid.',
  'success-3': 'Vert vif : bordures et icônes de réussite secondaires.',
  error: 'Statut d’erreur.',
  'error-1':
    'Texte, icône, bordure et fond inverted des badges `error` et des messages d’erreur. 3,22:1 sur blanc, 2,46:1 sur `error-2` : sous le seuil pour du texte courant.',
  'error-2': 'Fond des badges `error` en variante solid.',
  'error-3': 'Rouge intermédiaire : bordures.',
  'error-4': 'Rouge très clair de la gamme, non utilisé dans le code actuel.',
  warning: 'Statut d’alerte.',
  'warning-1':
    'Icône, bordure et fond inverted des badges `warning`. 1,92:1 sur blanc : jamais en texte, seulement en repère accompagné d’un libellé.',
  'warning-2': 'Fond des badges et alertes `warning`.',
  'warning-3': 'Orange intermédiaire : bordures.',
  info: 'Statut d’information.',
  'info-1':
    'Texte, icône, bordure et fond inverted des badges `info`. 3,72:1 sur blanc, 3,37:1 sur `info-2` : sous le seuil pour du texte courant.',
  'info-2': 'Fond des badges et alertes `info`.',
  'info-3': 'Bleu intermédiaire : bordures.',
  'orange-1': 'Orange d’accent ponctuel (fond, bordure, texte).',
  overlay: 'Voile semi-transparent, non utilisé en classe dans le code actuel.',

  // Typographie
  h1: 'Titre de page (dans `PageHeader.Title`). 2rem / 2.5rem sous le point de rupture md.',
  h2: 'Titre de section. 1.75rem / 2.25rem sous md.',
  h3: 'Titre de sous-section. 1.5rem / 2rem sous md.',
  h4: 'Titre de bloc. 1.5rem / 1.75rem sous md.',
  h5: 'Titre de carte. 1.25rem / 1.75rem sous md.',
  h6: 'Petit titre de carte ou de groupe.',
  'paragraphe-14': 'Texte courant compact : tableaux, cartes, aides.',
  'paragraphe-16': 'Texte courant par défaut.',
  'paragraphe-18': 'Texte d’introduction.',
  'paragraphe-22': 'Texte d’accroche.',
  text: 'Échelle Tailwind (`text-sm`, `text-lg`…) des libellés, badges et contrôles.',

  // Espacement
  spacing:
    'Échelle des primitives `Stack`, `Inline`, `Grid` (`gap`) et `Box` (`padding`). Le parent porte l’espacement : pas de marge sur les enfants.',
  'space-none': 'Éléments accolés.',
  'space-xs': 'Icône et libellé, éléments d’un même groupe serré.',
  'space-sm': 'Éléments d’une ligne (`Inline`), champs d’un même groupe.',
  'space-md': 'Valeur par défaut de `Stack` et `Grid` : blocs d’une section.',
  'space-lg': 'Sections d’une page ; padding des cartes.',
  'space-xl': 'Grandes séparations de page.',

  // Rayons
  radius: 'Rayon par défaut (`rounded`) : petits contrôles.',
  'radius-none': 'Angles droits.',
  'radius-sm': 'Petits éléments (`rounded-sm`).',
  'radius-md': 'Champs et menus (`rounded-md`).',
  'radius-lg':
    'Rayon le plus utilisé : cartes, boutons, badges (`rounded-lg`).',
  'radius-xl': 'Grandes cartes et conteneurs (`rounded-xl`).',
  'radius-full': 'Pastilles, avatars, puces (`rounded-full`).',

  // Ombres
  'shadow-button': 'Ombre légère des boutons (`shadow-button`).',
  'shadow-card': 'Ombre des cartes (`shadow-card`).',
  'shadow-t-sm': 'Ombre portée vers le haut des barres collées en bas d’écran.',
  'shadow-t-md':
    'Ombre portée vers le haut, moyenne ; non utilisée dans le code actuel.',
  'shadow-t-lg':
    'Ombre portée vers le haut, forte ; non utilisée dans le code actuel.',
  'shadow-t-xl':
    'Ombre portée vers le haut, très forte ; non utilisée dans le code actuel.',
  'shadow-t-2xl':
    'Ombre portée vers le haut, maximale ; non utilisée dans le code actuel.',
  'shadow-t-3xl':
    'Ombre portée vers le haut, maximale et diffuse ; non utilisée dans le code actuel.',

  // Largeurs
  'max-w-8xl': 'Largeur maximale du contenu de page (conteneur de `AppShell`).',
  'max-w-modal-xs': 'Modale très étroite (`Modal size="xs"`).',
  'max-w-modal-sm': 'Modale étroite.',
  'max-w-modal-md': 'Modale moyenne.',
  'max-w-modal-lg': 'Modale large.',
  'max-w-modal-xl': 'Modale très large.',

  // Superposition
  'z-header': 'Header de l’app.',
  'z-side-panel': 'Panneau latéral, au-dessus du header.',
  'z-modal': 'Modales.',
  'z-dropdown': 'Menus déroulants.',
  'z-tooltip': 'Infobulles, au-dessus de tout.',
  'z-sticky-header': 'En-têtes de page collants (`PageHeader sticky`).',
  'z-above-sticky-header':
    'Éléments qui passent au-dessus d’un en-tête collant.',
};
