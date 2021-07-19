<script lang="ts">
    import {fiche_action_avancement_noms} from "../../../../../generated/models/fiche_action_avancement_noms";

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
        padding: 1.5rem 1rem;
        background-color: var(--beige);
        border-left: 4px solid transparent;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    article:not(:first-of-type) {
        margin-top: 1rem;
    }

    article :global(h3) {
        font-size: 1.25rem;
    }

    .titre {
        
    }

     .statuts {
         display: flex;
         flex-direction: row;
         align-items: center;
     }

    .avancement {
        display: flex;
        align-items: center;
        margin-bottom: 0;
        padding: 0.5rem 1rem;

        background-color: white;
        border-top: 2px solid var(--bf500);
        border-right: 1px solid var(--g300);
        border-left: 1px solid var(--g300);

        margin-right: 10px;
    }

    .en-retard {
        padding: 0.5rem 1rem;
        background-color: white;
        border-right: 6px solid #DA0505;
    }
</style>

<article>
    <a class="titre" href="fiches/edition/?epci_id={epciId}&uid={fiche.uid}">
        <h3>
            ({fiche.custom_id}) {fiche.titre}
        </h3>
    </a>

    <div class="statuts">
        <div class="avancement">
            {fiche_action_avancement_noms[fiche.avancement]}
        </div>

        {#if enRetard}
            <div class="en-retard">
                En retard
            </div>
        {/if}
    </div>
</article>