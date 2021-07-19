<script lang="ts">
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";

    export let segment : string 

    let epciId = ''
    onMount(async () => {
        try {
            epciId = getCurrentEpciId()
        } catch (e) {
            // not signed in, it's fine
        }
    });
</script>

{#if !segment}
    <li class="mr-4">
        <a class="p-1 rounded hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 active:text-gray-900 active:shadow-inner active:bg-white"
           href="connexion/?epci_id={epciId}">
            Se connecter
        </a>
    </li>
{/if}