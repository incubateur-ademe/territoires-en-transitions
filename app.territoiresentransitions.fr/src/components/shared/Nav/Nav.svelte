<script>
    /**
     * Top navigation bar
     */
    import {onMount} from "svelte";
    import {testUIVisibility} from "../../../api/currentEnvironment";
    import NavSignedIn from "./NavSignedIn.svelte";
    import NavSignedOut from "./NavSignedOut.svelte";

    export let segment // Type string. Typing this variable makes sapper crash.

    let showTestNavigation = false
    onMount(async () => {
        showTestNavigation = testUIVisibility()
    });
</script>

{#if showTestNavigation}
    {#await import('./NavDev.svelte') then c}
        <svelte:component this={c.default}/>
    {/await}
{/if}

{#if segment && segment !== 'connexion'}
    <NavSignedIn/>
{:else }
    <NavSignedOut/>
{/if}

