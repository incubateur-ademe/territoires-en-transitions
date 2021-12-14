import React from 'react';
import Snackbar, {SnackbarCloseReason} from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import {APIEndpoint, APIEvent} from 'core-logic/api/apiEndpoint';
import {Storable} from 'core-logic/api/storable';
import {
  actionMetaStore,
  actionStatusStore,
  epciStore,
  ficheActionCategorieStore,
  getFicheActionStoreForEpci,
  indicateurPersonnaliseStore,
  indicateurResultatStore,
  indicateurObjectifStore,
  indicateurReferentielCommentaireStore,
  planActionStore,
  indicateurPersonnaliseObjectifStore,
  indicateurPersonnaliseResultatStore,
} from 'core-logic/api/hybridStores';
import {getCurrentEpciId} from 'core-logic/api/currentEpci';

type Composer<T extends Storable> = (
  response: Response | null,
  event: APIEvent<T> | null,
  onClose: () => void
) => JSX.Element | null;

class EndpointToaster<T extends Storable> extends React.Component<
  {
    endpoint: APIEndpoint<T>;
    composer: Composer<T>;
  },
  {open: boolean}
> {
  constructor(props: {endpoint: APIEndpoint<T>; composer: Composer<T>}) {
    super(props);
    this.state = {
      open: false,
    };
    this.listener = this.listener.bind(this);
    this.close = this.close.bind(this);
  }

  componentDidMount() {
    this.props.endpoint.addListener(this.listener);
  }

  componentWillUnmount() {
    this.props.endpoint.removeListener(this.listener);
  }

  render() {
    const composed = this.props.composer(
      this.props.endpoint.lastResponse,
      this.props.endpoint.lastEvent,
      this.close
    );

    const handleClose = (
      event: React.SyntheticEvent,
      reason: SnackbarCloseReason
    ) => {
      if (reason !== 'clickaway') this.close();
    };

    return (
      <div>
        <Snackbar
          open={this.state.open}
          autoHideDuration={2000}
          onClose={handleClose}
        >
          {composed ?? <div></div>}
        </Snackbar>
      </div>
    );
  }

  listener() {
    if (this.props.endpoint.lastEvent) this.setState({open: true});
  }

  close() {
    this.setState({open: false});
  }
}

function makeComposer(messages: {
  storeSuccess: string;
  storeError: string;
}): Composer<Storable> {
  return (response, event, onClose) => {
    if (event?.intent === 'store')
      return (
        <MuiAlert
          elevation={6}
          variant="filled"
          severity={event?.outcome ?? undefined}
          onClose={onClose}
        >
          {event?.outcome === 'success' &&
            event?.intent === 'store' &&
            messages.storeSuccess}

          {event?.outcome === 'error' &&
            event?.intent === 'store' &&
            `Erreur ${response?.status}: ${messages.storeError}`}
        </MuiAlert>
      );

    return null;
  };
}

export function Toasters() {
  const ficheActionStore = getFicheActionStoreForEpci(getCurrentEpciId()!);
  return (
    <>
      <EndpointToaster
        endpoint={indicateurResultatStore.api}
        composer={makeComposer({
          storeSuccess: "La valeur résultat de l'indicateur est enregistrée",
          storeError:
            "La valeur résultat de l'indicateur n'a pas été enregistrée",
        })}
      />
      <EndpointToaster
        endpoint={indicateurPersonnaliseResultatStore.api}
        composer={makeComposer({
          storeSuccess:
            "La valeur résultat de l'indicateur personnalisé est enregistrée",
          storeError:
            "La valeur résultat de l'indicateur personnalisé n'a pas été enregistrée",
        })}
      />
      <EndpointToaster
        endpoint={indicateurObjectifStore.api}
        composer={makeComposer({
          storeSuccess: "La valeur objectif de l'indicateur est enregistrée",
          storeError:
            "La valeur objectif de l'indicateur n'a pas été enregistrée",
        })}
      />
      <EndpointToaster
        endpoint={indicateurPersonnaliseObjectifStore.api}
        composer={makeComposer({
          storeSuccess:
            "La valeur objectif de l'indicateur personnalisé est enregistrée",
          storeError:
            "La valeur objectif de l'indicateur personnalisé n'a pas été enregistrée",
        })}
      />
      <EndpointToaster
        endpoint={actionStatusStore.api}
        composer={makeComposer({
          storeSuccess: "Le statut de l'action est enregistré",
          storeError: "Le statut de l'action n'a pas été enregistré",
        })}
      />
      <EndpointToaster
        endpoint={ficheActionStore.api}
        composer={makeComposer({
          storeSuccess: 'La fiche est enregistrée',
          storeError: "La fiche n'a pas été enregistrée",
        })}
      />
      <EndpointToaster
        endpoint={ficheActionCategorieStore.api}
        composer={makeComposer({
          storeSuccess: 'La catégorie est enregistrée',
          storeError: "La catégorie n'a pas été enregistrée",
        })}
      />

      <EndpointToaster
        endpoint={indicateurPersonnaliseStore.api}
        composer={makeComposer({
          storeSuccess: "L'indicateur est enregistré",
          storeError: "L'indicateur n'a pas été enregistré",
        })}
      />

      <EndpointToaster
        endpoint={indicateurPersonnaliseObjectifStore.api}
        composer={makeComposer({
          storeSuccess: "La valeur de l'objectif est enregistrée",
          storeError: "La valeur de l'objectif n'a pas été enregistrée",
        })}
      />
      <EndpointToaster
        endpoint={indicateurReferentielCommentaireStore.api}
        composer={makeComposer({
          storeSuccess: 'Le commentaire est enregistré',
          storeError: "Le commentaire n'a pas été enregistré",
        })}
      />

      <EndpointToaster
        endpoint={epciStore.api}
        composer={makeComposer({
          storeSuccess: 'La collectivité est enregistrée',
          storeError: "La collectivité n'a pas été enregistrée",
        })}
      />

      <EndpointToaster
        endpoint={actionMetaStore.api}
        composer={makeComposer({
          storeSuccess: 'Le commentaire est enregistré',
          storeError: "Le commentaire n'a pas été enregistré",
        })}
      />

      <EndpointToaster
        endpoint={planActionStore.api}
        composer={makeComposer({
          storeSuccess: "Le plan d' action est enregistré",
          storeError: "Le plan d' action n'a pas été enregistré",
        })}
      />
    </>
  );
}
