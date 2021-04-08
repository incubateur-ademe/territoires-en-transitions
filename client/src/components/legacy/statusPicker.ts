import {actionStatusStore} from "../../api/hybridStore";
import {getCurrentEpciId} from "../../api/currentEpci";
import {ActionStatusStorable} from "../../storables/ActionStatusStorable";

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
 * Check the value of the status picker with a default value or the value retrieved from store.
 */
const checkInput = async (actionId: string, inputs: NodeListOf<HTMLInputElement>): Promise<void> => {
    let actionAvancementKey = 'pas_faite';
    try {
        const status = await actionStatusStore.retrieveById(`${ecpiId}/${actionId}`)
        if (status) actionAvancementKey = status.avancement;
    } catch (e) {
        //  should do something meaningful.
    } finally {
        const selectedInputId = `action-${actionId}_${actionAvancementKey}`
        inputs.forEach((input: HTMLInputElement): void => {
            if (input.id === selectedInputId) input.checked = true
        })
    }
}


/**
 * Initialize the status picker of an action with all its event listeners
 */
export const init = (element: HTMLFieldSetElement): void => {
    let actionId = element.dataset.actionId || ''
    let inputs = element.querySelectorAll<HTMLInputElement>('input[type="radio"]')

    addListeners(actionId, inputs)
    checkInput(actionId, inputs)
}