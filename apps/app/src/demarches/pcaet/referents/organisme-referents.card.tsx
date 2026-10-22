'use client';

import { appLabels } from '@/app/labels/catalog';
import { PcaetReferent } from '@tet/domain/demarches';
import { Button, Select } from '@tet/ui';
import { JSX, useState } from 'react';
import { AddContactLibreForm } from './add-contact-libre.form';
import { useAddReferent } from './data/use-add-referent';
import { OrganismeAvecReferents } from './data/use-list-referents-organismes';
import { RemoveReferentModal } from './remove-referent.modal';

type Props = OrganismeAvecReferents & {
  collectiviteId: number;
  canMutate: boolean;
};

export const OrganismeReferentsCard = ({
  collectiviteId,
  canMutate,
  organisme,
  referents,
  membres,
}: Props): JSX.Element => {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [referentARetirer, setReferentARetirer] =
    useState<PcaetReferent | null>(null);
  const { mutate: addReferent, isPending } = useAddReferent();

  return (
    <section
      data-test={`demarches.referents-pcaet.organisme-${organisme.id}`}
      className="flex flex-col gap-3 rounded-xl border border-grey-3 bg-white p-4"
    >
      <h3 className="mb-0 text-base">{organisme.nom}</h3>

      {referents.length === 0 ? (
        <p className="mb-0 text-sm text-grey-6">
          {appLabels.demarcheContactsAucunReferent}
        </p>
      ) : (
        // Borné : une liste longue défile au lieu d'étirer la carte.
        <ul className="mb-0 flex max-h-64 list-none flex-col gap-1 overflow-y-auto pl-0">
          {referents.map((referent) => (
            <li
              key={referent.id}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-grey-1"
            >
              <div className="min-w-0 text-sm">
                <p className="mb-0 truncate font-medium">{referent.nom}</p>
                <p className="mb-0 truncate text-grey-7">{referent.email}</p>
              </div>
              {canMutate && (
                <Button
                  variant="grey"
                  size="xs"
                  icon="delete-bin-line"
                  title={appLabels.referentsPcaetRetirerTitre}
                  aria-label={appLabels.referentsPcaetRetirerTitre}
                  dataTest={`demarches.referents-pcaet.retirer-${referent.id}`}
                  onClick={() => setReferentARetirer(referent)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {canMutate && (
        <div className="flex flex-col gap-2">
          <Select
            dataTest={`demarches.referents-pcaet.ajouter-membre-${organisme.id}`}
            options={membres.map((membre) => ({
              value: membre.userId,
              label: `${membre.nom} (${membre.email})`,
            }))}
            onChange={(userId) => {
              if (typeof userId === 'string') {
                addReferent({
                  collectiviteId,
                  organismeId: organisme.id,
                  userId,
                });
              }
            }}
            isSearcheable
            renderInPortal
            disabled={isPending || membres.length === 0}
            placeholder={
              membres.length === 0
                ? appLabels.referentsPcaetAucunMembre
                : appLabels.referentsPcaetAjouterMembre
            }
            small
          />
          {isContactFormOpen ? (
            <AddContactLibreForm
              collectiviteId={collectiviteId}
              organismeId={organisme.id}
              onDone={() => setIsContactFormOpen(false)}
            />
          ) : (
            <Button
              variant="underlined"
              size="xs"
              icon="add-line"
              className="self-start"
              dataTest={`demarches.referents-pcaet.ajouter-contact-${organisme.id}`}
              onClick={() => setIsContactFormOpen(true)}
            >
              {appLabels.referentsPcaetAjouterContact}
            </Button>
          )}
        </div>
      )}

      {referentARetirer && (
        <RemoveReferentModal
          collectiviteId={collectiviteId}
          organismeNom={organisme.nom}
          referent={referentARetirer}
          openState={{
            isOpen: true,
            setIsOpen: (isOpen) => {
              if (!isOpen) setReferentARetirer(null);
            },
          }}
        />
      )}
    </section>
  );
};
