<script lang="ts">
    export let ariaLabelledBy
    export let handleClose
    export let ariaDescribedBy = undefined

    // default size is medium with 6, 12 is very large, 4 is small, 8 is large
    export let size = '6'

    const handleKeydown = e => {
        if (e.key == 'Escape') {
            handleClose(e)
            return
        }
    }
</script>

<svelte:window on:keydown={handleKeydown}/>

<!-- Pas de fermeture sur le click de l'overlay, ça serait cool -->
<dialog aria-labelledby="{ariaLabelledBy}"
        aria-describedby="{ariaDescribedBy}"
        role="dialog"
        id="fr-modal-1"
        class="fr-modal fr-modal--opened">
    <div class="fr-container--fluid fr-container-md">
        <div class="fr-grid-row fr-grid-row--center">
            <div class="fr-col-12 fr-col-md-{size}">
                <div class="fr-modal__body">
                    <div class="fr-modal__header">
                        <button class="fr-link--close fr-link" title="Fermer la fenêtre modale"
                                aria-controls="fr-modal-1" on:click|preventDefault={handleClose}>Fermer
                        </button>
                    </div>

                    <div class="fr-modal__content">
                        <h1 id="fr-modal-title-modal-1" class="fr-modal__title">
                            <slot name="modal-title"></slot>
                        </h1>
                        <slot></slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</dialog>