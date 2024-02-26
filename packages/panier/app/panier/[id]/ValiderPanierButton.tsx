/* eslint-disable react/no-unescaped-entities */
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import {Panier} from '@tet/api';
import {Button, Modal} from '@tet/ui';
import {useState} from 'react';
import {useEventTracker} from 'src/tracking/useEventTracker';

export function ValiderPanierButton({panier}: {panier: Panier}) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const tracker = useEventTracker('panier');
  const contenu = panier.contenu;
  return (
    <>
      <Button
        className="w-full justify-center mt-auto"
        onClick={() => {
          setCreateModalOpen(true);
          tracker('cta_valider_creation_panier_click', {
            collectivite_preset: panier.collectivite_preset,
            panier_id: panier.id,
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
        render={() => (
          <div className="flex flex-col gap-10 items-center relative">
            <Fireworks
              autorun={{speed: 3, duration: 600}}
              className="absolute top-0 left-0 w-full h-full"
            />
            <h3 className="mb-0 text-primary-10">
              Pilotez les actions à impact sélectionnées
            </h3>
            <div className="w-full bg-primary-0 border border-primary-3 rounded-lg py-8 px-10 flex flex-col items-center">
              <span className="text-7xl text-primary-7 font-extrabold mb-6">
                {contenu.length}
              </span>
              <span className="text-lg text-primary-9 font-bold text-center mb-2">
                action{contenu.length > 1 ? 's' : ''} à ajouter dans mon plan à
                impact.
              </span>
              <span className="text-lg text-primary-9 text-center">
                Vous pouvez maintenant créer un plan pour retrouver et modifier
                ces actions selon vos besoins.
              </span>
            </div>
            <Button
              onClick={() =>
                tracker('cta_valider_creation_panier_click', {
                  collectivite_preset: panier.collectivite_preset,
                  panier_id: panier.id,
                })
              }
            >
              Créer le plan d'action
            </Button>
          </div>
        )}
      />
    </>
  );
}
