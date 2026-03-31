'use client';

import { membreFonctionToLabel, referentielToName } from '@/app/app/labels';
import { Membre } from '@/app/collectivites/membres/list-membres/use-list-membres';
import { TUpdateMembre } from '@/app/collectivites/membres/use-update-membre';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, TableCell, TableRow, Tooltip } from '@tet/ui';
import { useState } from 'react';
import BadgeAcces from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/badge-acces';
import { ConfirmerChangementNiveau } from '../../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/ConfirmerChangementNiveau';
import { ConfirmerSuppressionMembre } from '../remove-membre/confirm-remove-membre.modal';
import LinkMembreToPersonneTagModal from './link-account-to-tag-modal';
import {
  ChampsInterventionDropdown,
  CollectiviteRoleDropdown,
  DetailsFonctionTextarea,
  FonctionDropdown,
  TAccesDropdownOption,
} from './list-membres.table-row.editable-cell';

export type TMembreListTableRowProps = {
  membre: Membre;
  updateMembre: TUpdateMembre;
  canMutateMembres: boolean;
  canMutateTags: boolean;
  isCurrentUserRow: boolean;
};

const ListMembresTableRow = ({
  membre,
  updateMembre,
  canMutateMembres,
  canMutateTags,
  isCurrentUserRow,
}: TMembreListTableRowProps) => {
  const {
    userId,
    nom,
    prenom,
    email,
    fonction,
    detailsFonction,
    champIntervention,
    role,
  } = membre;

  const { collectiviteId } = useCurrentCollectivite();

  const [isOpenSuppressionMembre, setIsOpenSuppressionMembre] = useState(false);
  const [isOpenChangeNiveau, setIsOpenChangeNiveau] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const [selectedOption, setSelectedOption] = useState<
    TAccesDropdownOption | undefined
  >(undefined);

  return (
    <>
      <TableRow data-test={`MembreRow-${email}`}>
        {/* Nom et adresse mail */}
        <TableCell>
          <div className="text-sm text-primary-10 font-bold">
            {prenom} {nom}
          </div>
          <div className="text-xs text-grey-8">{email}</div>
        </TableCell>

        {/* Fonction */}
        <TableCell>
          {canMutateMembres || isCurrentUserRow ? (
            <FonctionDropdown
              value={fonction ?? undefined}
              onChange={(value) =>
                updateMembre({ userId, name: 'fonction', value })
              }
            />
          ) : fonction ? (
            <div className="text-sm">{membreFonctionToLabel[fonction]}</div>
          ) : null}
        </TableCell>

        {/* Intitulé de poste */}
        <TableCell>
          {canMutateMembres || isCurrentUserRow ? (
            <DetailsFonctionTextarea
              details_fonction={detailsFonction ?? ''}
              save={(value) =>
                updateMembre({
                  userId,
                  name: 'detailsFonction',
                  value,
                })
              }
            />
          ) : (
            <span title={detailsFonction ?? undefined} className="text-sm">
              {detailsFonction}
            </span>
          )}
        </TableCell>

        {/* Champ d'intervention */}
        <TableCell>
          {canMutateMembres || isCurrentUserRow ? (
            <ChampsInterventionDropdown
              values={champIntervention ?? []}
              onChange={(value) =>
                updateMembre({ userId, name: 'champIntervention', value })
              }
            />
          ) : (
            (champIntervention ?? []).map((champ) => (
              <div key={champ} className="text-sm/7">
                {referentielToName[champ]}
              </div>
            ))
          )}
        </TableCell>

        {/* Role */}
        <TableCell>
          {canMutateMembres ? (
            <CollectiviteRoleDropdown
              value={role}
              onSelect={(value) => {
                if (isCurrentUserRow && role === 'admin') {
                  setSelectedOption(value);
                  setIsOpenChangeNiveau(true);
                } else {
                  updateMembre({ userId, name: 'role', value });
                }
              }}
            />
          ) : (
            <BadgeAcces acces={role} size="xs" />
          )}
        </TableCell>

        {/* Actions */}
        {(canMutateTags || canMutateMembres || isCurrentUserRow) && (
          <TableCell>
            <div className="flex gap-2 justify-start items-center">
              {canMutateTags && (
                <Tooltip label="Associer ce compte à un tag">
                  <Button
                    size="xs"
                    variant="grey"
                    icon="user-add-line"
                    onClick={() => setIsLinkModalOpen(true)}
                  />
                </Tooltip>
              )}

              {(canMutateMembres || isCurrentUserRow) && (
                <Tooltip
                  label={
                    isCurrentUserRow
                      ? 'Retirer mon accès à la collectivité'
                      : 'Retirer ce membre de la collectivité'
                  }
                >
                  <DeleteButton
                    data-test="delete"
                    size="xs"
                    onClick={() => setIsOpenSuppressionMembre(true)}
                  />
                </Tooltip>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>

      {/* Modales */}
      {canMutateMembres && isOpenChangeNiveau && (
        <ConfirmerChangementNiveau
          isOpen={isOpenChangeNiveau}
          setIsOpen={setIsOpenChangeNiveau}
          selectedOption={selectedOption}
          membre={membre}
          updateMembre={() =>
            updateMembre({
              userId,
              name: 'role',
              value: selectedOption ?? 'lecture',
            })
          }
        />
      )}

      {canMutateTags && isLinkModalOpen && (
        <LinkMembreToPersonneTagModal
          openState={{
            isOpen: isLinkModalOpen,
            setIsOpen: setIsLinkModalOpen,
          }}
          collectiviteId={collectiviteId}
          user={membre}
        />
      )}

      {isOpenSuppressionMembre && (
        <ConfirmerSuppressionMembre
          isOpen={isOpenSuppressionMembre}
          setIsOpen={setIsOpenSuppressionMembre}
          membre={membre}
          isCurrentUser={isCurrentUserRow}
        />
      )}
    </>
  );
};

export default ListMembresTableRow;
