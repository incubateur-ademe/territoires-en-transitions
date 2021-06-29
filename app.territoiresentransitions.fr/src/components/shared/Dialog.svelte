<script lang="ts">
    export let ariaLabelledBy
    export let handleClose
    export let ariaDescribedBy = undefined


    const handleKeydown = e => {
        if (e.key == 'Escape') {
            handleClose(e)
            return
        }
    }
</script>

<svelte:window on:keydown={handleKeydown}/>

<!--<div class="bg-black bg-opacity-25 fixed top-0 left-0 h-full w-full"
     on:click|preventDefault={handleClose}>
</div>

<div role="alertdialog"
     aria-modal="true"
     aria-labelledby={ariaLabelledBy}
     aria-describedby={ariaDescribedBy}
     class="fr-modal"
>

</div>
-->

<!-- Modale Simple
     La balise <dialog> peut être placée n'importe où sur la page, toutefois
     nous vous conseillons, si vous en avez la possibilité,
     d'en faire un enfant direct de la balise <body>
-->

<dialog aria-labelledby="fr-modal-title-modal-1" role="dialog" id="fr-modal-1" class="fr-modal">
    <div class="fr-container--fluid fr-container-md">
        <div class="fr-grid-row fr-grid-row--center">
            <div class="fr-col-12 fr-col-md-6">
                <div class="fr-modal__body">
                    <div class="fr-modal__header">
                        <button class="fr-link--close fr-link" title="Fermer la fenêtre modale"
                                aria-controls="fr-modal-1">Fermer
                        </button>
                    </div>

                    <div class="fr-modal__content">
                        <h1 id="fr-modal-title-modal-1" class="fr-modal__title"><span
                                class="fr-fi-arrow-right-line fr-fi--lg"></span>Titre de la modale</h1>
                        <slot></slot>
                    </div>
                </div>
            </div>
        </div>
    </div>
</dialog>