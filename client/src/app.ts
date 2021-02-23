import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureLinks from './components/MesureLinks.svelte'

const mesureLinks = new MesureLinks({
  // @ts-ignore
  target: document.body.querySelector('[data-custom-mesure]'),
})

export default mesureLinks
