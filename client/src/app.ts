import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureLink from './components/MesureLink.svelte'

const mesureLink = new MesureLink({
  // @ts-ignore
  target: document.body.querySelector('[data-custom-mesure]'),
  props: {
    mesureId: '123',
    mesureName: 'Ma mesure personnalisée',
  },
})

export default mesureLink
