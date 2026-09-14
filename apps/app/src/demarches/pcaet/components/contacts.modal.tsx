'use client';

import { appLabels } from '@/app/labels/catalog';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import { EmptyCard, Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';

type Props = {
  openState: OpenState;
};

/**
 * Les interlocuteurs du territoire, quand ils seront servis par le serveur.
 *
 * La modale affichait jusqu'ici deux contacts écrits en dur — une DREAL et une
 * agente nommée d'Auvergne-Rhône-Alpes — servis à toutes les collectivités :
 * une adresse personnelle publiée dans un dépôt public, et un interlocuteur
 * faux pour dix-sept régions sur dix-huit. Mieux vaut ne rien annoncer que
 * d'annoncer le mauvais correspondant.
 */
export const PcaetContactsModal = ({ openState }: Props): JSX.Element => (
  <Modal
    size="lg"
    title={appLabels.demarcheContactsTitre}
    openState={openState}
    render={() => (
      <div className="flex flex-col gap-4">
        <p className=" text-grey-7">{appLabels.demarcheContactsDescription}</p>
        <EmptyCard
          picto={({ className }) => <PictoDocument className={className} />}
          title={appLabels.demarcheContactsAucunTitre}
          description={appLabels.demarcheContactsAucunDescription}
        />
      </div>
    )}
  />
);
