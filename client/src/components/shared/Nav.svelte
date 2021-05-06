<script>
  import EpciNavDisplay from "./EpciNavDisplay.svelte";
  import {getCurrentEpciId} from "../../api/currentEpci";

  let epciId = getCurrentEpciId()
</script>
<nav class="bg-green-600">
  <ul class="container mx-auto lg:px-20 px-4 p-4 flex text-xl">
    <li class="mr-4">
      <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
         href="/?epci_id={epciId}">
        Territoires en Transitions
      </a>
    </li>
    <li class="mr-4 flex-grow text-center">
      <EpciNavDisplay/>
    </li>
    <li class="mr-4">
      <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
         href="fiches/?epci_id={epciId}">
        Plan d'actions
      </a>
    </li>
    <li class="mr-4">
      <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
         href="actions_referentiels/?epci_id={epciId}">
        Référentiels
      </a>
    </li>
    <li class="mr-4">
      <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
         href="indicateurs/?epci_id={epciId}">
        Indicateurs
      </a>
    </li>
  </ul>
</nav>