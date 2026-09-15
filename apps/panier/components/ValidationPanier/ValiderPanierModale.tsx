import StepperValidation from '@/panier/components/Stepper/StepperValidation';
import { UserCollectivitesError } from '@/panier/components/user-collectivites-error';
import { useUserCollectivites } from '@/panier/hooks/use-user-collectivites';
import { useCollectiviteContext, usePanierContext } from '@/panier/providers';
import {
  UserCollectivite,
  createPlanFromPanier,
  getAuthPaths,
  getCollectivitePlanPath,
  getRejoindreCollectivitePath,
} from '@tet/api';
import {
  Alert,
  Button,
  Divider,
  Event,
  Field,
  Select,
  useEventTracker,
} from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import { match } from 'ts-pattern';

type NonEmptyArray<T> = readonly [T, ...T[]];

type PlanCreationCollectivite = UserCollectivite & { canCreatePlan: true };

const hasAtLeastOne = <T,>(items: readonly T[]): items is NonEmptyArray<T> =>
  items.length > 0;

const allowsPlanCreation = (
  collectivite: UserCollectivite
): collectivite is PlanCreationCollectivite => collectivite.canCreatePlan;

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
  collectivites: NonEmptyArray<PlanCreationCollectivite>;
}) => {
  const tracker = useEventTracker();
  const { panier } = usePanierContext();
  const router = useRouter();
  const { collectiviteId: savedCollectiviteId } = useCollectiviteContext();
  const [chosenCollectiviteId, setChosenCollectiviteId] = useState<
    number | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const selectedCollectivite =
    collectivites.find(
      (collectivite) =>
        collectivite.collectiviteId ===
        (chosenCollectiviteId ?? savedCollectiviteId)
    ) ?? collectivites[0];

  const handleOnClick = async () => {
    setHasError(false);
    setIsCreating(true);
    try {
      await tracker(Event.panier.createPlanClick, {
        collectiviteId: selectedCollectivite.collectiviteId,
        panierId: panier?.id ?? '',
      });
      const planId = await createPlanFromPanier(
        selectedCollectivite.collectiviteId,
        panier?.id ?? ''
      );

      const href = getCollectivitePlanPath(
        selectedCollectivite.collectiviteId,
        planId
      );
      router.push(href);
    } catch {
      setHasError(true);
      setIsCreating(false);
    }
  };

  return (
    <>
      <Field title="Nom de la collectivité" className="w-full">
        <Select
          options={collectivites.map((c) => ({
            value: c.collectiviteId,
            label: c.collectiviteNom,
          }))}
          values={selectedCollectivite.collectiviteId}
          onChange={(value) => {
            if (typeof value === 'number') {
              setChosenCollectiviteId(value);
            }
          }}
          disabled={isCreating}
        />
      </Field>
      {hasError && (
        <Alert
          state="error"
          title="La création du plan a échoué"
          description="Une erreur est survenue. Merci de réessayer dans quelques instants."
        />
      )}
      <Button
        onClick={handleOnClick}
        disabled={isCreating}
        loading={isCreating}
      >
        {'Créer le plan'}
      </Button>
    </>
  );
};

/**
 * Bascule entre `connecté et rattaché` et `connecté pas rattaché`
 * selon s'il est possible de créer un plan dans une collectivité.
 */
const ModeConnecte = ({
  collectivites,
}: {
  collectivites: readonly UserCollectivite[];
}) => {
  const collectivitesAllowingPlanCreation =
    collectivites.filter(allowsPlanCreation);
  if (!hasAtLeastOne(collectivitesAllowingPlanCreation)) {
    return <ModeConnectePasRattache />;
  }
  return (
    <ModeConnecteRattache collectivites={collectivitesAllowingPlanCreation} />
  );
};

const ValiderPanierModale = () => {
  const { panier } = usePanierContext();
  const userCollectivitesState = useUserCollectivites();
  const isAnonymous = userCollectivitesState.status === 'anonymous';
  const contenu = panier?.inpanier ?? [];

  const steps = [
    "Je crée mon plan et retrouve l'ensemble des actions sélectionnées dans mon panier. ",
    'Je modifie les actions à ma guise et invite mes collaborateurs à contribuer en ligne.',
  ];

  if (isAnonymous) {
    steps.unshift(
      'Je créé mon compte en quelques clics et me rattache à ma collectivité'
    );
  }

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
        <Divider className="mt-8 mb-6 !w-1/2" />
        <StepperValidation className="w-5/6 mt-2" steps={steps} />
      </div>
      {match(userCollectivitesState)
        .with({ status: 'pending' }, () => null)
        .with({ status: 'anonymous' }, () => <ModeDeconnecte />)
        .with({ status: 'error' }, ({ retry }) => (
          <UserCollectivitesError retry={retry} />
        ))
        .with({ status: 'loaded' }, ({ collectivites }) => (
          <ModeConnecte collectivites={collectivites} />
        ))
        .exhaustive()}
    </div>
  );
};

export default ValiderPanierModale;
