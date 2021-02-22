import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureLink from './components/mesureLink.svelte'

const mesureLink = new MesureLink({
  target: document.body.querySelector('[data-custom-mesure]'),
  props: {
    mesureId: '123',
    mesureName: 'Ma mesure personnalisée',
  },
})

export default mesureLink
