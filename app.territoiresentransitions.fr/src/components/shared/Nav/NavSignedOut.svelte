<script>
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";

    export let segment // Type string. Typing this variable makes sapper crash.

    let epciId = ''
    onMount(async () => {
        try {
            epciId = getCurrentEpciId()
        } catch (e) {
            // not signed in, it's fine
        }
    });
</script>
<nav class="bg-seagreen-400">
    <ul class="container mx-auto lg:px-20 px-4 p-4 flex text-xl">
        <li class="mr-4">
            <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
               href="/?epci_id={epciId}">
                Territoires en Transitions
            </a>
        </li>

        <li class="mr-4 flex-grow">
        </li>

        {#if !segment}
            <li class="mr-4">
                <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
                   href="connexion/?epci_id={epciId}">
                    Se connecter
                </a>
            </li>
        {/if}
    </ul>
</nav>