/* eslint-disable react/no-unescaped-entities */
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import {Button, Field, OptionValue, Select} from '@tet/ui';
import {useContext, useState} from 'react';
import {useEventTracker} from '@tet/ui';
import {useRouter} from 'next/navigation';
import {PanierContext, UserContext} from './PanierRealtime';
import {panierAPI} from 'src/clientAPI';
import useSWR from 'swr';
import {MesCollectivite} from '@tet/api';

const ValiderPanierModale = () => {
  const panier = useContext(PanierContext);
  const user = useContext(UserContext);
  const contenu = panier.contenu;

  return (
    <div className="flex flex-col gap-10 items-center relative">
      <h3 className="mb-0 mx-16 text-center text-primary-10">
        Pilotez les actions à impact sélectionnées
      </h3>
      <div className="w-full bg-primary-0 border border-primary-3 rounded-lg py-8 px-10 flex flex-col items-center relative">
        <Fireworks
          autorun={{speed: 3, duration: 600}}
          className="absolute top-0 left-0 w-full h-full"
        />
        <span className="text-7xl text-primary-7 font-extrabold mb-6">
          {contenu.length}
        </span>
        <span className="text-lg text-primary-9 font-bold text-center mb-2">
          action{contenu.length > 1 ? 's' : ''} à ajouter dans mon plan à
          impact.
        </span>
        <span className="text-lg text-primary-9 text-center">
          Vous pouvez maintenant créer un plan pour retrouver et modifier ces
          actions selon vos besoins.
        </span>
      </div>
      {user ? <ModeConnecte /> : <ModeDeconnecte />}
    </div>
  );
};

export default ValiderPanierModale;

/**
 * Mode `déconnecté`
 *
 * Affiche les boutons "Se connecter” et "Créer un compte”
 * Les boutons renvoient sur le site avec l'URL courante
 */
const ModeDeconnecte = () => {
  // todo changer les liens, ajouter [l'url courante]+[modale=creation] en redirect
  return (
    <div className="flex gap-4 justify-center mt-8">
      <Button href="app/login" variant="outlined">
        Se connecter
      </Button>
      <Button href="app/signup">Créer un compte</Button>
    </div>
  );
};

/**
 * Bascule entre `connecté et rattaché` et `connecté pas rattaché`
 * selon s'il est possible de créer un plan d'action dans une collectivité.
 */
const ModeConnecte = () => {
  const {data} = useSWR<MesCollectivite>(['mesCollectivites'], () =>
    panierAPI.mesCollectivites(),
  );

  // const data: MesCollectivite = [
  //   {
  //     collectivite_id: 1,
  //     nom: 'TEST 1',
  //     niveau_acces: 'lecture',
  //     est_auditeur: false,
  //   },
  //   {
  //     collectivite_id: 2,
  //     nom: 'TEST 2',
  //     niveau_acces: 'lecture',
  //     est_auditeur: false,
  //   },
  // ];

  return !!data && data.length > 0 ? (
    <ModeConnecteRattache collectivites={data} />
  ) : (
    <ModeConnectePasRattache />
  );
};

/**
 * Mode `connecté pas rattaché`
 *
 * Affiche le bouton "Rejoindre une collectivité”
 */
const ModeConnectePasRattache = () => {
  // todo url du site vers page "Rejoindre une collectivité”
  return (
    <Button href="" className="mt-8">
      Rejoindre une collectivité
    </Button>
  );
};

/**
 * Le mode `connecté et rattaché`
 *
 * Affiche
 * - la liste déroulante de mes collectivités ou ma seule collectivité
 * - le bouton "Créer le plan d’action”
 *
 * @param collectivites La liste des collectivités pour lesquels un plan peut être créé
 */
const ModeConnecteRattache = ({
  collectivites,
}: {
  collectivites: MesCollectivite;
}) => {
  const tracker = useEventTracker('panier');
  const panier = useContext(PanierContext);
  const router = useRouter();

  const [collectiviteId, setCollectiviteId] = useState<OptionValue>(
    collectivites[0].collectivite_id,
  );

  const handleOnClick = async () => {
    const collectivite = collectivites.find(
      c => c.collectivite_id === collectiviteId,
    )!;
    await tracker('cta_valider_creation_panier_click', {
      collectivite_preset: collectivite.collectivite_id,
      panier_id: panier.id,
    });
    const plan_id = await panierAPI.createPlanFromPanier(
      collectivite.collectivite_id,
      panier.id,
    );
    // todo utiliser la fonction utilitaire du package API pour composer l'URL
    const href = `https://app.territoiresentransitions.fr/collectivite/${collectivite.collectivite_id}/plans/plan/${plan_id}`;
    router.push(href);
  };

  return (
    <>
      <Field title="Nom de la collectivité" className="w-full">
        <Select
          options={collectivites.map(c => ({
            value: c.collectivite_id,
            label: c.nom,
          }))}
          values={collectiviteId}
          onChange={value => {
            setCollectiviteId(value);
          }}
        />
      </Field>
      <Button onClick={handleOnClick} className="mt-8">
        Créer le plan d'action
      </Button>
    </>
  );
};
