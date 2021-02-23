import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureCreatePage from './components/page/MesureCreatePage.svelte'

const page = new MesureCreatePage({
  // @ts-ignore
  target: document.body.querySelector('[data-page="mesure_create"]'),
  props: {
    mesureId: '123',
    mesureName: 'Ma mesure personnalisée',
  },
})

export default page
