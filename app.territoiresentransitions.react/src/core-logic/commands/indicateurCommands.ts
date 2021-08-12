import {indicateurPersonnaliseStore, indicateurPersonnaliseValueStore, indicateurValueStore} from "../api/hybridStores";
import {IndicateurPersonnaliseValueStorable} from "storables/IndicateurPersonnaliseValueStorable";
import {IndicateurValueStorable} from "storables/IndicateurValueStorable";


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

export const indicateurCommands = {

    getIndicateurReferentielValue,
    storeIndicateurReferentielValue,

    getAllIndicateursPersonnalises,
    getIndicateurPersonnaliseValue,
    storeIndicateurPersonnaliseValue,
}