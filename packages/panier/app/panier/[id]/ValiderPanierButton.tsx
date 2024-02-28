'use client';
/* eslint-disable react/no-unescaped-entities */
import {Button, Modal} from '@tet/ui';
import {useContext, useState} from 'react';
import {useEventTracker} from '@tet/ui';
import {useRouter, useSearchParams} from 'next/navigation';
import {PanierContext, UserContext} from 'app/panier/[id]/PanierRealtime';
import Link from 'next/link';
import {panierAPI} from 'src/clientAPI';
import useSWR from 'swr';
import {MesCollectivite} from '@tet/api';

/**
 * Le bouton “Valider la création” du panier d'action
 *
 * Contrôle la modale de "Création de plan d’action”
 * Si le paramètre `modale` est égal à `creation` la modale est initialement ouverte
 */
export function ValiderPanierButton() {
  const searchParams = useSearchParams();
  const initiallyOpen = searchParams.get('modale') === 'creation';
  const [createModalOpen, setCreateModalOpen] = useState(initiallyOpen);
  const tracker = useEventTracker('panier');
  const panier = useContext(PanierContext);
  const user = useContext(UserContext);
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
            {user ? <ModeConnecte /> : <ModeDeconnecte />}
          </div>
        )}
      />
    </>
  );
}

/**
 * Mode `déconnecté`
 *
 * Affiche les boutons "Se connecter” et "Créer un compte”
 * Les boutons renvoient sur le site avec l'URL courante
 */
function ModeDeconnecte() {
  // todo changer les liens, ajouter [l'url courante]+[modale=creation] en redirect
  return (
    <div>
      <Link href="app/login">Se connecter</Link>
      <br />
      <Link href="app/signup">Créer un compte</Link>
    </div>
  );
}

/**
 * Bascule entre `connecté et rattaché` et `connecté pas rattaché`
 * selon s'il est possible de créer un plan d'action dans une collectivité.
 */
function ModeConnecte() {
  const {data, error} = useSWR<MesCollectivite>(['mesCollectivites'], () =>
    panierAPI.mesCollectivites()
  );

  if (!data) {
    return null;
  }

  return data.length > 0 ? (
    <ModeConnecteRattache collectivites={data} />
  ) : (
    <ModeConnectePasRattache />
  );
}

/**
 * Mode `connecté pas rattaché`
 *
 * Affiche le bouton "Rejoindre une collectivité”
 */
function ModeConnectePasRattache() {
  // todo url du site vers page "Rejoindre une collectivité”
  const href = '';
  return (
    <div>
      <Link href={href}>Rejoindre une collectivité</Link>
    </div>
  );
}

/**
 * Le mode `connecté et rattaché`
 *
 * Affiche
 * - la liste déroulante de mes collectivités ou ma seule collectivité
 * - le bouton "Créer le plan d’action”
 *
 * @param collectivites La liste des collectivités pour lesquels un plan peut être créé
 */
function ModeConnecteRattache({
  collectivites,
}: {
  collectivites: MesCollectivite;
}) {
  const tracker = useEventTracker('panier');
  const panier = useContext(PanierContext);
  const router = useRouter();

  // todo select de collectivite
  const collectivite = collectivites[0];

  return (
    <>
      <p>Collectivité {collectivite.nom}</p>
      <Button
        onClick={async () => {
          await tracker('cta_valider_creation_panier_click', {
            collectivite_preset: collectivite.collectivite_id,
            panier_id: panier.id,
          });
          const plan_id = await panierAPI.createPlanFromPanier(
            collectivite.collectivite_id,
            panier.id
          );
          // todo utiliser la fonction utilitaire du package API pour composer l'URL
          const href = `https://app.territoiresentransitions.fr/collectivite/${collectivite.collectivite_id}/plans/plan/${plan_id}`;
          router.push(href);
        }}
      >
        Créer le plan d'action
      </Button>
    </>
  );
}
