import {indicateurValueStore} from "../../api/localStore";
import {IndicateurValueStorable} from '../../storables/IndicateurValueStorable'
import {getCurrentEpciId} from "../../api/currentEpci";

/**
 * Prevent default form behavior.
 */
const preventDefault = (event: Event): void => {
    event.preventDefault()
}

/**
 * Save value for a single yearly input on blur.
 */
const onBlur = (event: FocusEvent): void => {
    const input = event.target as HTMLInputElement;
    const {id, year} = inputProperties(input)
    const currentEpciId = getCurrentEpciId()
    const value = new IndicateurValueStorable({
        epci_id: currentEpciId,
        indicateur_id: id,
        year: year,
        value: input.value
    })

    indicateurValueStore.store(value)
}

/**
 * Call blur on enter.
 */
const onKeyPress = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
        const input = event.target as HTMLInputElement
        input.blur()
    }
}

/**
 * Initialize a single yearly input with a retrieved value or an empty value if none found.
 */
const initYearlyInput = (input: HTMLInputElement): void => {
    const {id, year} = inputProperties(input)
    const epciId = getCurrentEpciId()
    const indicateurValues = indicateurValueStore.where(
        (value) =>
            value.indicateur_id == id &&
            value.year == year &&
            value.epci_id == epciId
    )

    input.value = indicateurValues.length ? indicateurValues[0].value : ''
    input.addEventListener('blur', onBlur)
    input.addEventListener('keypress', onKeyPress)
}

/**
 * Extract indicateur id and year from input.
 */
const inputProperties = (input: HTMLInputElement): { id: string, year: number } => {
    return {
        id: input.dataset.indicatorId!,
        year: +input.dataset.indicatorYear!,
    }
}

/**
 * Initialize each yearly input linked to an indicator with all its event listeners.
 */
export const init = (form: HTMLFormElement): void => {
    form.addEventListener('submit', preventDefault)
    const inputs = form.querySelectorAll('input')
    for (let input of inputs) {
        initYearlyInput(input)
    }
}


