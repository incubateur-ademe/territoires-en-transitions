import {useState} from 'react';

import SelectDropdown from 'ui/shared/select/SelectDropdown';
import MultiSelectDropdown from 'ui/shared/select/MultiSelectDropdown';
import UpdateMemberAccesModal from 'app/pages/collectivite/Users/components/UpdateMembreAccesModal';
import {
  Membre,
  TNiveauAcces,
  TRemoveFromCollectivite,
  TUpdateMembre,
} from 'app/pages/collectivite/Users/types';
import {Referentiel} from 'types/litterals';
import {referentielToName} from 'app/labels';
import {MembreFonction} from 'generated/dataLayer/membres';

export type TMembreListTableRowProps = {
  currentUserId: string;
  currentUserAccess: TNiveauAcces;
  membre: Membre;
  updateMembre: TUpdateMembre;
  removeFromCollectivite: TRemoveFromCollectivite;
};

const membreFonctions: {value: MembreFonction; label: string}[] = [
  {value: 'referent', label: 'Référent·e'},
  {value: 'technique', label: 'Équipe technique'},
  {value: 'politique', label: 'Équipe politique'},
  {value: 'conseiller', label: 'Conseiller·e'},
  {value: 'partenaire', label: 'Partenaire'},
];

const niveauAcces: {value: TNiveauAcces; label: string}[] = [
  {value: 'admin', label: 'Admin'},
  {value: 'edition', label: 'Édition'},
  {value: 'lecture', label: 'Lecture'},
];

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
    // telephone,
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

  const onAccesSelect = (value: TAccesDropdownOption) => {
    // Comme nous n'affichons pas de modal lors du changement d'accès d'un autre utilisateur que soit même,
    // on crée une condition afin d'ouvrir la modal ou directement changer l'accès d'un tierce
    if (isCurrentUser || value === 'remove') {
      setAccesOptionSelected(value);
      setIsAccesModalOpen(true);
    } else if (membre_id) {
      updateMembre({membre_id, name: 'niveau_acces', value});
    }
  };

  const onRemoveInvite = (membreEmail: string) => {
    removeFromCollectivite(membreEmail);
  };

  // Si le membre est en attente d'acceptation d'une invitation
  if (membre_id === null) {
    return (
      <tr data-test={`MembreRow-${email}`} className={rowClassNames}>
        {/* Mettre le valeur colSpan à 5 quand l'ion remet la colonne téléphone */}
        <td colSpan={4} className={cellClassNames}>
          <span className="block mb-0.5 text-xs text-gray-500">{email}</span>
          <span className="font-medium text-xs text-gray-600">
            Création de compte en attente
          </span>
        </td>
        <td className={`${cellClassNames}`}>
          {/* currentUserAccess="edition" permet de n'afficher que l'option "remove" même en étant admin */}
          {canUpdate ? (
            <>
              <AccesDropdown
                isCurrentUser={isCurrentUser}
                currentUserAccess="edition"
                value={niveau_acces}
                onSelect={onAccesSelect}
              />
              <UpdateMemberAccesModal
                isOpen={isAccesModalOpen}
                setIsOpen={setIsAccesModalOpen}
                selectedOption={accesOptionSelected}
                membreId={membre_id}
                membreEmail={membre.email}
                isCurrentUser={isCurrentUser}
                updateMembre={updateMembre}
                removeFromCollectivite={removeFromCollectivite}
                removeInvite={onRemoveInvite}
              />
            </>
          ) : (
            <span>
              {niveauAcces.find(v => v.value === niveau_acces)?.label}
            </span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr data-test={`MembreRow-${email}`} className={rowClassNames}>
      <td className={cellClassNames}>
        <span className="font-bold">
          {prenom} {nom}
        </span>
        <span className="block mt-1 text-xs text-gray-500">{email}</span>
      </td>
      {/* En attente de la page gestion de compte */}
      {/* <td className={cellClassNames}>
        <span>{telephone}</span>
      </td> */}
      <td className={cellClassNames}>
        {canUpdate ? (
          <FonctionDropdown
            value={fonction}
            onChange={value =>
              updateMembre({membre_id, name: 'fonction', value})
            }
          />
        ) : (
          <span>
            {fonction && membreFonctions.find(v => v.value === fonction)?.label}
          </span>
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
      <td className={`w-96 ${cellClassNames}`}>
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
          <span title={details_fonction} className="line-clamp-3">
            {details_fonction}
          </span>
        )}
      </td>
      <td className={`${cellClassNames}`}>
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
              membreEmail={membre.email}
              isCurrentUser={isCurrentUser}
              updateMembre={updateMembre}
              removeFromCollectivite={removeFromCollectivite}
              removeInvite={onRemoveInvite}
            />
          </>
        ) : (
          <span>{niveauAcces.find(v => v.value === niveau_acces)?.label}</span>
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
      className="w-full cursor-text resize-none"
      onChange={e => setValue(e.target.value)}
      onBlur={() => details_fonction !== value && save(value)}
    />
  );
};

const FonctionDropdown = ({
  value,
  onChange,
}: {
  value?: MembreFonction;
  onChange: (value: MembreFonction) => void;
}) => (
  <div data-test="fonction-dropdown">
    <SelectDropdown
      value={value}
      options={membreFonctions}
      onSelect={onChange}
      placeholderText="À renseigner"
    />
  </div>
);

const referentiels = [
  {label: referentielToName['eci'], value: 'eci'},
  {label: referentielToName['cae'], value: 'cae'},
];

const ChampsInterventionDropdown = ({
  values,
  onChange,
}: {
  values: Referentiel[];
  onChange: (value: Referentiel[]) => void;
}) => (
  <div data-test="champ_intervention-dropdown">
    <MultiSelectDropdown
      options={referentiels}
      onSelect={onChange}
      values={values}
      placeholderText="À renseigner"
      renderSelection={values => (
        <span className="mr-auto flex flex-col gap-2">
          {values.sort().map((value, index) => (
            <div key={value}>
              {referentiels.find(({value: v}) => v === value)?.label || ''}
            </div>
          ))}
        </span>
      )}
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
        <div>{niveauAcces.find(v => v.value === option)?.label}</div>
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
        options={
          currentUserAccess === 'admin'
            ? [...niveauAcces, {value: 'remove', label: 'Supprimé'}]
            : [{value: 'remove', label: 'Supprimé'}]
        }
        renderSelection={value => (
          <span className="mr-auto">
            {niveauAcces.find(v => v.value === value)?.label}
          </span>
        )}
        renderOption={value => (
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
