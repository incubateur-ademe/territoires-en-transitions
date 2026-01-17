import StepperValidation from '@/panier/components/Stepper/StepperValidation';
import {
  useCollectiviteContext,
  usePanierContext,
  useUserContext,
} from '@/panier/providers';
import {
  PanierAPI,
  getAuthPaths,
  getCollectivitePlanPath,
  getRejoindreCollectivitePath,
  useSupabase,
} from '@tet/api';
import {
  Button,
  Divider,
  Event,
  Field,
  OptionValue,
  Select,
  useEventTracker,
} from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import useSWR from 'swr';

const ValiderPanierModale = () => {
  const { panier } = usePanierContext();
  const { user } = useUserContext();
  const contenu = panier?.inpanier ?? [];

  const steps = [
    "Je crée mon plan et retrouve l'ensemble des actions sélectionnées dans mon panier. ",
    'Je modifie les actions à ma guise et invite mes collaborateurs à contribuer en ligne.',
  ];

  !user &&
    steps.unshift(
      'Je créé mon compte en quelques clics et me rattache à ma collectivité'
    );

  return (
    <div className="flex flex-col gap-10 items-center relative">
      <h3 className="mb-0 mx-16 text-center text-primary-10">
        Pilotez les actions à impact sélectionnées
      </h3>
      <div className="w-full bg-primary-0 border border-primary-3 rounded-lg py-6 px-8 flex flex-col items-center relative">
        <Fireworks
          autorun={{ speed: 3, duration: 600 }}
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
          Vous pouvez maintenant créer un plan, pour retrouver et modifier ces
          actions sur notre outil Territoires en Transitions.
        </span>
        <Divider color="medium" className="mt-8 !w-1/2" />
        <StepperValidation className="w-5/6 mt-2" steps={steps} />
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
  // construit l'url de redirection (vers cette modale ouverte)
  const redirectTo = new URL(document.location.href);
  redirectTo.searchParams.set('modale', 'creation');

  // récupère les urls du module auth.
  const authPaths = getAuthPaths(redirectTo.toString());

  return (
    <div className="flex gap-4 justify-center">
      <Button href={authPaths.login} variant="outlined">
        Se connecter
      </Button>
      <Button href={authPaths.signUp}>Créer un compte</Button>
    </div>
  );
};

/**
 * Bascule entre `connecté et rattaché` et `connecté pas rattaché`
 * selon s'il est possible de créer un plan dans une collectivité.
 */
const ModeConnecte = () => {
  const supabase = useSupabase();
  const { data } = useSWR(['mesCollectivites'], () =>
    new PanierAPI(supabase).mesCollectivites()
  );

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
  // construit l'url de redirection (vers cette modale ouverte)
  const redirectTo = new URL(document.location.href);
  redirectTo.searchParams.set('modale', 'creation');

  return (
    <Button href={getRejoindreCollectivitePath(redirectTo.toString())}>
      Rejoindre une collectivité
    </Button>
  );
};

/**
 * Le mode `connecté et rattaché`
 *
 * Affiche
 * - la liste déroulante de mes collectivités ou ma seule collectivité
 * - le bouton "Créer le plan”
 *
 * @param collectivites La liste des collectivités pour lesquels un plan peut être créé
 */
const ModeConnecteRattache = ({
  collectivites,
}: {
  collectivites: Array<{ collectiviteId: number; nom: string }>;
}) => {
  const tracker = useEventTracker();
  const { panier } = usePanierContext();
  const router = useRouter();
  const { collectiviteId: savedCollectiviteId } = useCollectiviteContext();
  const supabase = useSupabase();

  // vérifie que l'id est bien présent dans la liste
  const found =
    savedCollectiviteId &&
    !!collectivites?.find((c) => c.collectiviteId === savedCollectiviteId);

  const [collectiviteId, setCollectiviteId] = useState<OptionValue>(
    found ? savedCollectiviteId : collectivites[0].collectiviteId
  );

  const handleOnClick = async () => {
    const collectivite = collectivites.find(
      (c) => c.collectiviteId === collectiviteId
    );
    if (!collectivite) return;
    await tracker(Event.panier.createPlanClick, {
      collectiviteId: collectivite.collectiviteId,
      panierId: panier?.id ?? '',
    });
    const plan_id = await new PanierAPI(supabase).createPlanFromPanier(
      collectivite.collectiviteId,
      panier?.id ?? ''
    );

    const href = getCollectivitePlanPath(collectivite.collectiviteId, plan_id);
    router.push(href);
  };

  return (
    <>
      <Field title="Nom de la collectivité" className="w-full">
        <Select
          options={collectivites.map((c) => ({
            value: c.collectiviteId,
            label: c.nom,
          }))}
          values={collectiviteId}
          onChange={(value) => {
            if (value) {
              setCollectiviteId(value);
            }
          }}
        />
      </Field>
      <Button onClick={handleOnClick} disabled={!collectiviteId}>
        {'Créer le plan'}
      </Button>
    </>
  );
};
