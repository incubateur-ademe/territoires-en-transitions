import {indicateurPersonnaliseStore, indicateurPersonnaliseValueStore, indicateurValueStore} from "../api/hybridStores";
import {IndicateurPersonnaliseValueStorable} from "storables/IndicateurPersonnaliseValueStorable";
import {State} from "./state";
import {IndicateurValueStorable} from "storables/IndicateurValueStorable";


export const getIndicateurReferentielValue =
    ({state}: { state: State }, indicateurId: string) => indicateurValueStore.retrieveById(indicateurId);

export const storeIndicateurReferentielValue =
    ({state}: { state: State }, storable: IndicateurValueStorable) => indicateurValueStore.store(storable);


export const getAllIndicateursPersonnalises =
    ({state}: { state: State }) => indicateurPersonnaliseStore.retrieveAll();


export const getIndicateurPersonnaliseValue =
    ({state}: { state: State }, indicateurId: string) => indicateurPersonnaliseValueStore.retrieveById(indicateurId);


export const storeIndicateurPersonnaliseValue =
    ({state}: { state: State }, storable: IndicateurPersonnaliseValueStorable) => indicateurPersonnaliseValueStore.store(storable);