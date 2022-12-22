import {useLocation} from 'react-router-dom';
import {useAuth} from '../core-logic/api/auth/AuthProvider';
import {useEffect} from 'react';
import {authBasePath} from './paths';
import {useCollectiviteId} from '../core-logic/hooks/params';
import {Database} from '../types/database.types';
import {supabaseClient} from '../core-logic/api/supabase';
import {ENV} from '../environmentVariables';

/**
 * Représente la visite d'une page.
 */
type Visite = Database['public']['Tables']['visite']['Insert'];

type Page = Database['public']['Enums']['visite_page'];
type Tag = Database['public']['Enums']['visite_tag'];
type Onglet = Database['public']['Enums']['visite_onglet'];

/**
 * Enregistre une visite.
 *
 * @param visite
 * @returns success
 */
const track = async (visite: Visite): Promise<boolean> => {
  const {status} = await supabaseClient.from('visite').insert(visite);
  return status === 201;
};

type Location = {
  page: Page;
  tag: Tag | null;
  onglet: Onglet | null;
};

/**
 * Permet d'enregistrer les visites.
 */
export const VisitTracker = () => {
  const {pathname} = useLocation();
  const {user} = useAuth();
  const collectivite_id = useCollectiviteId();

  useEffect(() => {
    if (!user) return;
    const {page, tag, onglet} = locationFromPath(pathname);
    const visite: Visite = {
      page: page,
      tag: tag,
      onglet: onglet,
      user_id: user.id,
      collectivite_id: collectivite_id,
    };

    track(visite);
  }, [pathname]);

  return null;
};

/**
 * Extrait les informations sur la page à partir du chemin.
 * Solution en attendant une refacto du routing.
 *
 * @param path
 */
const locationFromPath = (path: string): Location => {
  let page: Page = 'autre';
  let tag: Tag | null = null;
  let onglet: Onglet | null = null;

  if (path === '/toutes_collectivites') {
    page = 'toutes_collectivites';
  } else if (path.startsWith(authBasePath)) {
    if (path.endsWith('signin')) page = 'signin';
    else if (path.endsWith('signup')) page = 'signup';
    else if (path.endsWith('recover')) page = 'recover';
    else if (path.includes('/recover_landing/ ')) page = 'recover_landing';
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
    // page
    page = 'indicateur';
    // tag
    if (path.endsWith('/eci')) tag = 'eci';
    else if (path.endsWith('/cae')) tag = 'cae';
    else if (path.endsWith('/crte')) tag = 'crte';
    else if (path.endsWith('/perso')) tag = 'personnalise';
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
  } else if (path.includes('/plan_action/')) {
    page = 'plan';
  } else if (path.includes('/fiche/')) {
    page = 'fiche';
  } else if (path.includes('/personnalisation/')) {
    page = 'personnalisation';
    tag = 'thematique';
  } else if (path.endsWith('/personnalisation')) {
    page = 'personnalisation';
  } else if (path.endsWith('/tableau_bord')) {
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

  if (ENV.node_env === 'development') {
    console.info('visite', path, page, tag, onglet);
    if (page === 'autre') console.error('Page non reconnue par VisitTracker!');
  }
  return {page, tag, onglet};
};
