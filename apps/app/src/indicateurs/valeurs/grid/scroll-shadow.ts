/**
 * Ombres de défilement des colonnes figées : elles disent que la partie
 * centrale passe *sous* la colonne de titres, à gauche, et sous la colonne
 * d'actions, à droite.
 *
 * Le mécanisme : `GridFrame` marque la zone de défilement d'un `group` et de
 * `data-can-scroll-left` / `data-can-scroll-right`, mis à jour par
 * `useHorizontalScrollEdges`. Chaque cellule figée dessine son propre segment
 * d'ombre en pseudo-élément — un par ligne, mis bout à bout, ce qui donne un
 * voile continu sur toute la hauteur — et ne le révèle que du côté où il reste
 * du contenu masqué.
 *
 * Le pseudo-élément plutôt qu'un `box-shadow` : les cellules figées portent
 * déjà le filet d'un pixel du design-system, et deux `shadow-*` sur la même
 * cellule s'écraseraient l'une l'autre. Les classes restent écrites en clair —
 * Tailwind ne génère que ce qu'il lit littéralement dans les sources.
 */

/** À poser sur toutes les cellules de la colonne figée à gauche. */
export const STICKY_LEFT_SHADOW_CLASSNAME =
  'after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-3 after:content-[""] after:bg-gradient-to-r after:from-black/5 after:to-transparent after:opacity-0 after:transition-opacity after:duration-150 group-data-[can-scroll-left=true]:after:opacity-100';

/** À poser sur toutes les cellules de la colonne figée à droite. */
export const STICKY_RIGHT_SHADOW_CLASSNAME =
  'before:pointer-events-none before:absolute before:inset-y-0 before:right-full before:w-3 before:content-[""] before:bg-gradient-to-l before:from-black/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-150 group-data-[can-scroll-right=true]:before:opacity-100';
