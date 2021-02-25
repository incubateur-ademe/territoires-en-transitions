import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureCreatePage from './components/page/MesureCreatePage.svelte'
import { thematiques } from '../vendors/thematiques'

const page = new MesureCreatePage({
  // @ts-ignore
  target: document.body.querySelector('[data-page="mesure_create"]'),
  props: {
    thematiques: Object.values(thematiques),
  },
})

export default page
