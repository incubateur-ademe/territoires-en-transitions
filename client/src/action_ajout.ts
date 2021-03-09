import './styles.css'
import './components/legacy/mesure'
import './components/legacy/indicatorsList'
import ActionCreatePage from './components/actions/ActionCreatePage.svelte'
import {thematiques} from "../vendors/thematiques";

new ActionCreatePage({
  // @ts-ignore
  target: document.body.querySelector('[data-page="action_create"]'),
})

