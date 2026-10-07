import { MouseEventHandler } from 'react';
import { uiLabels } from '@tet/ui/labels/catalog';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';
import { ProConnectLogo } from './proconnect-logo';

const PROCONNECT_SITE_URL = 'https://www.proconnect.gouv.fr/';

/**
 * Reprend `.fr-btn.fr-connect.pro-connect` du DSFR : boîte en colonne, logo en
 * absolu à gauche, réservation de place à sa droite. Les `em` suivent la taille
 * de police du bouton, comme dans la feuille d'origine.
 *
 * Les hexadécimaux sont les couleurs de marque de l'État
 * (`--background-action-high-blue-france` et ses variantes,
 * `--text-inverted-blue-france`). Elles n'entrent pas dans le preset Tailwind :
 * elles n'auraient de sens pour aucun autre composant.
 */
const buttonClassName = cn(
  'relative inline-flex flex-col items-start justify-center',
  'py-[0.625em] pr-[0.75em] pl-[4.375em]',
  'cursor-pointer text-base no-underline',
  'bg-[#000091] text-[#f5f5fe] hover:bg-[#1212ff] active:bg-[#2323ff]'
);

type ProConnectButtonProps = {
  /** Posé sur le conteneur ; le bouton interne reçoit `<id>-button`. */
  id?: string;
  className?: string;
  dataTest?: string;
} & (
  | {
      url: string;
      /**
       * Appelé avant de suivre le lien — la navigation n'est pas empêchée.
       * Sert au suivi du départ de connexion (cf. `Event.auth.login.click`).
       */
      onClick?: MouseEventHandler<HTMLAnchorElement>;
    }
  | { url?: never; onClick: MouseEventHandler<HTMLButtonElement> }
);

/**
 * Bouton de connexion ProConnect, conforme au DSFR.
 *
 * Balisage et style repris du système de design de l'État plutôt qu'importés de
 * `@codegouvfr/react-dsfr` : la librairie n'est plus utilisée ailleurs dans le
 * repo, et n'en tirer que ce bouton imposait de charger deux feuilles DSFR
 * (44 Ko) dont les `@font-face` Marianne entraient en collision avec la police
 * déjà chargée par `global.css`.
 *
 * MonCompteAdeme s'affiche avec ce même bouton — la bascule d'un provider à
 * l'autre doit rester invisible pour l'utilisateur.
 *
 * @see https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/boutons-franceconnect-et-proconnect
 */
export const ProConnectButton = ({
  id,
  className,
  dataTest,
  url,
  onClick,
}: ProConnectButtonProps) => {
  const label = (
    <>
      <ProConnectLogo className="absolute left-[0.625em] top-1/2 h-[3em] w-[3.375em] -translate-y-1/2" />
      <span className="whitespace-nowrap text-[1.0625em] leading-[1.1]">
        S’identifier avec
      </span>
      <span className="whitespace-nowrap text-[1.125em] font-bold leading-[1.1]">
        ProConnect
      </span>
    </>
  );

  return (
    <div id={id} data-test={dataTest} className={cn('w-fit', className)}>
      {url === undefined ? (
        <button
          id={id && `${id}-button`}
          type="button"
          onClick={onClick as MouseEventHandler<HTMLButtonElement>}
          className={buttonClassName}
        >
          {label}
        </button>
      ) : (
        <a
          id={id && `${id}-button`}
          href={url}
          onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
          className={buttonClassName}
        >
          {label}
        </a>
      )}
      <p className="m-0 mt-3 text-center">
        <a
          href={PROCONNECT_SITE_URL}
          target="_blank"
          rel="noopener"
          title={`${uiLabels.questCeQueProConnect} - ${uiLabels.nouvelleFenetre}`}
          className="text-sm text-[#000091] underline underline-offset-[5px]"
        >
          {uiLabels.questCeQueProConnect}
          <Icon
            icon="external-link-line"
            size="sm"
            className="ml-1 align-middle"
          />
        </a>
      </p>
    </div>
  );
};
