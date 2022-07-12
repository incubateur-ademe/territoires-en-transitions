import {
  Membre,
  TMembreFonction,
  TNiveauAcces,
  TUpdateMembreField,
} from 'app/pages/collectivite/Users/membres.io';
import {keys} from 'ramda';
import {useMemo, useState} from 'react';
import {Referentiel} from 'types/litterals';

export type TMembreListTableRowProps = {
  currentUserId: string;
  currentUserAccess: TNiveauAcces;
  membre: Membre;
  updateMembreFonction: TUpdateMembreField<TMembreFonction>;
};

const membreFonctionLabels: Record<TMembreFonction, string> = {
  referent: 'Référent·e',
  conseiller: 'Conseiller·e',
  technique: 'Équipe technique',
  politique: 'Équipe politique',
  partenaire: 'Partenaire',
};

const niveauAccesLabels: Record<TNiveauAcces, string> = {
  admin: 'Admin',
  edition: 'Édition',
  lecture: 'Lecture',
};

const rowClassNames = 'h-20 border-b border-gray-300 bg-white';
const cellClassNames = 'relative px-4';

const MembreListTableRow = ({
  currentUserId,
  currentUserAccess,
  membre,
  updateMembreFonction,
}: TMembreListTableRowProps) => {
  const interventionOptions: Referentiel[] = ['cae', 'eci'];

  const isCurrentUser = useMemo(() => {
    return currentUserId === membre.user_id;
  }, [currentUserId, membre.user_id]);

  return (
    <tr className={`${rowClassNames}`}>
      <td className={`${cellClassNames}`}>
        <span className="font-bold">
          {membre.nom} {membre.prenom} {isCurrentUser}
        </span>
        <span className="block mt-1 text-xs text-gray-500">{membre.email}</span>
      </td>
      <td className={`${cellClassNames}`}>
        <span>{membre.telephone}</span>
      </td>
      <td className={`${cellClassNames}`}>
        {/* <span>{user.fonction}</span> */}
        {isCurrentUser ? (
          <FonctionDropdown
            value={membre.fonction}
            labels={membreFonctionLabels}
            onSelect={updatedMembreFunction =>
              updateMembreFonction(membre.user_id, updatedMembreFunction)
            }
          />
        ) : (
          <span>
            {membre.fonction && membreFonctionLabels[membre.fonction]}
          </span>
        )}
      </td>
      <td className={`${cellClassNames} pr-0`}>
        {isCurrentUser ? (
          <ChampsInterventionDropdown
            values={membre.champ_intervention ?? []}
            options={interventionOptions}
          />
        ) : (
          (membre.champ_intervention ?? []).map(champ => (
            <span key={champ} className="block">
              {champ === 'cae' ? 'Climat Air Énergie' : 'Économie circulaire'}
            </span>
          ))
        )}
      </td>
      <td className={`${cellClassNames}`}>
        {isCurrentUser ? (
          <div className="py-1 px-2 border border-gray-300">
            <textarea
              value={membre.details_fonction}
              className="w-full resize-none"
            />
          </div>
        ) : (
          <span title={membre.details_fonction} className="w-72 line-clamp-3">
            {membre.details_fonction}
          </span>
        )}
      </td>
      <td className={`${cellClassNames} text-right`}>
        {isCurrentUser || currentUserAccess === 'admin' ? (
          <AccesDropdown
            isCurrentUser={isCurrentUser}
            currentUserAccess={currentUserAccess}
            value={membre.niveau_acces}
            labels={niveauAccesLabels}
          />
        ) : (
          <span>{niveauAccesLabels[membre.niveau_acces]}</span>
        )}
      </td>
    </tr>
  );
};

export default MembreListTableRow;

const FonctionDropdown = ({
  value,
  labels,
  onSelect,
}: {
  value?: TMembreFonction;
  labels: Record<TMembreFonction, string>;
  onSelect: (value: TMembreFonction) => void;
}) => {
  const [selectedValue, setSelectedValue] = useState(value);

  return (
    <div className="group relative">
      <button className="flex items-center w-full p-2 -ml-2 text-left">
        {selectedValue && (
          <span className="mr-auto">{labels[selectedValue]}</span>
        )}
        <span className="fr-fi-arrow-down-s-line mt-1 ml-1 scale-90 group-focus-within:rotate-180" />
      </button>
      <div className="bg-white invisible absolute -left-2 top-full min-w-full w-max transition-all opacity-0 shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        {keys(labels).map((v: TMembreFonction) => (
          <button
            key={v}
            className="flex items-center w-full p-2 text-left"
            onClick={() => {
              setSelectedValue(v);
              onSelect(v);
            }}
          >
            <div className="w-6 mr-2">
              {selectedValue === v && (
                <span className="block fr-fi-check-line scale-75" />
              )}
            </div>
            <span>{labels[v]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ChampsInterventionDropdown = ({
  values,
  options,
}: {
  values: Referentiel[];
  options: Referentiel[];
}) => {
  return (
    <div className="group relative">
      <button className="flex items-center w-full p-2 -ml-2 text-left">
        <div className="mr-auto">
          {values.map(v => (
            <span key={v} className="block">
              {v === 'cae' ? 'Climat Air Énergie' : 'Économie circulaire'}
            </span>
          ))}
        </div>
        <span className="fr-fi-arrow-down-s-line mt-1 ml-1 scale-90 group-focus-within:rotate-180" />
      </button>
      <div className="bg-white invisible absolute -left-2 top-full min-w-full w-max transition-all opacity-0 shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        {options.map((v: Referentiel) => (
          <button
            className="flex items-center w-full p-2 pr-4 text-left"
            key={v}
          >
            <div className="w-6 mr-2">
              {values.some(value => value === v) && (
                <span className="block fr-fi-check-line scale-75" />
              )}
            </div>
            <span>
              {v === 'cae' ? 'Climat Air Énergie' : 'Économie circulaire'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

type AccesDropdownProps = {
  isCurrentUser: boolean;
  currentUserAccess: TNiveauAcces;
  value: TNiveauAcces;
  labels: Record<TNiveauAcces, string>;
};

const AccesDropdown = ({
  isCurrentUser,
  currentUserAccess,
  value,
  labels,
}: AccesDropdownProps) => {
  return (
    <div className="group relative flex -mr-2">
      <button className="flex items-center ml-auto p-2 text-left">
        <span className="fr-fi-arrow-down-s-line mt-1 mr-1 scale-90 group-focus-within:rotate-180" />
        <span className="mr-auto">{labels[value]}</span>
      </button>
      <div className="bg-white invisible absolute right-0 top-full min-w-full w-max transition-all opacity-0 shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        {currentUserAccess === 'admin' ? (
          keys(labels).map(v => (
            <button
              className="flex items-center w-full p-2 pr-4 text-left"
              key={v}
            >
              <div className="w-6 mr-2">
                {value === v && (
                  <span className="block fr-fi-check-line scale-75" />
                )}
              </div>
              <div>
                <div>{labels[v]}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {v === 'admin' && 'Peut entièrement configurer et éditer'}
                  {v === 'edition' &&
                    'Peut éditer et inviter de nouveaux membres'}
                  {v === 'lecture' && 'Peut uniquement consulter'}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex items-center w-full p-2 text-left">
            <div className="w-6 mr-2">
              <span className="block fr-fi-check-line scale-75" />
            </div>
            <div>
              <div>{currentUserAccess}</div>
              <div className="mt-1 text-xs text-gray-500">
                {currentUserAccess === 'edition' &&
                  'Peut éditer et inviter de nouveaux membres'}
                {currentUserAccess === 'lecture' && 'Peut uniquement consulter'}
              </div>
            </div>
          </div>
        )}
        <button className="flex w-full px-2 py-4 text-left text-red-600">
          <div className="w-8" />
          {`${
            isCurrentUser ? 'Retirer mon accès à' : 'Retirer ce membre de'
          } la collectivité`}
        </button>
      </div>
    </div>
  );
};
