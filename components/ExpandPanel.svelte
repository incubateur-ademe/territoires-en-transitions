<style>
    details {
        width: 100%;
        padding: 0.75rem 0;
        border-top: 1px solid var(--g300);
        border-bottom: 1px solid var(--g300);
    }

    details[open] {
        padding-bottom: 1.5rem;
    }

    details[open] summary {
        margin-bottom: 1rem;
    }

    details summary::after {
        content: "+";
        margin-left: auto;
    }

    details[open] summary::after {
        content: "-";
    }

    :global(summary::-webkit-details-marker) {
        display: none;
    }

    summary {
        display: flex;
        align-items: center;
    }


    details :global([slot="title"]) {
        margin-bottom: 0;
        font-size: 1rem;
        font-weight: normal;
        line-height: 1.5;
    }

    details[open] :global([slot="title"]) {
        font-weight: bold;
    }

    details :global([slot="content"] h3) {
        font-size: 1rem;
        margin-top: 2rem;
        line-height: 1.2;
    }

    details :global([slot="content"] h3:not(:first-of-type)) {
        margin-top: 1.5rem;
    }

    details :global([slot="content"] p) {
        margin-bottom: .5rem;
    }

    details :global([slot="content"] ul) {
        list-style: disc;
        padding-left: 1rem;
    }
</style>

<details>
    <summary>
        <slot name="title"></slot>
    </summary>

    <slot name="content"></slot>
</details>