import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureLinks from './components/MesureLinks.svelte'

new MesureLinks({
  // @ts-ignore
  target: document.body.querySelector('[data-custom-mesure-thematique="Stratégie"]'),
  props: {
    climat_pratic_thematique: 'Stratégie',
  }
})

new MesureLinks({
  // @ts-ignore
  target: document.body.querySelector('[data-custom-mesure-thematique="Gestion, production et distribution de l\'énergie"]'),
  props: {
    climat_pratic_thematique: 'Gestion, production et distribution de l\'énergie',
  }
})
