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
    invitationId,
    userId,
    nom,
    prenom,
    email,
    fonction,
    detailsFonction,
    champIntervention,
    niveauAcces,
  } = membre;

  const isCurrentUser = currentUserId === userId;
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
    userId && canUpdate ? selectCellClassnames : defaultCellClassnames;

  return (
    <>
      <TRow data-test={`MembreRow-${email}`} className={rowClassnames}>
        {/* Nom et adresse mail */}
        <TCell className={defaultCellClassnames}>
          <div className="text-sm text-primary-10 font-bold">
            {userId ? `${prenom} ${nom}` : 'Création de compte en attente'}
          </div>
          <div className="text-xs text-grey-8">{email}</div>
        </TCell>

        {/* Fonction */}
        <TCell className={cellClassnames}>
          {userId && canUpdate ? (
            <FonctionDropdown
              value={fonction}
              onChange={(value) =>
                updateMembres([{ collectiviteId, userId, fonction: value }])
              }
            />
          ) : (
            fonction && membreFonctions.find((v) => v.value === fonction)?.label
          )}
        </TCell>

        {/* Champ d'intervention */}
        <TCell className={cellClassnames}>
          {userId && canUpdate ? (
            <ChampsInterventionDropdown
              values={champIntervention ?? []}
              onChange={(value) =>
                updateMembres([
                  {
                    collectiviteId,
                    userId,
                    champIntervention: value,
                  },
                ])
              }
            />
          ) : (
            (champIntervention ?? []).map((champ) => (
              <div key={champ}>{referentielToName[champ]}</div>
            ))
          )}
        </TCell>

        {/* Intitulé de poste */}
        <TCell className={cellClassnames}>
          {userId && canUpdate ? (
            <DetailsFonctionTextarea
              details_fonction={detailsFonction ?? ''}
              save={(value) =>
                updateMembres([
                  {
                    collectiviteId,
                    userId,
                    detailsFonction: value,
                  },
                ])
              }
            />
          ) : (
            detailsFonction && (
              <span title={detailsFonction} className="line-clamp-3">
                {detailsFonction}
              </span>
            )
          )}
        </TCell>

        {/* Accès */}
        <TCell className={cellClassnames}>
          {userId && canUpdate ? (
            <AccesDropdown
              currentUserAccess={currentUserAccess}
              value={niveauAcces}
              onSelect={(value) => {
                // demande confirmation avant de changer le niveau d'accès de l'admin lui-même
                if (isCurrentUser && niveauAcces === 'admin') {
                  setSelectedOption(value);
                  setIsOpenChangeNiveau(true);
                } else {
                  updateMembre({ membre_id, name: 'niveau_acces', value });
                }
              }}
            />
          ) : (
            <BadgeAcces acces={membre.niveauAcces} size="sm" />
          )}
        </TCell>

        {/* Statut */}
        <TCell className={defaultCellClassnames}>
          <Tooltip
            label={
              userId ? 'Rattachement effectué' : 'En attente de validation'
            }
          >
            <div className="flex justify-center items-center">
              <Badge
                icon={userId ? 'checkbox-circle-fill' : 'hourglass-line'}
                state={userId ? 'success' : 'warning'}
                size="sm"
              />
            </div>
          </Tooltip>
        </TCell>

        {/* Actions */}
        <TCell className={defaultCellClassnames}>
          <div className="flex gap-2 justify-start items-center">
            {userId && isEditor && (
              <Tooltip label="Associer ce compte à un tag">
                <Button
                  size="xs"
                  variant="grey"
                  icon="user-add-line"
                  disabled={!!invitationId}
                  onClick={() => setIsLinkModalOpen(true)}
                />
              </Tooltip>
            )}

            {canUpdate && (
              <>
                {!userId && (
                  <Tooltip label="Renvoyer l'invitation">
                    <Button
                      size="xs"
                      variant="grey"
                      icon="mail-send-line"
                      disabled={!invitationId}
                      onClick={() =>
                        invitationId &&
                        email &&
                        sendInvitation({ invitationId: invitationId, email })
                      }
                    />
                  </Tooltip>
                )}

                <Tooltip
                  label={
                    userId
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
      {userId && canUpdate && isOpenChangeNiveau && (
        <ConfirmerChangementNiveau
          isOpen={isOpenChangeNiveau}
          setIsOpen={setIsOpenChangeNiveau}
          selectedOption={selectedOption}
          membre={membre}
          collectiviteId={collectiviteId}
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
