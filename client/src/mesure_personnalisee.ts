import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureCustomPage from './components/page/MesureCustomPage.svelte'

const mesureCustom = new MesureCustomPage({
  // @ts-ignore
  target: document.body.querySelector('[data-page="mesure_custom"]'),
  props: {
    mesureId: '123',
    mesureName: 'Ma mesure personnalisée',
  },
})

export default mesureCustom
