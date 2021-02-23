import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureCustomPage from './components/page/MesureCustomPage.svelte'

const mesureCustom = new MesureCustomPage({
  // @ts-ignore
  target: document.body,
})

export default mesureCustom
