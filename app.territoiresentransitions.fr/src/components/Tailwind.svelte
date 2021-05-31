<style global>
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    @layer components {

        body {
            background-color: #f3f4f6;
        }

        :focus {
            @apply outline-black;
        }

        /* Expandable component */
        details.expandable > summary {
            list-style: none;
        }

        details.expandable > summary::-webkit-details-marker {
            display: none;
        }

        details.expandable[open] > summary {
            @apply bg-gray-200;
            @apply shadow-inner;
        }

        fieldset.status input:focus + label,
        fieldset.status label:hover {
            @apply bg-blue-100;
        }

        fieldset.status input:checked + label {
            @apply bg-blue-300;
        }

        /* Size utility */
        .h-screen-90 {
            height: 90vh;
        }

        .w-screen-90 {
            width: 90vw;
        }

        /* Indicateur component - IndicateurReferentielCard.svelte */
        .indicateur .description p {
            @apply mb-4;
        }

        .indicateur .description ul {
            @apply list-disc list-inside;
        }

        .indicateur .description li {
            @apply mb-4;
        }

        .indicateur .description li > p {
            @apply inline;
        }
    }
</style>