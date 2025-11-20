'use client';
import { Panier } from '@tet/api';
import {
  Button,
  Card,
  Event,
  Icon,
  useCopyToClipboard,
  useEventTracker,
} from '@tet/ui';
import { useEffect, useState } from 'react';
import Membres from '../Picto/Membres';

/**
 * Affiche l'encadré invitant au partage du lien vers le panier
 */
export const PartagerLeLien = ({ panier }: { panier: Panier }) => {
  const [opened, setOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const { copy } = useCopyToClipboard();
  const tracker = useEventTracker();

  // TODO: remplacer ça par le composant Toast de l'app et du site
  // (à mutualiser dans le package ui)
  useEffect(() => {
    if (copied) {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      const id = window.setTimeout(() => setCopied(false), 2000);
      setTimeoutId(id);
    }
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    };
    // eslint-disable-next-line
  }, [copied]);

  return opened ? (
    <Card className="fixed bottom-0 rounded-b-none -mb-1 left-20 shadow-md w-96 z-10">
      <div
        onClick={() => setOpened(false)}
        className="ml-auto cursor-pointer h-fit w-fit"
      >
        <Icon icon="close-line" className="" />
      </div>
      <Membres className="-mt-12" />
      <h4 className="mb-0">Inviter des membres de votre collectivité</h4>
      <p className="font-normal text-sm mb-0">
        Vous pouvez partager ce lien aux autres services de votre collectivité
        afin de travailler de façon synchronisée ! La coopération entre les
        services de la collectivité favorise la mise en place d’une politique
        locale de transition écologique transversale et impactante.
      </p>
      {copied && (
        <p className="text-success text-sm mb-0">
          Le lien a été copié dans le presse-papier
        </p>
      )}
      <Button
        size="xs"
        icon="file-copy-line"
        onClick={() => {
          copy(document.location.href);
          setCopied(true);
          tracker(Event.panier.copierPanierUrl, {
            collectivite_preset: panier.collectivite_preset,
            panier_id: panier.id,
          });
        }}
      >
        Copier le lien du panier
      </Button>
    </Card>
  ) : (
    <div className="fixed bottom-0 left-20">
      <Button
        className="rounded-b-none -mb-1"
        icon="user-add-line"
        size="sm"
        onClick={() => setOpened(true)}
      >
        Inviter des membres
      </Button>
    </div>
  );
};
