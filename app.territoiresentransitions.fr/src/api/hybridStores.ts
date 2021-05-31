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
import {IndicateurPersonnalise, IndicateurPersonnaliseInterface} from "../../../generated/models/indicateur_personnalise";
import {
    IndicateurReferentielCommentaire,
    IndicateurReferentielCommentaireInterface
} from "../../../generated/models/indicateur_referentiel_commentaire";
import {IndicateurReferentielCommentaireStorable} from "../storables/IndicateurReferentielCommentaireStorable";


export const indicateurValueStore = new HybridStore<IndicateurValueStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${IndicateurValue.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurValueStorable(serialized as IndicateurValueInterface),
});

export const actionStatusStore = new HybridStore<ActionStatusStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${ActionStatus.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionStatusStorable(serialized as ActionStatusInterface),
});

export const ficheActionStore = new HybridStore<FicheActionStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${FicheAction.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new FicheActionStorable(serialized as FicheActionInterface),
});

export const ficheActionCategorieStore = new HybridStore<FicheActionCategorieStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${FicheActionCategorie.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new FicheActionCategorieStorable(serialized as FicheActionCategorieInterface),
});

export const indicateurPersonnaliseStore = new HybridStore<IndicateurPersonnaliseStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${IndicateurPersonnalise.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurPersonnaliseStorable(serialized as IndicateurPersonnaliseInterface),
});

export const indicateurPersonnaliseValueStore = new HybridStore<IndicateurPersonnaliseValueStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${IndicateurPersonnaliseValue.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurPersonnaliseValueStorable(serialized as IndicateurPersonnaliseValueInterface),
});

export const indicateurReferentielCommentaireStore = new HybridStore<IndicateurReferentielCommentaireStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${IndicateurReferentielCommentaire.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurReferentielCommentaireStorable(serialized as IndicateurReferentielCommentaireInterface),
});