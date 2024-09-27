'use client';

import {useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {Button, Modal, useEventTracker} from '@tet/ui';
import ValiderPanierModale from './ValiderPanierModale';
import {usePanierContext} from '@tet/panier/providers';

/**
 * Le bouton “Valider la création” du panier d'action
 *
 * Contrôle la modale de "Création de plan d’action”
 * Si le paramètre `modale` est égal à `creation` la modale est initialement ouverte
 */
const ValiderPanierButton = ({disabled}: {disabled?: boolean}) => {
  const searchParams = useSearchParams();
  const initiallyOpen = searchParams.get('modale') === 'creation';
  const [createModalOpen, setCreateModalOpen] = useState(initiallyOpen);
  const tracker = useEventTracker('panier/panier');
  const {panier} = usePanierContext();

  return (
    <>
      <Button
        className="w-full justify-center mt-auto"
        disabled={disabled}
        onClick={() => {
          setCreateModalOpen(true);
          tracker('cta_valider_creation_panier_click', {
            collectivite_preset: panier?.collectivite_preset ?? null,
            panier_id: panier?.id ?? '',
          });
        }}
      >
        Créer un plan d’action
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
