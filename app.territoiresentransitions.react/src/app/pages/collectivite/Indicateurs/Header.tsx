import {IndicateurViewParamOption} from 'app/paths';
import {ReactNode} from 'react';
import classNames from 'classnames';
import {viewTitles} from './Indicateurs';

/** Affiche l'en-tête d'une liste d'indicateurs */
export const HeaderIndicateursList = ({
  view,
}: {
  view: IndicateurViewParamOption;
}) => (
  <Header
    className="bg-bf525 text-white"
    title={viewTitles[view]}
    subtitle={
      view === 'crte' ? (
        <>
          Contrat de relance et de transition écologique
          <a
            href="https://agence-cohesion-territoires.gouv.fr/crte"
            target="_blank"
            rel="noreferrer noopener"
            className="ml-4"
          >
            En savoir plus
          </a>
        </>
      ) : undefined
    }
  />
);

/** Affiche l'en-tête d'une page détail d'un indicateur */
export const HeaderIndicateur = ({title}: {title: string}) => (
  <Header className="bg-bf925 text-[#161616]" title={title} />
);

/** Affiche un en-tête de page */
export const Header = ({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  className?: string;
}) => (
  <div
    className={classNames(
      'flex flex-col justify-center m-0 px-10 py-8 ',
      className
    )}
  >
    <p className="m-0 font-bold text-[1.375rem] leading-10">{title}</p>
    {subtitle && <p className="m-0 mt-2 leading-10">{subtitle}</p>}
  </div>
);
