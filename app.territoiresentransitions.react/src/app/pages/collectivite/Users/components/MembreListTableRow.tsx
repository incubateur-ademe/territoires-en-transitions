import {useState} from 'react';
import {Button, Icon, Tooltip} from '@tet/ui';

import SelectDropdown from 'ui/shared/select/SelectDropdown';
import MultiSelectDropdown from 'ui/shared/select/MultiSelectDropdown';
import {ConfirmerSuppressionMembre} from './ConfirmerSuppressionMembre';
import {
  Membre,
  TRemoveFromCollectivite,
  TUpdateMembre,
} from 'app/pages/collectivite/Users/types';
import {Referentiel} from 'types/litterals';
import {referentielToName} from 'app/labels';
import {TNiveauAcces, TMembreFonction} from 'types/alias';
import {SendInvitationArgs} from '../useSendInvitation';
import {ConfirmerChangementNiveau} from 'app/pages/collectivite/Users/components/ConfirmerChangementNiveau';

export type TMembreListTableRowProps = {
  currentUserId: string;
  currentUserAccess: TNiveauAcces;
  membre: Membre;
  updateMembre: TUpdateMembre;
  removeFromCollectivite: TRemoveFromCollectivite;
  sendInvitation: (args: SendInvitationArgs) => void;
};

const membreFonctions: {value: TMembreFonction; label: string}[] = [
  {value: 'referent', label: 'Référent·e'},
  {value: 'technique', label: 'Équipe technique'},
  {value: 'politique', label: 'Équipe politique'},
  {value: 'conseiller', label: "Bureau d'études"},
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
const cellClassNames = 'px-4';

const MembreListTableRow = (props: TMembreListTableRowProps) => {
  const {membre} = props;

  // l'affichage est différent si le membre est en attente ou non d'acceptation d'une invitation
  return membre.user_id ? (
    <MembreListTableRowAttache {...props} />
  ) : (
    <MembreListTableRowInvite {...props} />
  );
};

/**
 * Affiche une ligne représentant un membre invité à rejoindre la collectivité
 */
const MembreListTableRowInvite = ({
  currentUserId,
  currentUserAccess,
  membre,
  removeFromCollectivite,
  sendInvitation,
}: TMembreListTableRowProps) => {
  const {user_id, email, niveau_acces, invitation_id} = membre;

  const isCurrentUser = currentUserId === user_id;
  const isAdmin = currentUserAccess === 'admin';
  const canUpdate = isAdmin || isCurrentUser;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <tr data-test={`MembreRow-${email}`} className={rowClassNames}>
      <td colSpan={4} className={cellClassNames}>
        <span className="block mb-0.5 text-xs text-gray-500">{email}</span>
        <span className="font-medium text-xs text-gray-600">
          Création de compte en attente
        </span>
      </td>
      <td className={cellClassNames}>
        <span>{niveauAcces.find(v => v.value === niveau_acces)?.label}</span>
      </td>
      <td className={cellClassNames}>
        <Tooltip label="En attente de validation">
          <Icon
            className="bg-warning-2 text-warning-1 p-2 rounded"
            icon="hourglass-line"
          />
        </Tooltip>
      </td>
      <td className={cellClassNames}>
        {canUpdate && (
          <div className="flex flex-row gap-4">
            <Tooltip label="Supprimer l'invitation">
              <Button
                size="sm"
                variant="outlined"
                icon="delete-bin-6-line"
                onClick={() => setIsOpen(true)}
              />
            </Tooltip>
            <ConfirmerSuppressionMembre
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              membre={membre}
              isCurrentUser={isCurrentUser}
              removeFromCollectivite={removeFromCollectivite}
            />
            {invitation_id && (
              <Tooltip label="Renvoyer l'invitation">
                <Button
                  size="sm"
                  variant="outlined"
                  icon="mail-send-line"
                  onClick={() =>
                    sendInvitation({invitationId: invitation_id, email})
                  }
                />
              </Tooltip>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

/**
 * Affiche une ligne représentant un membre de la collectivité
 */
const MembreListTableRowAttache = (props: TMembreListTableRowProps) => {
  const {
    currentUserId,
    currentUserAccess,
    membre,
    updateMembre,
    removeFromCollectivite,
  } = props;
  const {
    user_id: membre_id,
    nom,
    prenom,
    email,
    fonction,
    details_fonction,
    champ_intervention,
    niveau_acces,
  } = membre;

  const isCurrentUser = currentUserId === membre_id;
  const isAdmin = currentUserAccess === 'admin';
  const canUpdate = isAdmin || isCurrentUser;

  // indique si les modales de confirmaiton sont ouvertes ou non
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenChangeNiveau, setIsOpenChangeNiveau] = useState(false);

  // valeur du selecteur d'accès pour la donner à la modale de confirmation
  const [selectedOption, setSelectedOption] = useState<
    TAccesDropdownOption | undefined
  >(undefined);

  if (!membre_id) {
    return;
  }

  return (
    <tr data-test={`MembreRow-${email}`} className={rowClassNames}>
      <td className={cellClassNames}>
        <span className="font-bold">
          {prenom} {nom}
        </span>
        <span className="block mt-1 text-xs text-gray-500">{email}</span>
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
      <td className={cellClassNames}>
        {canUpdate ? (
          <AccesDropdown
            isCurrentUser={isCurrentUser}
            currentUserAccess={currentUserAccess}
            value={niveau_acces}
            onSelect={value => {
              // demande confirmation avant de changer le niveau d'accès de l'admin lui-même
              if (isCurrentUser && niveau_acces === 'admin') {
                setSelectedOption(value);
                setIsOpenChangeNiveau(true);
              } else {
                updateMembre({membre_id, name: 'niveau_acces', value});
              }
            }}
          />
        ) : (
          <span>{niveauAcces.find(v => v.value === niveau_acces)?.label}</span>
        )}
      </td>
      <td className={cellClassNames}>
        <Tooltip label="Rattachement effectué">
          <Icon
            className="bg-success-2 text-success-1 p-2 rounded"
            icon="checkbox-circle-fill"
          />
        </Tooltip>
      </td>
      <td className={cellClassNames}>
        {canUpdate && (
          <>
            <Tooltip
              label={
                isCurrentUser
                  ? 'Retirer mon accès à la collectivité'
                  : 'Retirer ce membre de la collectivité'
              }
            >
              <Button
                data-test="delete"
                size="sm"
                variant="outlined"
                icon="delete-bin-6-line"
                onClick={() => setIsOpen(true)}
              />
            </Tooltip>
            <ConfirmerSuppressionMembre
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              membre={membre}
              isCurrentUser={isCurrentUser}
              removeFromCollectivite={removeFromCollectivite}
            />
            <ConfirmerChangementNiveau
              isOpen={isOpenChangeNiveau}
              setIsOpen={setIsOpenChangeNiveau}
              selectedOption={selectedOption}
              membre={membre}
              updateMembre={() =>
                updateMembre({
                  membre_id,
                  name: 'niveau_acces',
                  value: selectedOption ?? 'lecture',
                })
              }
            />
          </>
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
  value?: TMembreFonction;
  onChange: (value: TMembreFonction) => void;
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

export type TAccesDropdownOption = TNiveauAcces;

const AccessDropdownLabel = ({
  option,
  currentUserAccess,
}: {
  option: TAccesDropdownOption;
  currentUserAccess: TNiveauAcces;
}) => {
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
  if (currentUserAccess !== 'admin')
    return niveauAcces.find(v => v.value === currentUserAccess)?.label;

  return (
    <div data-test="acces-dropdown">
      <SelectDropdown
        placement="bottom-end"
        value={value}
        onSelect={onSelect}
        options={niveauAcces}
        renderSelection={value => (
          <span className="mr-auto">
            {niveauAcces.find(v => v.value === value)?.label}
          </span>
        )}
        renderOption={option => (
          <AccessDropdownLabel
            option={option.value as TNiveauAcces}
            currentUserAccess={currentUserAccess}
          />
        )}
      />
    </div>
  );
};
