import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import MesureLinks from './components/MesureLinks.svelte'
import { Thematique, thematiques } from './../vendors/thematiques'

const initCustomMesuresForThematiques = (thematique: Thematique): void => {
  new MesureLinks({
    // @ts-ignore
    target: document.body.querySelector(`[data-custom-mesure-thematique="${thematique.name}"]`),
    props: {
      climat_pratic_thematique: thematique.name,
    }
  })
}

Object.values(thematiques).forEach(initCustomMesuresForThematiques)
