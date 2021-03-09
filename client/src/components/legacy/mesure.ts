import { init } from './statusPicker'

let statusPickers = document.querySelectorAll<HTMLFieldSetElement>('.status')

statusPickers.forEach((element): void => init(element))


