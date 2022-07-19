import {TNiveauAcces, TRemoveFromCollectivite, TUpdateMembre} from '../types';
import {Membre, TMembreFonction} from 'app/pages/collectivite/Users/types';
import {Referentiel} from 'types/litterals';
import {referentielToName} from 'app/labels';
import {MultiSelectDropdown, SelectDropdown} from 'ui/shared/SelectDropdown';
import {pick} from 'ramda';
import {useState} from 'react';

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
  const isAdmin = currentUserAccess === 'admin';
  const canUpdate = isAdmin || isCurrentUser;
  const onRemove = () => {
    if (
      confirm(
        isCurrentUser
          ? 'Êtes-vous sûr de vouloir vous retirer de la collectivité ?'
          : 'Êtes-vous sûr de vouloir retirer cette utilisateur de la collectivité ?'
      )
    ) {
      removeFromCollectivite(membre_id);
    }
  };

  return (
    <tr className={rowClassNames}>
      <td className={cellClassNames}>
        <span className="font-bold">
          {prenom} {nom}
        </span>
        <span className="block mt-1 text-xs text-gray-500">{email}</span>
      </td>
      <td className={cellClassNames}>
        <span>{telephone}</span>
      </td>
      <td className={cellClassNames}>
        {canUpdate ? (
          <FonctionDropdown
            value={fonction}
            onChange={value =>
              updateMembre({membre_id, name: 'fonction', value})
            }
          />
        ) : (
          <span>{fonction && membreFonctionLabels[fonction]}</span>
        )}
      </td>
      <td className={`${cellClassNames} pr-0`}>
        {canUpdate ? (
          <ChampsInterventionDropdown
            values={champ_intervention ?? []}
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
        {canUpdate ? (
          <div className="py-1 px-2 border border-gray-300">
            <DetailsFonctionTextarea
              details_fonction={details_fonction ?? ''}
              save={value =>
                updateMembre({
                  membre_id,
                  name: 'details_fonction',
                  value,
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
        {canUpdate ? (
          <AccesDropdown
            isCurrentUser={isCurrentUser}
            currentUserAccess={currentUserAccess}
            value={niveau_acces}
            onChange={value =>
              updateMembre({membre_id, name: 'niveau_acces', value})
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

const DetailsFonctionTextarea = ({
  details_fonction,
  save,
}: {
  details_fonction: string;
  save: (value: string) => void;
}) => {
  const [value, setValue] = useState(details_fonction);
  return (
    <textarea
      value={value}
      className="w-full resize-none"
      onChange={e => setValue(e.target.value)}
      onMouseOut={() => save(value)}
    />
  );
};
const FonctionDropdown = ({
  value,
  onChange,
}: {
  value?: TMembreFonction;
  onChange: (value: TMembreFonction) => void;
}) => (
  <SelectDropdown
    labels={membreFonctionLabels}
    value={value}
    onSelect={onChange}
  />
);

const ChampsInterventionDropdown = ({
  values,
  onChange,
}: {
  values: Referentiel[];
  onChange: (value: Referentiel[]) => void;
}) => (
  <MultiSelectDropdown
    labels={pick(['eci', 'cae'], referentielToName)}
    onSelect={onChange}
    values={values}
  />
);

type TAccesDropdownOption = TNiveauAcces | 'remove';

const AccessDropdownLabel = ({
  option,
  isCurrentUser,
  currentUserAccess,
}: {
  option: TAccesDropdownOption;
  isCurrentUser: boolean;
  currentUserAccess: TNiveauAcces;
}) => {
  if (option === 'remove')
    return (
      <span className="flex w-full px-2 py-4 text-left text-red-600">
        {isCurrentUser
          ? 'Retirer mon accès à la collectivité'
          : 'Retirer ce membre de la collectivité'}
      </span>
    );
  if (currentUserAccess === 'admin')
    return (
      <div>
        <div>{niveauAccesLabels[option]}</div>
        <div className="mt-1 text-xs text-gray-500">
          {niveauAccessDetail[option]}
        </div>
      </div>
    );
  return null;
};

type TAccesDropdownProps = {
  isCurrentUser: boolean;
  currentUserAccess: TNiveauAcces;
  value: TAccesDropdownOption;
  onChange: (value: TNiveauAcces) => void;
  onRemove: () => void;
};

const AccesDropdown = ({
  isCurrentUser,
  currentUserAccess,
  value,
  onChange,
  onRemove,
}: TAccesDropdownProps) => {
  const onSelect = (option: TAccesDropdownOption) =>
    option === 'remove' ? onRemove() : onChange(option);
  return (
    <SelectDropdown
      value={value}
      onSelect={onSelect}
      labels={{...niveauAccesLabels, remove: 'Supprimé'}}
      options={
        currentUserAccess === 'admin'
          ? ['admin', 'edition', 'lecture', 'remove']
          : ['remove']
      }
      displayOption={value => (
        <AccessDropdownLabel
          option={value}
          isCurrentUser={isCurrentUser}
          currentUserAccess={currentUserAccess}
        />
      )}
    />
  );
};
