import {useState} from 'react';
import {Link} from 'react-router-dom';
import {format} from 'date-fns';
import {fr} from 'date-fns/locale';
import classNames from 'classnames';

import {referentielToName} from 'app/labels';
import {HistoriqueType, THistoriqueItem} from './types';
import {ReferentielOfIndicateur} from 'types/litterals';

export type HistoriqueDescription = {
  titre: string;
  description: string;
};

type Props = {
  historique: THistoriqueItem;
  // la classe du DSFR affichant l'icon. ex: 'fr-fi-information-fill'
  icon: string;
  // nom de la modification. ex: 'Action: statut modifié'
  nom: string;
  // tableau contenant par exemple l'action et la tache pour une modification de statut
  descriptions: HistoriqueDescription[];
  // le nouvel état et/ou le précédent en fonction du type d'historique
  detail?: JSX.Element;
  // à utiliser pour voir la page où se trouve la modification
  pageLink?: string;
};

// le nom du référentiel concerné sera affiché pour ces types de modifications
const SHOW_REFERENTIEL: HistoriqueType[] = [
  'action_statut',
  'action_precision',
  'preuve',
];

const Modification = ({
  historique,
  icon,
  nom,
  descriptions,
  detail,
  pageLink,
}: Props) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const {modified_at, modified_by_nom, type, action_id} = historique;
  const referentielId =
    SHOW_REFERENTIEL.includes(type) && action_id?.substring(0, 3);
  const referentielNom =
    referentielId &&
    referentielToName[referentielId as ReferentielOfIndicateur];
  const modifiedAt = new Date(modified_at);

  return (
    <div data-test="item" className="flex flex-col gap-4 md:flex-row md:gap-6">
      {/* DATE */}
      <div className="pr-6 w-min md:border-r md:border-gray-200">
        <span
          className="py-1 px-2 text-sm uppercase whitespace-nowrap text-blue-600 bg-blue-100 rounded-md"
          title={`à ${format(modifiedAt, 'HH:mm')}`}
        >
          {format(modifiedAt, 'dd MMMM yyyy', {
            locale: fr,
          })}
        </span>
      </div>
      {/* MAIN */}
      <div className="flex flex-col flex-grow overflow-hidden md:flex-row">
        {/* ICON */}
        <div className={`mr-4 mt-0.5 text-blue-600 ${icon}`} />
        {/* CONTENT */}
        <div className="flex flex-col flex-grow overflow-hidden">
          {/* DESCRIPTION */}
          <div className="mb-4" data-test="desc">
            <p className="mb-2 font-bold text-blue-600">{nom}</p>
            <p className="mb-2">
              <span className="text-gray-500">Par : </span>
              {modified_by_nom}
            </p>
            {referentielNom ? (
              <p className="mb-2">
                <span className="text-gray-500">Référentiel : </span>
                {referentielNom}
              </p>
            ) : null}
            {descriptions.map(desc => (
              <p key={desc.titre} className="mb-2 last:mb-0">
                <span className="text-gray-500">{desc.titre} : </span>
                {desc.description}
              </p>
            ))}
          </div>
          {/* DETAILS */}
          {detail && (
            <div
              className="mb-4 border-t border-b border-gray-200"
              data-test={`detail-${isDetailsOpen ? 'on' : 'off'}`}
            >
              <button
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="flex items-center w-full py-4 px-2"
              >
                <div className="font-bold">
                  {isDetailsOpen ? 'Masquer le détail' : 'Afficher le détail'}
                </div>
                <div
                  className={classNames(
                    'ml-auto fr-fi-arrow-down-s-line duration-100',
                    {
                      ['rotate-180']: isDetailsOpen,
                    }
                  )}
                />
              </button>
              {isDetailsOpen && (
                <div className="max-w-full p-2 mb-4 bg-gray-100">{detail}</div>
              )}
            </div>
          )}
          {pageLink && (
            <Link
              to={pageLink}
              className="flex items-center ml-auto fr-btn fr-btn--secondary !px-4 border border-bf500"
            >
              Voir la page{' '}
              <span className="ml-1 mt-1 fr-fi-arrow-right-line scale-75" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modification;
