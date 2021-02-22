import { setIndicator, getIndicator } from '../api/indicator'

const preventDefault = (event: Event): void => {
  event.preventDefault()
}

const onBlur = (event: FocusEvent): void => {
  const { dataset, value } = event.target as HTMLInputElement
  const indicatorId = dataset.userIndicatorId!

  setIndicator(indicatorId, value)
}

const onKeyPress = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    const input = event.target as HTMLInputElement
    input!.blur()
  }
}

/**
 * Initialize the input linked to an indicator with all its event listeners
 */
export const init = (form: HTMLFormElement): void => {
  const input = form.querySelector('input')
  const indicatorId = input!.dataset.userIndicatorId!
  const indicator = getIndicator(indicatorId)

  if (indicator) {
    input!.value = indicator.value
  }

  form.addEventListener('submit', preventDefault)
  input!.addEventListener('blur', onBlur)
  input!.addEventListener('keypress', onKeyPress)
}
