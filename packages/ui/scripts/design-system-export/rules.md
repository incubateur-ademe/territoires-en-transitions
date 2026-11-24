## Règles de conformité

Ces règles s'appliquent à chaque élément de chaque maquette, sans exception. Elles sont la seule source : la doc et les outils y
renvoient par leur numéro.

- **R1 · Composants du design system uniquement.** Composer avec les
  composants `TeT.*` (`@tet/ui` dans le code) et leurs props et variantes
  existantes. Aucun élément d'interface fait à la main : `div` stylée,
  `role="progressbar"`, pastille, carte, graphique…
- **R2 · Le parent porte l'espacement.** Mise en page en flex ou en grille,
  espacée par le `gap` du parent sur l'échelle de R3, jamais par une marge sur
  les enfants. Mobile d'abord, puis par point de rupture.
- **R3 · Tokens uniquement.** Espacements sur l'échelle 0, 4, 8, 16, 24 et
  32px, jamais 12px ni une valeur au pixel près ; couleurs, rayons et ombres
  de ce design system.
- **R4 · La typographie vient de la balise ou de la classe.** Un titre a le
  style de son élément : un titre de 18px en gras est un `h6`, jamais un `h3`
  dont on change la taille. Le texte courant prend une classe `paragraphe-*`
  ou `text-*`. Aucune `font-size`, `font-weight` ni `line-height` écrite à la
  main ; une couleur de texte est un token.
- **R5 · Un besoin non couvert se dit avant de se dessiner.** Si un élément
  voulu n'a pas de composant ou de token, le dire au designer et lui proposer
  l'option conforme la plus proche (les deux pas d'échelle voisins, le
  composant existant le plus proche). C'est le designer qui tranche.
- **R6 · Une exception se note sur le canevas.** Si le designer maintient le
  besoin, la maquette garde l'option conforme et le canevas porte une note
  « Proposition : … » qui nomme le besoin. Ajouter un token, un pas
  d'espacement, un composant ou une variante est une décision du design
  system, prise ensuite dans `@tet/ui`, jamais dans une maquette.
- **R7 · Un écart non noté n'atteint pas les devs.** À la passation, tout
  écart sans note « Proposition » est listé « à trancher » avec l'option
  conforme la plus proche ; la passation attend qu'il n'en reste aucun. Un
  composant qui existe déjà dans l'app sans être dans `@tet/ui` est un écart
  « à promouvoir », pas à inventer.
- **R8 · Le canevas fait référence.** Un changement décidé en cours de route
  se fait dans le canevas, puis la passation est relancée ; ce que le canevas
  ne montre pas n'est pas décidé.
