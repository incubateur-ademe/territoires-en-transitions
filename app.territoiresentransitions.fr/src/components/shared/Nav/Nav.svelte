<script>
    /**
     * Top navigation bar
     */
    import {onMount} from "svelte";
    import {testUIVisibility} from "../../../api/currentEnvironment";
    import NavSignedIn from "./NavSignedIn.svelte";
    import NavSignedOut from "./NavSignedOut.svelte";
    import {getCurrentEpciId} from '../../../api/currentEpci'

    export let segment // Type string. Typing this variable makes sapper crash.

    let showTestNavigation = false
    let epciId = ''

    const isLogged = segment && segment !== 'connexion'
    onMount(async () => {
        showTestNavigation = testUIVisibility()
        try {
            epciId = getCurrentEpciId()
        } catch (e) {
            // not signed in, it's fine
        }
    });
</script>

{#if showTestNavigation}
    {#await import('./NavDev.svelte') then c}
        <svelte:component this={c.default}/>
    {/await}
{/if}

<nav class="bg-seagreen-400">
    <ul class="container mx-auto lg:px-20 px-4 p-4 flex text-xl">
        <li class={ !isLogged ? 'mr-4 flex-grow' : 'mr-4' }>
            <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
               href="/?epci_id={epciId}">
                Territoires en Transitions
            </a>
        </li>

        {#if isLogged}
            <NavSignedIn/>
        {:else }
            <NavSignedOut/>
        {/if}
    </ul>
</nav>

