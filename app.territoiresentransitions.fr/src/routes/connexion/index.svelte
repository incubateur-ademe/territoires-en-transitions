<script lang="ts">
    import {epcis_default} from "$generated/models/epcis_default";
    import Button from "$components/shared/ButtonV2/Button.svelte";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "$api/currentEpci";

    $: epciId = ''
    onMount(async () => {
        try {
            const currentEpci = getCurrentEpciId()
            epciId = currentEpci === 'test' ? '' : currentEpci
        } catch (e) {
            // not logged in, this is fine
        }
    });

    /**
     * Hard navigate to the next page in order to clear Sapper state.
     */
    const handleConnect = (_) => {
        window.location.href = `fiches/?epci_id=${epciId}`
    }
</script>

<div class="flex flex-col items-center mt-16">
    <div class="flex flex-col items-center">
        <h1 class="text-center text-2xl">Se connecter</h1>

        <div class="mt-8"></div>
        <div class="flex flex-row items-center">
            <label class="mr-4" for="epci_picker">Ma collectivité</label>
            <select bind:value={epciId}
                    class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                    id="epci_picker">
                <option value=''>
                    -
                </option>
                {#each Object.entries(epcis_default) as [id, nom]}
                    {#if id !== 'test'}
                        <option value={id}>
                            {nom}
                        </option>
                    {/if}
                {/each}
            </select>
        </div>

        <div class="mt-4"></div>
        <div class="max-w-lg flex">
            {#if epciId}
                <Button on:click={handleConnect}>
                    Connexion
                </Button>
            {:else }
                <Button on:click={(_) => ''}
                        classNames="cursor-not-allowed"
                        colorVariant="ash">
                    Connexion
                </Button>
            {/if}
        </div>
    </div>
</div>
