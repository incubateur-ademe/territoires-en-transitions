import { redirect } from 'next/navigation';

/**
 * Panier d'actions à impact
 *
 * Pour créer un nouveau panier sans lien avec aucune collectivité :
 * /landing
 *
 * Pour créer un nouveau panier pour une collectivité, ou revenir sur
 * le panier récent créé pour cette collectivité :
 * /landing/collectivite/[collectivite_id]
 *
 * Pour revenir sur un panier existant :
 * /panier/[panier_id]
 */

export default function Page() {
  redirect('/landing');
}
