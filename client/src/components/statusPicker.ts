import { setActionStatus, getActionStatus } from '../api/actionStatus'

const addListeners = (actionId: string, inputs: NodeListOf<HTMLInputElement>): void => {
  let onChange = (event: Event): void => {
    let target = event.target as HTMLInputElement
    let avancement = target.value

    setActionStatus(actionId, avancement)
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
  let actionStatus = getActionStatus(actionId)
  let selectedInputId = `action-${actionId}_pas_faite`

  if (actionStatus) {
    selectedInputId = `action-${actionId}_${actionStatus.avancement}`
  }

  inputs.forEach((input: HTMLInputElement):void => {
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