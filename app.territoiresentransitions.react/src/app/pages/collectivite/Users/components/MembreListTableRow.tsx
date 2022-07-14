import {TNiveauAcces, TRemoveFromCollectivite, TUpdateMembre} from '../types';
import {Membre, TMembreFonction} from 'app/pages/collectivite/Users/types';
import {Referentiel} from 'types/litterals';
import {referentielToName} from 'app/labels';

export type TMembreListTableRowProps = {
  currentUserId: string;
  currentUserAccess: TNiveauAcces;
  membre: Membre;
  updateMembre: TUpdateMembre;
  removeFromCollectivite: TRemoveFromCollectivite;
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

const niveauAccessDetail: Record<TNiveauAcces, string> = {
  admin: 'Peut entièrement configurer et éditer',
  edition: 'Peut éditer et inviter de nouveaux membres',
  lecture: 'Peut uniquement consulter',
};

const rowClassNames = 'h-20 border-b border-gray-300 bg-white';
const cellClassNames = 'relative px-4';

const MembreListTableRow = ({
  currentUserId,
  currentUserAccess,
  membre,
  updateMembre,
  removeFromCollectivite,
}: TMembreListTableRowProps) => {
  const interventionOptions: Referentiel[] = ['cae', 'eci'];
  const {
    user_id: membre_id,
    nom,
    prenom,
    telephone,
    email,
    fonction,
    details_fonction,
    champ_intervention,
    niveau_acces,
  } = membre;

  const isCurrentUser = currentUserId === membre_id;

  const onRemove = () => {
    if (
      confirm(
        'Etes-vous sûr de vouloir retirer cette utilisateur de la collectivité ?'
      )
    ) {
      removeFromCollectivite(membre_id);
    }
  };

  return (
    <tr className={rowClassNames}>
      <td className={cellClassNames}>
        <span className="font-bold">
          {nom} {prenom} {isCurrentUser}
        </span>
        <span className="block mt-1 text-xs text-gray-500">{email}</span>
      </td>
      <td className={cellClassNames}>
        <span>{telephone}</span>
      </td>
      <td className={cellClassNames}>
        {/* <span>{user.fonction}</span> */}
        {isCurrentUser ? (
          <FonctionDropdown
            value={fonction}
            labels={membreFonctionLabels}
            onChange={value =>
              updateMembre({membre_id, name: 'fonction', value})
            }
          />
        ) : (
          <span>{fonction && membreFonctionLabels[fonction]}</span>
        )}
      </td>
      <td className={`${cellClassNames} pr-0`}>
        {isCurrentUser ? (
          <ChampsInterventionDropdown
            values={champ_intervention ?? []}
            options={interventionOptions}
            onChange={value =>
              updateMembre({membre_id, name: 'champ_intervention', value})
            }
          />
        ) : (
          (champ_intervention ?? []).map(champ => (
            <span key={champ} className="block">
              {referentielToName[champ]}
            </span>
          ))
        )}
      </td>
      <td className={cellClassNames}>
        {isCurrentUser ? (
          <div className="py-1 px-2 border border-gray-300">
            <textarea
              value={details_fonction}
              className="w-full resize-none"
              onChange={e =>
                updateMembre({
                  membre_id,
                  name: 'details_fonction',
                  value: e.target.value,
                })
              }
            />
          </div>
        ) : (
          <span title={details_fonction} className="w-72 line-clamp-3">
            {details_fonction}
          </span>
        )}
      </td>
      <td className={`${cellClassNames} text-right`}>
        {isCurrentUser || currentUserAccess === 'admin' ? (
          <AccesDropdown
            isCurrentUser={isCurrentUser}
            currentUserAccess={currentUserAccess}
            value={niveau_acces}
            labels={niveauAccesLabels}
            onChange={value =>
              updateMembre({membre_id, name: 'niveau_access', value})
            }
            onRemove={onRemove}
          />
        ) : (
          <span>{niveauAccesLabels[niveau_acces]}</span>
        )}
      </td>
    </tr>
  );
};

export default MembreListTableRow;

const FonctionDropdown = ({
  value,
  labels,
  onChange,
}: {
  value?: TMembreFonction;
  labels: Record<TMembreFonction, string>;
  onChange: (value: TMembreFonction) => void;
}) => {
  return (
    <div className="group relative">
      <button className="flex items-center w-full p-2 -ml-2 text-left">
        {value ? <span className="mr-auto">{labels[value]}</span> : null}
        <span className="fr-fi-arrow-down-s-line mt-1 ml-1 scale-90 group-focus-within:rotate-180" />
      </button>
      <div className="bg-white invisible absolute -left-2 top-full min-w-full w-max transition-all opacity-0 shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        {Object.keys(labels).map(v => (
          <button
            key={v}
            className="flex items-center w-full p-2 text-left"
            onClick={() => onChange(v as TMembreFonction)}
          >
            <div className="w-6 mr-2">
              {value === v ? (
                <span className="block fr-fi-check-line scale-75" />
              ) : null}
            </div>
            <span>{labels[v as TMembreFonction]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ChampsInterventionDropdown = ({
  values,
  options,
  onChange,
}: {
  values: Referentiel[];
  options: Referentiel[];
  onChange: (value: Referentiel[]) => void;
}) => {
  const updateSelectedOptions = (clickedOption: Referentiel) => {
    const index = options.indexOf(clickedOption);
    return index !== -1
      ? // génère un nouveau tableau sans l'option retirée
        [...options.slice(0, index), ...options.slice(index + 1)]
      : // ou avec l'option ajoutée
        [...options, clickedOption];
  };

  return (
    <div className="group relative">
      <button className="flex items-center w-full p-2 -ml-2 text-left">
        <div className="mr-auto">
          {values.map(v => (
            <span key={v} className="block">
              {referentielToName[v]}
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
            onClick={() => onChange(updateSelectedOptions(v as Referentiel))}
          >
            <div className="w-6 mr-2">
              {values.find(value => value === v) ? (
                <span className="block fr-fi-check-line scale-75" />
              ) : null}
            </div>
            <span>{referentielToName[v]}</span>
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
  onChange: (value: TNiveauAcces) => void;
  onRemove: () => void;
};

const AccesDropdown = ({
  isCurrentUser,
  currentUserAccess,
  value,
  labels,
  onChange,
  onRemove,
}: AccesDropdownProps) => {
  return (
    <div className="group relative flex -mr-2">
      <button className="flex items-center ml-auto p-2 text-left">
        <span className="fr-fi-arrow-down-s-line mt-1 mr-1 scale-90 group-focus-within:rotate-180" />
        <span className="mr-auto">{labels[value]}</span>
      </button>
      <div className="bg-white invisible absolute right-0 top-full min-w-full w-max transition-all opacity-0 shadow-md group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-1 z-50">
        {currentUserAccess === 'admin' ? (
          Object.keys(labels).map(v => (
            <button
              className="flex items-center w-full p-2 pr-4 text-left"
              key={v}
              onClick={() => onChange(v as TNiveauAcces)}
            >
              <div className="w-6 mr-2">
                {value === v ? (
                  <span className="block fr-fi-check-line scale-75" />
                ) : null}
              </div>
              <div>
                <div>{labels[v as TNiveauAcces]}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {niveauAccessDetail[v as TNiveauAcces]}
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
                {niveauAccessDetail[currentUserAccess]}
              </div>
            </div>
          </div>
        )}
        <button
          className="flex w-full px-2 py-4 text-left text-red-600"
          onClick={onRemove}
        >
          <div className="w-8" />
          {`${
            isCurrentUser ? 'Retirer mon accès à' : 'Retirer ce membre de'
          } la collectivité`}
        </button>
      </div>
    </div>
  );
};
