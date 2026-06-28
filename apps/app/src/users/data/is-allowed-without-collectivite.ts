import {
  collectiviteBasePath,
  finaliserMonInscriptionUrl,
  invitationPath,
  profilPath,
  rejoindreCollectivitePath,
  recherchesPath,
} from '@/app/app/paths';

/**
 * Pages accessibles à un utilisateur authentifié (DCP renseignée) mais qui n'a
 * encore rejoint aucune collectivité — le « tunnel d'onboarding ».
 *
 * Toute autre route déclenche une redirection vers `finaliserMonInscriptionUrl`
 * (voir `(authed)/layout.tsx`). Fonction pure, testable isolément.
 *
 * Le chemin comparé provient de l'en-tête `x-current-path`, que le proxy réécrit
 * systématiquement à partir de `request.nextUrl.pathname` (cf. `proxy.ts`) : il
 * n'est donc pas falsifiable côté client. Par défense en profondeur on retire
 * malgré tout une éventuelle query string / ancre avant comparaison, pour qu'un
 * `?x=/profil` ne puisse pas élargir la liste blanche.
 */
export function isAllowedWithoutCollectivite(pathname: string): boolean {
  const path = pathname.split(/[?#]/)[0];

  return (
    path === finaliserMonInscriptionUrl ||
    path === rejoindreCollectivitePath ||
    path.startsWith(invitationPath) ||
    path.startsWith(recherchesPath) ||
    path.startsWith(profilPath) ||
    path.startsWith(collectiviteBasePath)
  );
}
