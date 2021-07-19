<script lang="ts">
    /**
     * The root page either:
     *  - shows sign in and register buttons
     *  - redirects to /epcis/ if the user is connected
     */
    import {onMount} from "svelte";

    let connected: boolean | null = null

    onMount(async () => {
        const auth = await import("../api/authentication")
        connected = auth.connected()
        if (connected) window.location.href = '/epcis/'
    })
</script>

<svelte:head>
    <title>Territoires en Transitions</title>
</svelte:head>

<style>
    .hidden {
        display: none;
    }

    section {
        max-width: 60%;
    }

    div {
        display: flex;
        flex-direction: row-reverse;
        align-items: flex-start;
    }

    .fr-btn + .fr-btn {
        margin-right: 2rem;
    }
</style>

{#if connected === null}
    <p>Chargement en cours...</p>
{:else if connected}
    <p>Redirection en cours...</p>
{:else }
    <section>
        <h1>À vous de jouer !</h1>

        <p>Territoires en Transitions est un outil public gratuit et open-source pour les collectivités, financé par
            l'ADEME. Actuellement à ses débuts, la plateforme a besoin de vous pour évoluer dans le sens de vos
            besoins. Rejoignez-nous dans sa co-construction en créant votre compte en moins d'une minute.</p>

        <div>
            <a class="fr-btn" href="auth/signin/">Se connecter</a>
            <a class="fr-btn fr-btn--secondary" href="auth/register/">Créer un compte</a>
        </div>
    </section>
{/if}

<div class="hidden">
    <!-- Forces sapper to generate html pages -->
    <a href="fiches/">Plan d'actions</a>
    <a href="epcis/">Collectivités</a>
    <a href="fiches/creation/">Nouvelle fiche action</a>
    <a href="fiches/edition/">Fiche action</a>
    <a href="actions_referentiels/">Référentiels</a>
    <a href="indicateurs/">Indicateurs</a>
    <a href="auth/signin/">Se connecter</a>
    <a href="auth/signout/">Se déconnecter</a>
    <a href="auth/redirect/">Connexion</a>
    <a href="auth/token_signin/">Connexion</a>
    <a href="auth/register/">Créer un compte</a>
</div>