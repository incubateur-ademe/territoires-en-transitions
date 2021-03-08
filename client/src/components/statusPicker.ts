import {store} from '../api/store'
import {actionStatusStore} from "../api/localStore";
import {getCurrentEpciId} from "../api/currentEpci";
import {ActionStatusStorable} from "../storables/ActionStatusStorable";

const ecpiId = getCurrentEpciId()

const addListeners = (actionId: string, inputs: NodeListOf<HTMLInputElement>): void => {
    let onChange = (event: Event): void => {
        const target = event.target as HTMLInputElement
        const actionAvancementKey = target.value
        const avancement = new ActionStatusStorable({
            epci_id: ecpiId,
            action_id: actionId,
            avancement: actionAvancementKey
        })

        actionStatusStore.store(avancement)
    }

    inputs.forEach((input): void => {
        input.addEventListener('change', onChange)
    })
}

/**
 * Check the default value of the status picker of an action with data stored in
 * localStorage
 */
const checkDefaultValue = (actionId: string, inputs: NodeListOf<HTMLInputElement>): void => {
    const statuses = actionStatusStore.where((status) => status.epci_id == ecpiId && status.action_id == actionId)
    const actionAvancementKey = statuses.length ? statuses[0].avancement : 'pas_faite'
    const selectedInputId = `action-${actionId}_${actionAvancementKey}`

    inputs.forEach((input: HTMLInputElement): void => {
        if (input.id === selectedInputId) input.checked = true
    })
}

/**
 * Initialize the status picker of an action with all its event listeners
 */
export const init = (element: HTMLFieldSetElement): void => {
    let actionId = element.dataset.actionId || ''
    let inputs = element.querySelectorAll<HTMLInputElement>('input[type="radio"]')

    addListeners(actionId, inputs)
    checkDefaultValue(actionId, inputs)
}