import {IndicateurValueStorable} from "../storables/IndicateurValueStorable";
import {IndicateurValue, IndicateurValueInterface} from "../../../generated/models/indicateur_value";
import {getCurrentEpciId} from "./currentEpci";
import {ActionStatus, ActionStatusInterface} from "../../../generated/models/action_status";
import {ActionStatusStorable} from "../storables/ActionStatusStorable";
import {getCurrentAPI} from "./currentAPI";
import {HybridStore} from "./hybridStore";
import {FicheActionStorable} from "../storables/FicheActionStorable";
import {FicheAction, FicheActionInterface} from "../../../generated/models/fiche_action";
import {FicheActionCategorieStorable} from "../storables/FicheActionCategorieStorable";
import {FicheActionCategorie, FicheActionCategorieInterface} from "../../../generated/models/fiche_action_categorie";
import {IndicateurPersonnaliseValueStorable} from "../storables/IndicateurPersonnaliseValueStorable";
import {
    IndicateurPersonnaliseValue,
    IndicateurPersonnaliseValueInterface
} from "../../../generated/models/indicateur_personnalise_value";
import {IndicateurPersonnaliseStorable} from "../storables/IndicateurPersonnaliseStorable";
import {
    IndicateurPersonnalise,
    IndicateurPersonnaliseInterface
} from "../../../generated/models/indicateur_personnalise";
import {
    IndicateurReferentielCommentaire,
    IndicateurReferentielCommentaireInterface
} from "../../../generated/models/indicateur_referentiel_commentaire";
import {IndicateurReferentielCommentaireStorable} from "../storables/IndicateurReferentielCommentaireStorable";
import {EpciStorable} from "../storables/EpciStorable";
import {Epci, EpciInterface} from "../../../generated/models/epci";
import {currentAccessToken} from "./authentication";
import {ActionReferentielScoreStorable} from "../storables/ActionReferentielScoreStorable";
import type {ActionReferentielScoreInterface} from "../../../generated/models/action_referentiel_score";


const defaultAuthorization = () => `Bearer ${currentAccessToken()}`

export const indicateurValueStore = new HybridStore<IndicateurValueStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${IndicateurValue.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurValueStorable(serialized as IndicateurValueInterface),
});

export const actionStatusStore = new HybridStore<ActionStatusStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${ActionStatus.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionStatusStorable(serialized as ActionStatusInterface),
});

export const ficheActionStore = new HybridStore<FicheActionStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${FicheAction.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new FicheActionStorable(serialized as FicheActionInterface),
});

export const ficheActionCategorieStore = new HybridStore<FicheActionCategorieStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${FicheActionCategorie.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new FicheActionCategorieStorable(serialized as FicheActionCategorieInterface),
});

export const indicateurPersonnaliseStore = new HybridStore<IndicateurPersonnaliseStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${IndicateurPersonnalise.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurPersonnaliseStorable(serialized as IndicateurPersonnaliseInterface),
});

export const indicateurPersonnaliseValueStore = new HybridStore<IndicateurPersonnaliseValueStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${IndicateurPersonnaliseValue.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurPersonnaliseValueStorable(serialized as IndicateurPersonnaliseValueInterface),
});

export const indicateurReferentielCommentaireStore = new HybridStore<IndicateurReferentielCommentaireStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${IndicateurReferentielCommentaire.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurReferentielCommentaireStorable(serialized as IndicateurReferentielCommentaireInterface),
});

export const epciStore = new HybridStore<EpciStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${Epci.pathname}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new EpciStorable(serialized as EpciInterface),
});


export const actionReferentielScoreStore = new HybridStore<ActionReferentielScoreStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/notation/eci/${Epci.pathname}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionReferentielScoreStorable(serialized as ActionReferentielScoreInterface),
});