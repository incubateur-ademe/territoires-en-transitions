<script lang="ts">
    /**
     * Permet d'ajouter une epci a la liste des epcis de l'utilisateur.
     */
    import LabeledTextInput from "../../components/shared/Forms/LabeledTextInput.svelte";

    import {v4 as uuid} from 'uuid'
    import {EpciStorable} from "../../storables/EpciStorable";
    import SelectInput from "../../components/shared/Forms/SelectInput.svelte";
    import Button from "../../components/shared/Button/Button.svelte";
    import {createEventDispatcher} from "svelte";
    import Dialog from '../../components/shared/Dialog.svelte'

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
    .custom-overflow {
        @apply overflow-auto;
        /**
         * The height of the dialog have to be set in order to apply the overflow-auto.
         * The constants applied here:
         *  - 90vh: the height of the Dialog component.
         *  - 6rem: approximatively the height of our dialog header.
         */
        height: calc(90vh - 6rem);
    }
</style>

<Dialog ariaLabelledBy="dialog-title"
        handleClose={close}
        size="small">

    <header class="flex flex-row bg-white w-full">
        <div class="flex flex-grow"></div>
        <button class="cursor-pointer p-4"
                on:click|preventDefault={close}>
            Fermer x
        </button>
    </header>

    <div class="p-14 bg-white">

        <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col">
                <h1 class="text-xl">Ma collectivité a déjà un compte</h1>
                <SelectInput bind:value={selectedEpciId}>
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

        <div class="w-full flex flex-row justify-center">

        <Button on:click={submit}>Valider</Button>
        </div>

    </div>
</Dialog>