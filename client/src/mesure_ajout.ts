import './styles.css'
import './components/legacy/mesure'
import './components/legacy/indicatorsList'
import MesureCreatePage from './components/mesures/MesureCreatePage.svelte'
import { thematiques } from '../vendors/thematiques'

const page = new MesureCreatePage({
  // @ts-ignore
  target: document.body.querySelector('[data-page="mesure_create"]'),
  props: {
    thematiques: Object.values(thematiques),
  },
})

export default page
