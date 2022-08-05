import {useState} from 'react';
import {pick} from 'ramda';

import {MultiSelectDropdown, SelectDropdown} from 'ui/shared/SelectDropdown';
import {
  Membre,
  TMembreFonction,
  TNiveauAcces,
  TRemoveFromCollectivite,
  TUpdateMembre,
} from 'app/pages/collectivite/Users/types';
import {Referentiel} from 'types/litterals';
import {referentielToName} from 'app/labels';
import UpdateMemberAccesModal from 'app/pages/collectivite/Users/components/UpdateMembreAccesModal';

export type TMembreListTableRowProps = {
  currentUserId: string;
  currentUserAccess: TNiveauAcces;
  membre: Membre;
  updateMembre: TUpdateMembre;
  removeFromCollectivite: TRemoveFromCollectivite;
};

const membreFonctionLabels: Record<TMembreFonction, string> = {
  referent: 'Référent·e',
  technique: 'Équipe technique',
  politique: 'Équipe politique',
  conseiller: 'Conseiller·e',
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

  // Ce state est utilisé pour gérer l'affichage de la modal au click sans boutton
  // car les boutons sont situés à l'intérieur du select
  const [isAccesModalOpen, setIsAccesModalOpen] = useState(false);

  // Récupère la valeur du selecteur d'accès pour la donner à la modal
  const [accesOptionSelected, setAccesOptionSelected] = useState<
    TAccesDropdownOption | undefined
  >(undefined);

  // Si le membre est en attente d'acceptation d'une invitation
  if (membre_id === null) {
    return (
      <tr data-test={`MembreRow-${email}`} className={rowClassNames}>
        <td colSpan={5} className={cellClassNames}>
          <span className="block mb-1 text-sm text-gray-500">{email}</span>
          <span className="text-sm text-gray-600">
            Création de compte en attente
          </span>
        </td>
        <td className={`${cellClassNames} text-right`}>
          <span>{niveauAccesLabels[niveau_acces]}</span>
        </td>
      </tr>
    );
  }

  const onAccesSelect = (value: TAccesDropdownOption) => {
    // Comme nous n'affichons pas de modal lors du changement d'accès d'un autre utilisateur que soit même,
    // on crée une condition afin d'ouvrir la modal ou directement changer l'accès d'un tierce
    if (isCurrentUser || value === 'remove') {
      setAccesOptionSelected(value);
      setIsAccesModalOpen(true);
    } else {
      updateMembre({membre_id, name: 'niveau_acces', value});
    }
  };

  return (
    <tr data-test={`MembreRow-${email}`} className={rowClassNames}>
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
          <>
            <AccesDropdown
              isCurrentUser={isCurrentUser}
              currentUserAccess={currentUserAccess}
              value={niveau_acces}
              onSelect={onAccesSelect}
            />
            <UpdateMemberAccesModal
              isOpen={isAccesModalOpen}
              setIsOpen={setIsAccesModalOpen}
              selectedOption={accesOptionSelected}
              membreId={membre_id}
              isCurrentUser={isCurrentUser}
              updateMembre={updateMembre}
              removeFromCollectivite={removeFromCollectivite}
            />
          </>
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
      data-test="details_fonction-textarea"
      value={value}
      className=" w-60 resize-none"
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
  <div data-test="fonction-dropdown">
    <SelectDropdown
      labels={membreFonctionLabels}
      value={value}
      onSelect={onChange}
      placeholderText="À renseigner"
    />
  </div>
);

const ChampsInterventionDropdown = ({
  values,
  onChange,
}: {
  values: Referentiel[];
  onChange: (value: Referentiel[]) => void;
}) => (
  <div data-test="champ_intervention-dropdown">
    <MultiSelectDropdown
      labels={pick(['eci', 'cae'], referentielToName)}
      onSelect={onChange}
      values={values}
      placeholderText="À renseigner"
    />
  </div>
);

export type TAccesDropdownOption = TNiveauAcces | 'remove';

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
      <span
        aria-label="retirer l'acces"
        className="flex w-full py-2 text-left text-red-600"
      >
        {isCurrentUser
          ? 'Retirer mon accès à la collectivité'
          : 'Retirer ce membre de la collectivité'}
      </span>
    );
  if (currentUserAccess === 'admin')
    return (
      <div>
        <div>{niveauAccesLabels[option]}</div>
        <div
          aria-label={niveauAccessDetail[option]}
          className="mt-1 text-xs text-gray-500"
        >
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
  onSelect: (value: TAccesDropdownOption) => void;
};

const AccesDropdown = ({
  isCurrentUser,
  currentUserAccess,
  value,
  onSelect,
}: TAccesDropdownProps) => {
  return (
    <div data-test="acces-dropdown">
      <SelectDropdown
        placement="bottom-end"
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
    </div>
  );
};
