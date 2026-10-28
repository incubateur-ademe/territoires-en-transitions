## Règles de conformité

Ces règles s'appliquent à chaque élément de chaque maquette et de chaque
prototype, sans exception. Elles sont la seule source : la doc et les outils y
renvoient par leur numéro.

- **R1 · Composants du design system uniquement.** Composer avec les
  composants `TeT.*` (`@tet/ui` dans le code) et leurs props et variantes
  existantes. Aucun élément d'interface fait à la main : `div` stylée,
  `role="progressbar"`, pastille, carte, graphique…
- **R2 · Mise en page par les primitives.** `Stack`, `Inline`, `Grid` et
  `Box` ; le parent porte l'espacement avec `gap`, jamais de marge sur les
  enfants. Chaque prop varie par point de rupture, mobile d'abord.
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
  system, prise ensuite dans `@tet/ui`, jamais dans une maquette ni un
  prototype.
- **R7 · Un écart non noté n'atteint pas les devs.** Au passage en
  prototype, tout écart sans note « Proposition » est remplacé par l'option
  conforme la plus proche et listé « à trancher » ; la passation aux devs
  attend qu'il n'en reste aucun. Un composant qui existe déjà dans l'app sans
  être dans `@tet/ui` est un écart « à promouvoir », pas à inventer.
- **R8 · Le canevas fait référence.** Un changement décidé en cours de route
  se fait dans le canevas, puis le prototype est régénéré ; un réglage du
  canevas que le prototype ne reproduit pas est un écart.
