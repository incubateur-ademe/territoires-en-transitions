<script lang="ts">
    import {FicheAction} from "../../../../../generated/models/fiche_action";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";

    export let fiche: FicheAction
    $: enRetard = fiche.en_retard
    let epciId = ''


    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>

<style>
    article {
        padding: .8rem 1rem 1.5rem;
        background-color: var(--beige);
        border-left: 4px solid transparent;
        position: relative;
    }

    article:not(:first-of-type) {
        margin-top: 1rem;
    }

    article :global(h3) {
        font-size: 1.25rem;
    }

    .en-retard {
        position: absolute;
        top: 1rem;
        right: 0;
        padding: 0.5rem 0.75rem;
        background-color: white;
        border-right: 6px solid #DA0505;
    }
</style>

<article>
    <a href="fiches/edition/?epci_id={epciId}&uid={fiche.uid}">
        <h3>
            ({fiche.custom_id}) {fiche.titre}
        </h3>
    </a>

    {#if enRetard}
        <div class="en-retard">
            En retard
        </div>
    {/if}
</article>