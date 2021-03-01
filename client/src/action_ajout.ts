import './styles.css'
import './pages/mesure'
import './pages/indicatorsList'
import ActionCreatePage from './components/page/ActionCreatePage.svelte'
import {thematiques} from "../vendors/thematiques";

new ActionCreatePage({
  // @ts-ignore
  target: document.body.querySelector('[data-page="action_create"]'),
})

