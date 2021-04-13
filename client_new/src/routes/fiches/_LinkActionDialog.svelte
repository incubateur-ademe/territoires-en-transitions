<script lang="ts">
    import map from 'ramda'
    import Dialog from "../../components/shared/Dialog.svelte";
    import {createEventDispatcher} from "svelte"

    const dispatch = createEventDispatcher()
    const close = () => dispatch('close')

    const referentiel = await import("../../../generated/data/actions_referentiels")
</script>

<Dialog ariaLabelledBy="dialog-title" handleClose={close}>
    <div class="bg-gray-100">
        <header class="bg-white p-4">
            <a class="cursor underline" on:click={close}>< Retourner à la fiche</a>
            <h2 id="dialog-title">Lier une action</h2>
        </header>
        <div class="p-3">

        </div>
    </div>
</Dialog>