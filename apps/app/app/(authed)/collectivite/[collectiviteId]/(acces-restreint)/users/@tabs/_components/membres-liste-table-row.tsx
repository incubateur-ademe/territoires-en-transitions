import { membreFonctions, referentielToName } from '@/app/app/labels';
import { CollectiviteMembre } from '@/app/referentiels/tableau-de-bord/referents/useMembres';
import { UpdateMembresFunction } from '@/app/referentiels/tableau-de-bord/referents/useUpdateMembres';
import { TNiveauAcces } from '@/app/types/alias';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Badge, Button, TCell, TRow, Tooltip } from '@/ui';
import { useState } from 'react';
import BadgeAcces from '../../_components/badge-acces';
import { ConfirmerChangementNiveau } from '../../_components/ConfirmerChangementNiveau';
import { ConfirmerSuppressionMembre } from '../../_components/ConfirmerSuppressionMembre';
import { SendInvitationArgs } from '../../_components/use-invite-member';
import LinkAccountToTagModal from './link-account-to-tag-modal';
import {
  AccesDropdown,
  ChampsInterventionDropdown,
  DetailsFonctionTextarea,
  FonctionDropdown,
  TAccesDropdownOption,
} from './MembreListTableRow';

export const niveauAcces: { value: TNiveauAcces; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'edition', label: 'Édition' },
  { value: 'lecture', label: 'Lecture' },
];

export type TMembreListTableRowProps = {
  collectiviteId: number;
  currentUserId: string;
  currentUserAccess: TNiveauAcces;
  membre: CollectiviteMembre;
  updateMembre: TUpdateMembre;
  sendInvitation: (args: SendInvitationArgs) => void;
};

const MembresListeTableRow = ({
  collectiviteId,
  currentUserId,
  currentUserAccess,
  membre,
  updateMembre,
  sendInvitation,
}: TMembreListTableRowProps) => {
  const {
    invitation_id,
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
  const isEditor = isAdmin || currentUserAccess === 'edition';
  const canUpdate = isAdmin || isCurrentUser;

  // indique si les modales de confirmaiton sont ouvertes ou non
  const [isOpenSuppressionMembre, setIsOpenSuppressionMembre] = useState(false);
  const [isOpenChangeNiveau, setIsOpenChangeNiveau] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // valeur du selecteur d'accès pour la donner à la modale de confirmation
  const [selectedOption, setSelectedOption] = useState<
    TAccesDropdownOption | undefined
  >(undefined);

  const rowClassnames = 'h-20';
  const defaultCellClassnames = '!py-3 !px-4 !border-r-0';
  const selectCellClassnames = '!py-2 !px-2 !border-r-0';
  const cellClassnames =
    membre_id && canUpdate ? selectCellClassnames : defaultCellClassnames;

  return (
    <>
      <TRow data-test={`MembreRow-${email}`} className={rowClassnames}>
        {/* Nom et adresse mail */}
        <TCell className={defaultCellClassnames}>
          <div className="text-sm text-primary-10 font-bold">
            {membre_id ? `${prenom} ${nom}` : 'Création de compte en attente'}
          </div>
          <div className="text-xs text-grey-8">{email}</div>
        </TCell>

        {/* Fonction */}
        <TCell className={cellClassnames}>
          {membre_id && canUpdate ? (
            <FonctionDropdown
              value={fonction}
              onChange={(value) =>
                updateMembre({ membre_id, name: 'fonction', value })
              }
            />
          ) : (
            fonction && membreFonctions.find((v) => v.value === fonction)?.label
          )}
        </TCell>

        {/* Champ d'intervention */}
        <TCell className={cellClassnames}>
          {membre_id && canUpdate ? (
            <ChampsInterventionDropdown
              values={champ_intervention ?? []}
              onChange={(value) =>
                updateMembre({ membre_id, name: 'champ_intervention', value })
              }
            />
          ) : (
            (champ_intervention ?? []).map((champ) => (
              <div key={champ}>{referentielToName[champ]}</div>
            ))
          )}
        </TCell>

        {/* Intitulé de poste */}
        <TCell className={cellClassnames}>
          {membre_id && canUpdate ? (
            <DetailsFonctionTextarea
              details_fonction={details_fonction ?? ''}
              save={(value) =>
                updateMembre({
                  membre_id,
                  name: 'details_fonction',
                  value,
                })
              }
            />
          ) : (
            <span title={details_fonction} className="line-clamp-3">
              {details_fonction}
            </span>
          )}
        </TCell>

        {/* Accès */}
        <TCell className={cellClassnames}>
          {membre_id && canUpdate ? (
            <AccesDropdown
              currentUserAccess={currentUserAccess}
              value={niveau_acces}
              onSelect={(value) => {
                // demande confirmation avant de changer le niveau d'accès de l'admin lui-même
                if (isCurrentUser && niveau_acces === 'admin') {
                  setSelectedOption(value);
                  setIsOpenChangeNiveau(true);
                } else {
                  updateMembre({ membre_id, name: 'niveau_acces', value });
                }
              }}
            />
          ) : (
            <BadgeAcces
              acces={niveauAcces.find((v) => v.value === niveau_acces)?.value}
              size="sm"
            />
          )}
        </TCell>

        {/* Statut */}
        <TCell className={defaultCellClassnames}>
          <Tooltip
            label={
              membre_id ? 'Rattachement effectué' : 'En attente de validation'
            }
          >
            <div className="flex justify-center items-center">
              <Badge
                icon={membre_id ? 'checkbox-circle-fill' : 'hourglass-line'}
                state={membre_id ? 'success' : 'warning'}
                size="sm"
              />
            </div>
          </Tooltip>
        </TCell>

        {/* Actions */}
        <TCell className={defaultCellClassnames}>
          <div className="flex gap-2 justify-start items-center">
            {membre_id && isEditor && (
              <Tooltip label="Associer ce compte à un tag">
                <Button
                  size="xs"
                  variant="grey"
                  icon="user-add-line"
                  disabled={!!invitation_id}
                  onClick={() => setIsLinkModalOpen(true)}
                />
              </Tooltip>
            )}

            {canUpdate && (
              <>
                {!membre_id && (
                  <Tooltip label="Renvoyer l'invitation">
                    <Button
                      size="xs"
                      variant="grey"
                      icon="mail-send-line"
                      disabled={!invitation_id}
                      onClick={() =>
                        !!invitation_id &&
                        sendInvitation({ invitationId: invitation_id, email })
                      }
                    />
                  </Tooltip>
                )}

                <Tooltip
                  label={
                    membre_id
                      ? isCurrentUser
                        ? 'Retirer mon accès à la collectivité'
                        : 'Retirer ce membre de la collectivité'
                      : "Supprimer l'invitation"
                  }
                >
                  <DeleteButton
                    data-test="delete"
                    size="xs"
                    onClick={() => setIsOpenSuppressionMembre(true)}
                  />
                </Tooltip>
              </>
            )}
          </div>
        </TCell>
      </TRow>

      {/* Modales */}
      {membre_id && canUpdate && isOpenChangeNiveau && (
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
      )}

      <LinkAccountToTagModal
        openState={{
          isOpen: isLinkModalOpen,
          setIsOpen: setIsLinkModalOpen,
        }}
        collectiviteId={collectiviteId}
        user={membre}
      />

      {canUpdate && isOpenSuppressionMembre && (
        <ConfirmerSuppressionMembre
          isOpen={isOpenSuppressionMembre}
          setIsOpen={setIsOpenSuppressionMembre}
          membre={membre}
          isCurrentUser={isCurrentUser}
        />
      )}
    </>
  );
};

export default MembresListeTableRow;
