import React from 'react';
import Snackbar, {SnackbarCloseReason} from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import {
  DataEvent,
  DataLayerWriteEndpoint,
} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {planActionWriteEndpoint} from 'core-logic/api/endpoints/PlanActionWriteEndpoint';
import {ficheActionWriteEndpoint} from 'core-logic/api/endpoints/FicheActionWriteEndpoint';
import {actionStatutWriteEndpoint} from 'core-logic/api/endpoints/ActionStatutWriteEndpoint';
import {actionCommentaireWriteEndpoint} from 'core-logic/api/endpoints/ActionCommentaireWriteEndpoint';

type Composer<T> = (
  response: PostgrestResponse<T> | null,
  event: DataEvent<T> | null,
  onClose: () => void
) => JSX.Element | null;

class EndpointToaster<T> extends React.Component<
  {
    endpoint: DataLayerWriteEndpoint<T>;
    composer: Composer<T>;
  },
  {open: boolean}
> {
  constructor(props: {
    endpoint: DataLayerWriteEndpoint<T>;
    composer: Composer<T>;
  }) {
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
          {composed ?? <div />}
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
}): Composer<unknown> {
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
  return (
    <>
      <EndpointToaster
        endpoint={actionStatutWriteEndpoint}
        composer={makeComposer({
          storeSuccess: "Le statut de l'action est enregistré",
          storeError: "Le statut de l'action n'a pas été enregistré",
        })}
      />
      <EndpointToaster
        endpoint={actionCommentaireWriteEndpoint}
        composer={makeComposer({
          storeSuccess: 'Le commentaire est enregistré',
          storeError: "Le commentaire n'a pas été enregistré",
        })}
      />
      <EndpointToaster
        endpoint={ficheActionWriteEndpoint}
        composer={makeComposer({
          storeSuccess: 'La fiche est enregistrée',
          storeError: "La fiche n'a pas été enregistrée",
        })}
      />
      <EndpointToaster
        endpoint={planActionWriteEndpoint}
        composer={makeComposer({
          storeSuccess: "Le plan d'action est enregistré",
          storeError: "Le plan d'action n'a pas été enregistré",
        })}
      />

      {/* todo missing endpoints */}

      {/*<EndpointToaster*/}
      {/*  endpoint={indicateurResultatStore.api}*/}
      {/*  composer={makeComposer({*/}
      {/*    storeSuccess: "La valeur résultat de l'indicateur est enregistrée",*/}
      {/*    storeError:*/}
      {/*      "La valeur résultat de l'indicateur n'a pas été enregistrée",*/}
      {/*  })}*/}
      {/*/>*/}
      {/*<EndpointToaster*/}
      {/*  endpoint={indicateurPersonnaliseResultatStore.api}*/}
      {/*  composer={makeComposer({*/}
      {/*    storeSuccess:*/}
      {/*      "La valeur résultat de l'indicateur personnalisé est enregistrée",*/}
      {/*    storeError:*/}
      {/*      "La valeur résultat de l'indicateur personnalisé n'a pas été enregistrée",*/}
      {/*  })}*/}
      {/*/>*/}
      {/*<EndpointToaster*/}
      {/*  endpoint={indicateurObjectifStore.api}*/}
      {/*  composer={makeComposer({*/}
      {/*    storeSuccess: "La valeur objectif de l'indicateur est enregistrée",*/}
      {/*    storeError:*/}
      {/*      "La valeur objectif de l'indicateur n'a pas été enregistrée",*/}
      {/*  })}*/}
      {/*/>*/}
      {/*<EndpointToaster*/}
      {/*  endpoint={indicateurPersonnaliseObjectifStore.api}*/}
      {/*  composer={makeComposer({*/}
      {/*    storeSuccess:*/}
      {/*      "La valeur objectif de l'indicateur personnalisé est enregistrée",*/}
      {/*    storeError:*/}
      {/*      "La valeur objectif de l'indicateur personnalisé n'a pas été enregistrée",*/}
      {/*  })}*/}
      {/*/>*/}

      {/*<EndpointToaster*/}
      {/*  endpoint={indicateurPersonnaliseStore.api}*/}
      {/*  composer={makeComposer({*/}
      {/*    storeSuccess: "L'indicateur est enregistré",*/}
      {/*    storeError: "L'indicateur n'a pas été enregistré",*/}
      {/*  })}*/}
      {/*/>*/}

      {/*<EndpointToaster*/}
      {/*  endpoint={indicateurPersonnaliseObjectifStore.api}*/}
      {/*  composer={makeComposer({*/}
      {/*    storeSuccess: "La valeur de l'objectif est enregistrée",*/}
      {/*    storeError: "La valeur de l'objectif n'a pas été enregistrée",*/}
      {/*  })}*/}
      {/*/>*/}
      {/*<EndpointToaster*/}
      {/*  endpoint={indicateurReferentielCommentaireStore.api}*/}
      {/*  composer={makeComposer({*/}
      {/*    storeSuccess: 'Le commentaire est enregistré',*/}
      {/*    storeError: "Le commentaire n'a pas été enregistré",*/}
      {/*  })}*/}
      {/*/>*/}
      {/*<EndpointToaster*/}
      {/*  endpoint={actionMetaStore.api}*/}
      {/*  composer={makeComposer({*/}
      {/*    storeSuccess: 'Le commentaire est enregistré',*/}
      {/*    storeError: "Le commentaire n'a pas été enregistré",*/}
      {/*  })}*/}
      {/*/>*/}
    </>
  );
}
