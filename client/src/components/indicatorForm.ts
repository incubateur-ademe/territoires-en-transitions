import {getIndicator} from '../api/indicator'
import {retrieve, store} from "../api/localStore";
import {IndicateurValueStorable} from '../storables/indicateurValueStorable'
import {IndicateurValue} from "../../vendors/indicateur_value";
import {getCurrentEpciId} from "../api/currentEpci";

const preventDefault = (event: Event): void => {
    event.preventDefault()
}

const onBlur = (event: FocusEvent): void => {
    const input = event.target as HTMLInputElement;
    const {id, year} = inputProperties(input)
    const currentEpciId = getCurrentEpciId()
    const value = new IndicateurValueStorable({epci_id: currentEpciId, indicateur_id: id, year: year, value: input.value})
    store(value)
}

const onKeyPress = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
        const input = event.target as HTMLInputElement
        input.blur()
    }
}

const initYearlyInput = (input: HTMLInputElement): void => {
    const {id, year} = inputProperties(input)
    let value: string
    try {
        const currentEpciId = getCurrentEpciId()
        let stored = retrieve<IndicateurValue>(IndicateurValue.pathname, `${currentEpciId}/${id}/${year}`)
        value = stored.value
    } catch (_) {
        value = ''
    }
    input.value = value
    input.addEventListener('blur', onBlur)
    input.addEventListener('keypress', onKeyPress)
}

const inputProperties = (input: HTMLInputElement): { id: string, year: number } => {
    return {
        id: input.dataset.indicatorId!,
        year: +input.dataset.indicatorYear!,
    }
}

/**
 * Initialize the input linked to an indicator with all its event listeners
 */
export const init = (form: HTMLFormElement): void => {
    form.addEventListener('submit', preventDefault)
    const inputs = form.querySelectorAll('input')
    for (let input of inputs) {
        initYearlyInput(input)
    }
}


