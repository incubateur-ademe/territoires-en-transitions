'use client';

import {Button, Modal, useEventTracker} from '@tet/ui';
import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import ValiderPanierModale from './ValiderPanierModale';
import {usePanierContext} from 'providers/panier';

/**
 * Le bouton “Valider la création” du panier d'action
 *
 * Contrôle la modale de "Création de plan d’action”
 * Si le paramètre `modale` est égal à `creation` la modale est initialement ouverte
 */
const ValiderPanierButton = () => {
  const searchParams = useSearchParams();
  const initiallyOpen = searchParams.get('modale') === 'creation';
  const [createModalOpen, setCreateModalOpen] = useState(initiallyOpen);
  const tracker = useEventTracker('panier');
  const {panier} = usePanierContext();

  return (
    <>
      <Button
        className="w-full justify-center mt-auto"
        onClick={() => {
          setCreateModalOpen(true);
          tracker('cta_valider_creation_panier_click', {
            collectivite_preset: panier?.collectivite_preset ?? null,
            panier_id: panier?.id ?? '',
          });
        }}
      >
        Valider la création
      </Button>
      <Modal
        size="lg"
        openState={{
          isOpen: createModalOpen,
          setIsOpen: setCreateModalOpen,
        }}
        render={() => <ValiderPanierModale />}
      />
    </>
  );
};

export default ValiderPanierButton;
