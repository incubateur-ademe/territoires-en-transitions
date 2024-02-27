import {useMemo} from 'react';
import {Enums} from '@tet/api';
import {useLocation} from 'react-router-dom';

/**
 * Renvoi la localisation utilisée par le tracker.
 */
export const useLocalisation = (): Localisation => {
  const {pathname} = useLocation();
  return useMemo<Localisation>(() => locationFromPath(pathname), [pathname]);
};

/**
 * Représente là où se trouve l'utilisateur du point de vue du Tracker.
 */
export type Localisation = {
  page: Page;
  tag: Tag | null;
  onglet: Onglet | null;
};

type Page = Enums<'visite_page'>;
type Tag = Enums<'visite_tag'>;
type Onglet = Enums<'visite_onglet'>;

/**
 * Extrait les informations sur la page à partir du chemin.
 * Solution en attendant une refacto du routing.
 *
 * @param path
 */
const locationFromPath = (path: string): Localisation => {
  let page: Page = 'autre';
  let tag: Tag | null = null;
  let onglet: Onglet | null = null;

  if (path.includes('/recherches/')) {
    page = 'toutes_collectivites';
    if (path.endsWith('collectivites')) {
      onglet = 'collectivites';
    } else {
      onglet = 'plans';
    }
  } else if (path.includes('/profil/')) {
    if (path.endsWith('mon-compte')) page = 'mon_compte';
    else if (path.endsWith('rejoindre-une-collectivite')) page = 'rejoindre';
  } else if (path.includes('/referentiels/')) {
    // page
    page = 'referentiel';
    // tag
    if (path.includes('/eci/')) tag = 'eci';
    else if (path.includes('/cae/')) tag = 'cae';
    // onglet
    if (path.endsWith('progression')) onglet = 'progression';
    else if (path.endsWith('priorisation')) onglet = 'priorisation';
    else if (path.endsWith('detail')) onglet = 'detail';
  } else if (path.includes('/indicateurs/')) {
    const match = /(cles|selection|perso|cae|eci|crte)\/(.+)?/.exec(path);
    if (match) {
      const [, category, id] = match;
      // tag
      if (['eci', 'cae', 'crte'].includes(category))
        tag = category as 'eci' | 'cae' | 'crte';
      else if (category === 'perso') tag = 'personnalise';
      else if (category === 'cles') tag = 'clef';
      else if (category === 'selection') tag = 'priorites';
      // page
      if (id) {
        // si il y a un id d'indicateur on est sur une page détail
        page = 'indicateur';
      } else {
        page = 'indicateurs';
      }
    }
  } else if (path.includes('/labellisation/')) {
    // page
    page = 'labellisation';
    // tag
    if (path.includes('/eci/')) tag = 'eci';
    else if (path.includes('/cae/')) tag = 'cae';
    // onglet
    if (path.endsWith('suivi')) onglet = 'suivi';
    else if (path.endsWith('cycles')) onglet = 'comparaison';
    else if (path.endsWith('criteres')) onglet = 'critere';
  } else if (path.includes('/fiche/')) {
    page = 'fiche';
  } else if (path.includes('/plan/')) {
    if (/(\d+)\/(\d+)/.exec(path)) page = 'plan_axe';
    else page = 'plan';
  } else if (path.includes('/plans/synthese')) {
    //page
    page = 'synthese_plans';
    //tag
    if (path.includes('/statuts')) tag = 'statuts';
    else if (path.includes('/pilotes')) tag = 'pilotes';
    else if (path.includes('/referents')) tag = 'referents';
    else if (path.includes('/priorites')) tag = 'priorites';
    else if (path.includes('/echeance')) tag = 'echeances';
  } else if (path.endsWith('/plans/fiches')) {
    page = 'fiches_non_classees';
  } else if (path.endsWith('/plans/nouveau')) {
    page = 'nouveau_plan';
  } else if (path.endsWith('/plans/importer')) {
    page = 'nouveau_plan_import';
  } else if (path.endsWith('/plans/creer')) {
    page = 'nouveau_plan_creation';
  } else if (path.includes('/personnalisation/')) {
    page = 'personnalisation';
    tag = 'thematique';
  } else if (path.endsWith('/personnalisation')) {
    page = 'personnalisation';
  } else if (path.endsWith('/accueil')) {
    page = 'tableau_de_bord';
  } else if (path.includes('/action/')) {
    // page
    page = 'action';
    // tag
    if (path.includes('/eci/')) tag = 'eci';
    else if (path.includes('/cae/')) tag = 'cae';
    // onglet
    if (path.endsWith('/') || path.endsWith('suivi')) onglet = 'suivi';
    else if (path.endsWith('preuves')) onglet = 'preuve';
    else if (path.endsWith('indicateurs')) onglet = 'indicateur';
    else if (path.endsWith('historique')) onglet = 'historique';
  } else if (path.endsWith('/bibliotheque')) {
    page = 'bibliotheque';
  } else if (path.endsWith('/historique')) {
    page = 'historique';
  } else if (path.endsWith('/users')) {
    page = 'membre';
  }

  return {page, tag, onglet};
};
