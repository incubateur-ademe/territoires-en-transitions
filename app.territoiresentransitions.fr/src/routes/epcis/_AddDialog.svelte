<script lang="ts">
    /**
     * Permet d'ajouter une epci a la liste des epcis de l'utilisateur.
     */
    import LabeledTextInput from "$components/shared/Forms/LabeledTextInput.svelte";

    import {v4 as uuid} from 'uuid'
    import {EpciStorable} from "$storables/EpciStorable";
    import SelectInput from "$components/shared/Forms/SelectInput.svelte";
    import {createEventDispatcher} from "svelte";
    import Dialog from '$components/shared/Dialog.svelte'

    export let epcis: EpciStorable[]
    const dispatch = createEventDispatcher()

    let selectedEpciId: string = ''
    let epciNom: string = ''

    $: selectedEpciId, resolve()
    $: epciNom, resolve()

    /**
     * Resolve conflict, if there is a selected epci set epciNom to an empty string.
     * this is temporary until design is fixed
     */
    const resolve = () => {
        if (selectedEpciId) epciNom = ''
    }

    const submit = async (event: MouseEvent) => {
        if (selectedEpciId) {
            // Add rights.
            const auth = await import('../../api/authentication')
            await auth.addDroits(selectedEpciId, true)
        } else if (epciNom.trim()) {
            // Create Epci
            const stores = await import('../../api/hybridStores')
            const epci = new EpciStorable({
                uid: uuid(),
                siren: '',
                insee: '',
                nom: epciNom.trim(),
            })
            await stores.epciStore.store(epci)
        }

        close(event)
    }

    const close = (event: MouseEvent) => dispatch('AddDialogClose', event)
</script>

<style>
    .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-column-gap: 10%;
    }

    .bottom {
        display: flex;
        justify-content: center;
        margin-top: 2rem;
    }

    div :global(fieldset) {
        max-width: 100%;
    }

</style>

<Dialog ariaLabelledBy="dialog-title"
        handleClose={close}
        size="small">

    <div>
        <div class="grid">
            <div class="flex flex-col">
                <h1 class="text-xl">Ma collectivité a déjà un compte</h1>
                <SelectInput bind:value={selectedEpciId} label="Nom de ma collectivité">
                    <option value="">Sélectionnez une collectivité</option>
                    {#each epcis as epci}
                        <option value="{epci.id}">{epci.nom}</option>
                    {/each}
                </SelectInput>
            </div>
            <div class="flex flex-col">
                <h1 class="text-xl">Ma collectivité n'a pas encore de compte</h1>
                <LabeledTextInput bind:value={epciNom}>
                    <span>Nom de ma collectivité</span>
                </LabeledTextInput>
            </div>
        </div>

        <div class="bottom">
            <button class="fr-btn fr-btn--secondary fr-btn--sm" on:click={submit}>Valider</button>
        </div>
    </div>
</Dialog>