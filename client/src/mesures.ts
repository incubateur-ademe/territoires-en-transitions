import './styles.css'
import './components/legacy/mesure'
import './components/legacy/indicatorsList'
import MesureLinks from './components/mesures/MesureLinks.svelte'
import { Thematique, thematiques } from './../vendors/thematiques'

const initCustomMesuresForThematiques = (thematique: Thematique): void => {
  new MesureLinks({
    // @ts-ignore
    target: document.body.querySelector(`[data-custom-mesure-thematique="${thematique.id}"]`),
    props: {
      climat_pratic_thematique_id: thematique.id,
    }
  })
}

Object.values(thematiques).forEach(initCustomMesuresForThematiques)
