import './styles.css'
import './components/legacy/mesure'
import './components/legacy/indicatorsList'
import MesureCustomPage from './components/mesures/MesureCustomPage.svelte'

const mesureCustom = new MesureCustomPage({
  // @ts-ignore
  target: document.body,
})

export default mesureCustom
