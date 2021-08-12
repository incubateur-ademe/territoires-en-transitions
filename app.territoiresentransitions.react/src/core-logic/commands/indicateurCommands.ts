import {
    indicateurPersonnaliseStore,
    indicateurPersonnaliseValueStore,
    indicateurValueStore,
    indicateurReferentielCommentaireStore
} from "../api/hybridStores";
import {IndicateurPersonnaliseValueStorable} from "storables/IndicateurPersonnaliseValueStorable";
import {IndicateurValueStorable} from "storables/IndicateurValueStorable";
import {IndicateurReferentielCommentaireStorable} from "storables/IndicateurReferentielCommentaireStorable";


const getIndicateurReferentielValue =
    (indicateurId: string) => indicateurValueStore.retrieveById(indicateurId);

const storeIndicateurReferentielValue =
    (storable: IndicateurValueStorable) => indicateurValueStore.store(storable);

const getAllIndicateursPersonnalises =
    () => indicateurPersonnaliseStore.retrieveAll();

export const getIndicateurPersonnaliseValue =
    (indicateurId: string) => indicateurPersonnaliseValueStore.retrieveById(indicateurId);

const storeIndicateurPersonnaliseValue =
    (storable: IndicateurPersonnaliseValueStorable) => indicateurPersonnaliseValueStore.store(storable);


const getIndicateurReferentielCommentaire = (id: string) => indicateurReferentielCommentaireStore.retrieveById(id);

const storeIndicateurReferentielCommentaire =
    (storable: IndicateurReferentielCommentaireStorable) => indicateurReferentielCommentaireStore.store(storable);

export const indicateurCommands = {

    getIndicateurReferentielValue,
    storeIndicateurReferentielValue,

    getAllIndicateursPersonnalises,
    getIndicateurPersonnaliseValue,
    storeIndicateurPersonnaliseValue,

    getIndicateurReferentielCommentaire,
    storeIndicateurReferentielCommentaire,
}