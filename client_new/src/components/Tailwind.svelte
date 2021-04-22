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

        /* Action component */
        .action h3 {
            @apply text-lg font-semibold mb-4;
        }

        .action p {
            @apply mb-2;
        }

        .action ul {
            @apply list-disc list-inside;
        }

        .action li {
            @apply mb-2;
        }

        .action li > p {
            @apply inline;
        }


        fieldset.status input:focus + label,
        fieldset.status label:hover {
            @apply bg-blue-100;
        }

        fieldset.status input:checked + label {
            @apply bg-blue-300;
        }

        /* Indicateur component */
        .indicateur p {
            @apply mb-2;
        }

        .indicateur ul {
            @apply list-disc list-inside;
        }

        .indicateur li {
            @apply mb-2;
        }

        .indicateur li > p {
            @apply inline;
        }
    }
</style>