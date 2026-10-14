import { LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { SidePanel } from '../../ui/layout/side-panel/side-panel';
import { SidePanelProvider } from '../../ui/layout/side-panel/side-panel.context';
import type {
  ActionDeReferenceFiche,
  ActionDeReferenceFiches,
  ActionDeReferenceUpdate,
  UpdateActionDeReferenceFormProps,
  UseListFichesActionDeReference,
} from './actions-de-reference.contract';
import {
  isolationComblesAction,
  toFicheFixture,
} from './actions-de-reference.fixture';
import { UpdateActionDeReferenceContainer } from './update-action-de-reference.container';
import { useUpdateActionDeReferenceSidePanel } from './use-update-action-de-reference-side-panel';

const PANEL_TITLE = "Modifier l'action de référence";
const OPEN_PANEL = 'Ouvrir le volet';
const CLOSE_PANEL = 'Fermer';
const SAVE = 'Enregistrer';
const OPEN_MENU = 'ouvrir le menu';
const CONFIRMATION_TITLE = 'Modifications non enregistrées';
const DISCARD_CHANGES = 'Fermer sans enregistrer';
const KEEP_EDITING = 'Poursuivre la modification';
const REQUIRED_FIELD_MESSAGE = 'Ce champ est obligatoire';
const TITRE_TOO_LONG_MESSAGE = '300 caractères maximum';
const CATEGORIE_EXEMPLARITE = 'Exemplarité interne';
const CATEGORIE_AMENAGEMENT = 'Aménagement & infrastructures';
const TYPED_TITRE = 'Isoler les combles des gymnases';
const TYPED_DESCRIPTION = "Programmer l'isolation des combles des gymnases.";

type UpdateAction = ActionDeReferenceUpdate['updateAction'];
type OnUpdated = UpdateActionDeReferenceFormProps['onUpdated'];

const updateActionMock = vi.hoisted(() => vi.fn<UpdateAction>());

const acceptUpdate: UpdateAction = (_input, { onUpdated }) => onUpdated();
const rejectUpdate: UpdateAction = () => undefined;
const updateCallbacks = { onUpdated: expect.any(Function) };

vi.mock('./data/use-update-action-de-reference', () => ({
  useUpdateActionDeReference: (): ActionDeReferenceUpdate => ({
    updateAction: updateActionMock,
    isPending: false,
  }),
}));

const listFichesMock = vi.hoisted(() =>
  vi.fn<UseListFichesActionDeReference>()
);

vi.mock('./data/use-list-fiches-action-de-reference', () => ({
  useListFichesActionDeReference: listFichesMock,
}));

const toFicheStub = (id: number): ActionDeReferenceFiche =>
  toFicheFixture({
    id,
    titre: '',
    description: null,
    restreint: false,
    collectiviteId: 0,
    collectiviteNom: null,
  });

const toLoadedFiches = (
  ficheIds: readonly number[]
): ActionDeReferenceFiches => ({
  status: 'loaded',
  fiches: ficheIds.map(toFicheStub),
});

vi.mock('next/navigation', () => ({
  usePathname: (): string => '/collectivite/1/actions-reference',
}));

const renderForm = (): Mock<OnUpdated> => {
  const onUpdated = vi.fn<OnUpdated>();
  render(
    <SidePanelProvider>
      <UpdateActionDeReferenceContainer
        action={isolationComblesAction}
        onUpdated={onUpdated}
      />
    </SidePanelProvider>
  );
  return onUpdated;
};

const PanelOpener = (): JSX.Element => {
  const { open } = useUpdateActionDeReferenceSidePanel();
  return (
    <button onClick={() => open(isolationComblesAction)}>{OPEN_PANEL}</button>
  );
};

const openPanel = (): void => {
  fireEvent.click(screen.getByRole('button', { name: OPEN_PANEL }));
};

const renderOpenPanel = (): void => {
  render(
    <SidePanelProvider>
      <PanelOpener />
      <SidePanel />
    </SidePanelProvider>
  );
  openPanel();
};

const queryOpenPanel = (): HTMLElement | null =>
  screen.queryByRole('complementary', { name: PANEL_TITLE, hidden: true });

const queryConfirmation = (): HTMLElement | null =>
  screen.queryByRole('dialog', { name: CONFIRMATION_TITLE });

const getTitreField = (): HTMLElement =>
  screen.getByDisplayValue(isolationComblesAction.titre);

const getDescriptionField = (): HTMLElement =>
  screen.getByDisplayValue(isolationComblesAction.description);

const waitForValidation = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const typeInField = async (field: HTMLElement, text: string): Promise<void> => {
  fireEvent.change(field, { target: { value: text } });
  await waitForValidation();
};

const listSelectedLabels = (): readonly (string | null)[] =>
  screen
    .getAllByRole('button', { name: OPEN_MENU })
    .map((button) => button.textContent);

const chooseOption = async ({
  selectedLabel,
  optionLabel,
}: {
  readonly selectedLabel: string;
  readonly optionLabel: string;
}): Promise<void> => {
  const [selectButton] = screen
    .getAllByRole('button', { name: OPEN_MENU })
    .filter((button) => button.textContent === selectedLabel);
  fireEvent.click(selectButton);
  fireEvent.click(screen.getByRole('button', { name: optionLabel }));
  await waitForValidation();
};

const submitForm = async (): Promise<void> => {
  fireEvent.click(screen.getByRole('button', { name: SAVE }));
  await waitForValidation();
};

const requestPanelClose = (): void => {
  fireEvent.click(screen.getByRole('button', { name: CLOSE_PANEL }));
};

const expectPanelKeptOpenWithTypedTitreAfterRejectedUpdate =
  async (): Promise<void> => {
    updateActionMock.mockImplementation(rejectUpdate);
    renderOpenPanel();
    await typeInField(getTitreField(), TYPED_TITRE);

    await submitForm();

    expect(updateActionMock).toHaveBeenCalledTimes(1);
    expect(queryOpenPanel()).not.toBeNull();
    expect(screen.queryByDisplayValue(TYPED_TITRE)).not.toBeNull();
    expect(queryConfirmation()).toBeNull();
  };

beforeEach(() => {
  updateActionMock.mockReset();
  updateActionMock.mockImplementation(acceptUpdate);
  listFichesMock.mockReset();
  listFichesMock.mockReturnValue(toLoadedFiches([]));
});

describe('modifier-action', () => {
  it("préremplit le titre, la description, le levier et la catégorie de l'action", () => {
    renderForm();

    expect(getTitreField()).toHaveProperty('tagName', 'INPUT');
    expect(getDescriptionField()).toHaveProperty('tagName', 'TEXTAREA');
    expect(listSelectedLabels()).toEqual([
      LEVIER_NOM_BY_ID.sobriete_isolation_batiments_tertiaire,
      CATEGORIE_EXEMPLARITE,
    ]);
  });

  it("envoie l'identifiant et les champs saisis à l'enregistrement", async () => {
    renderForm();
    await typeInField(getTitreField(), TYPED_TITRE);
    await typeInField(getDescriptionField(), TYPED_DESCRIPTION);
    await chooseOption({
      selectedLabel: LEVIER_NOM_BY_ID.sobriete_isolation_batiments_tertiaire,
      optionLabel: LEVIER_NOM_BY_ID.covoiturage,
    });
    await chooseOption({
      selectedLabel: CATEGORIE_EXEMPLARITE,
      optionLabel: CATEGORIE_AMENAGEMENT,
    });

    await submitForm();

    expect(updateActionMock).toHaveBeenCalledExactlyOnceWith(
      {
        id: isolationComblesAction.id,
        titre: TYPED_TITRE,
        description: TYPED_DESCRIPTION,
        leviers: ['sobriete_isolation_batiments_tertiaire', 'covoiturage'],
        categories: ['amenagement', 'exemplarite'],
      },
      updateCallbacks
    );
  });

  it('envoie le titre et la description sans les espaces qui les entourent', async () => {
    renderForm();
    await typeInField(getTitreField(), `  ${TYPED_TITRE}  `);
    await typeInField(getDescriptionField(), `  ${TYPED_DESCRIPTION}  `);

    await submitForm();

    expect(updateActionMock).toHaveBeenCalledExactlyOnceWith(
      {
        id: isolationComblesAction.id,
        titre: TYPED_TITRE,
        description: TYPED_DESCRIPTION,
        leviers: isolationComblesAction.leviers,
        categories: isolationComblesAction.categories,
      },
      updateCallbacks
    );
  });

  it('signale la mise à jour quand la modification est acceptée', async () => {
    const onUpdated = renderForm();
    await typeInField(getTitreField(), TYPED_TITRE);

    await submitForm();

    expect(onUpdated).toHaveBeenCalledTimes(1);
  });

  it('ne signale aucune mise à jour quand la modification est rejetée', async () => {
    updateActionMock.mockImplementation(rejectUpdate);
    const onUpdated = renderForm();
    await typeInField(getTitreField(), TYPED_TITRE);

    await submitForm();

    expect(updateActionMock).toHaveBeenCalledTimes(1);
    expect(onUpdated).not.toHaveBeenCalled();
  });
});

describe('modifier-action-validation', () => {
  it("refuse un titre vide et bloque l'enregistrement", async () => {
    renderForm();

    await typeInField(getTitreField(), '');
    expect(screen.queryByText(REQUIRED_FIELD_MESSAGE)).not.toBeNull();

    await submitForm();
    expect(updateActionMock).not.toHaveBeenCalled();
  });

  it("refuse un titre fait d'espaces", async () => {
    renderForm();

    await typeInField(getTitreField(), '   ');
    expect(screen.queryByText(REQUIRED_FIELD_MESSAGE)).not.toBeNull();

    await submitForm();
    expect(updateActionMock).not.toHaveBeenCalled();
  });

  it('refuse un titre de 301 caractères', async () => {
    renderForm();

    await typeInField(getTitreField(), 'a'.repeat(301));
    expect(screen.queryByText(TITRE_TOO_LONG_MESSAGE)).not.toBeNull();

    await submitForm();
    expect(updateActionMock).not.toHaveBeenCalled();
  });

  it('accepte un titre de 300 caractères', async () => {
    renderForm();
    const longestTitre = 'a'.repeat(300);

    await typeInField(getTitreField(), longestTitre);
    expect(screen.queryByText(TITRE_TOO_LONG_MESSAGE)).toBeNull();

    await submitForm();
    expect(updateActionMock).toHaveBeenCalledExactlyOnceWith(
      { ...isolationComblesAction, titre: longestTitre },
      updateCallbacks
    );
  });

  it("refuse une description vide et bloque l'enregistrement", async () => {
    renderForm();

    await typeInField(getDescriptionField(), '');
    expect(screen.queryByText(REQUIRED_FIELD_MESSAGE)).not.toBeNull();

    await submitForm();
    expect(updateActionMock).not.toHaveBeenCalled();
  });

  it("n'envoie rien tant qu'un champ est invalide", async () => {
    renderForm();
    const titreField = getTitreField();
    await typeInField(getDescriptionField(), TYPED_DESCRIPTION);
    await typeInField(titreField, '');

    await submitForm();
    expect(updateActionMock).not.toHaveBeenCalled();

    await typeInField(titreField, TYPED_TITRE);
    await submitForm();
    expect(updateActionMock).toHaveBeenCalledExactlyOnceWith(
      {
        ...isolationComblesAction,
        titre: TYPED_TITRE,
        description: TYPED_DESCRIPTION,
      },
      updateCallbacks
    );
  });
});

describe('modifier-action-fiches-liees', () => {
  const FICHES_LIEES_ERROR_MESSAGE =
    'Saisissez des identifiants de fiche séparés par des virgules';
  const RETRY = 'Réessayer';

  const getFichesLieesField = (displayedValue: string): HTMLElement =>
    screen.getByDisplayValue(displayedValue);

  it('préremplit le champ avec les identifiants des fiches liées', () => {
    listFichesMock.mockReturnValue(toLoadedFiches([11, 12]));

    renderForm();

    expect(getFichesLieesField('11, 12')).toHaveProperty('tagName', 'INPUT');
  });

  it('envoie les identifiants saisis dans ficheIds', async () => {
    listFichesMock.mockReturnValue(toLoadedFiches([11]));
    renderForm();

    await typeInField(getFichesLieesField('11'), '21, 22');
    await submitForm();

    expect(updateActionMock).toHaveBeenCalledExactlyOnceWith(
      { ...isolationComblesAction, ficheIds: [21, 22] },
      updateCallbacks
    );
  });

  it('envoie ficheIds vide quand le champ est vidé', async () => {
    listFichesMock.mockReturnValue(toLoadedFiches([11]));
    renderForm();

    await typeInField(getFichesLieesField('11'), '');
    await submitForm();

    expect(updateActionMock).toHaveBeenCalledExactlyOnceWith(
      { ...isolationComblesAction, ficheIds: [] },
      updateCallbacks
    );
  });

  it("n'envoie pas ficheIds quand le champ n'a pas changé", async () => {
    listFichesMock.mockReturnValue(toLoadedFiches([11]));
    renderForm();

    await typeInField(getTitreField(), TYPED_TITRE);
    await submitForm();

    expect(updateActionMock).toHaveBeenCalledTimes(1);
    expect(updateActionMock.mock.calls[0][0]).not.toHaveProperty('ficheIds');
  });

  it("refuse une saisie qui n'est pas une liste d'identifiants et bloque l'enregistrement", async () => {
    renderForm();

    await typeInField(getFichesLieesField(''), '21, abc');
    expect(screen.queryByText(FICHES_LIEES_ERROR_MESSAGE)).not.toBeNull();

    await submitForm();
    expect(updateActionMock).not.toHaveBeenCalled();
  });

  it("n'affiche pas le formulaire tant que les fiches liées se chargent", () => {
    listFichesMock.mockReturnValue({ status: 'loading' });

    renderForm();

    expect(screen.queryByRole('button', { name: SAVE })).toBeNull();
  });

  it('propose de réessayer quand les fiches liées ne se chargent pas', () => {
    const retry = vi.fn();
    listFichesMock.mockReturnValue({ status: 'error', retry });
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: RETRY }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: SAVE })).toBeNull();
  });
});

describe('modifier-action-conflit', () => {
  it(
    'garde le volet ouvert et la saisie quand la modification est rejetée',
    expectPanelKeptOpenWithTypedTitreAfterRejectedUpdate
  );
});

describe('modifier-action-en-erreur', () => {
  it(
    'garde le volet ouvert et la saisie quand la modification est rejetée',
    expectPanelKeptOpenWithTypedTitreAfterRejectedUpdate
  );
});

describe('fermer-volet-modifications-non-enregistrees', () => {
  it('répond stay-open à la demande de fermeture et ouvre la confirmation quand un champ a changé', async () => {
    renderOpenPanel();
    await typeInField(getTitreField(), TYPED_TITRE);

    requestPanelClose();

    expect(queryOpenPanel()).not.toBeNull();
    expect(queryConfirmation()).not.toBeNull();
  });

  it("répond close à la demande de fermeture quand aucun champ n'a changé", () => {
    renderOpenPanel();
    expect(queryOpenPanel()).not.toBeNull();

    requestPanelClose();

    expect(queryOpenPanel()).toBeNull();
    expect(queryConfirmation()).toBeNull();
  });

  it("répond close à la demande de fermeture quand le champ modifié a retrouvé sa valeur d'origine", async () => {
    renderOpenPanel();
    const titreField = getTitreField();
    await typeInField(titreField, TYPED_TITRE);
    await typeInField(titreField, isolationComblesAction.titre);

    requestPanelClose();

    expect(queryOpenPanel()).toBeNull();
    expect(queryConfirmation()).toBeNull();
  });

  it('« Fermer sans enregistrer » ferme le volet et abandonne la saisie', async () => {
    renderOpenPanel();
    await typeInField(getTitreField(), TYPED_TITRE);
    requestPanelClose();

    fireEvent.click(screen.getByRole('button', { name: DISCARD_CHANGES }));

    expect(queryOpenPanel()).toBeNull();
    expect(queryConfirmation()).toBeNull();
    expect(updateActionMock).not.toHaveBeenCalled();

    openPanel();
    expect(screen.queryByDisplayValue(TYPED_TITRE)).toBeNull();
    expect(
      screen.queryByDisplayValue(isolationComblesAction.titre)
    ).not.toBeNull();
  });

  it('« Poursuivre la modification » referme la confirmation et garde la saisie', async () => {
    renderOpenPanel();
    await typeInField(getTitreField(), TYPED_TITRE);
    requestPanelClose();

    fireEvent.click(screen.getByRole('button', { name: KEEP_EDITING }));

    expect(queryConfirmation()).toBeNull();
    expect(queryOpenPanel()).not.toBeNull();
    expect(screen.queryByDisplayValue(TYPED_TITRE)).not.toBeNull();
  });
});
