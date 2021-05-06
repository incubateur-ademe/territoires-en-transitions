<script>
    import Button from "../components/shared/Button/Button.svelte";

    /**
     * Hard navigate to the test epci in order to clear Sapper state.
     */
    const handleTest = (_) => {
        window.location.href = 'fiches/?epci_id=test'
    }

</script>

<svelte:head>
    <title>page temporaire</title>
</svelte:head>

<main class="container mx-auto lg:px-20 px-4 max-w-4xl m-auto bg-white">
    <h1 class="text-4xl text-center pt-20 pb-10">
        Le site pour aider <b>les collectivités</b>
        <br>
        dans leur <b>transition écologique !</b>
    </h1>

    <h2 class="text-2xl  text-center pt-10 pb-5">
        <b>Testez</b> maintenant et demandez nous <b>un compte</b>
        <br>
        pour <b>gérer le plan d'actions</b> de votre collectivité !
    </h2>

    <div class="p-10">
        <div class="pb-10 flex justify-evenly max-w-2xl m-auto ">
            <Button on:click={handleTest}
                    classNames="bg-seagreen-400">
                Tester maintenant
            </Button>

            <Button asLink
                    href="#je-veux-un-compte">
                Je veux un compte !
            </Button>
        </div>
    </div>

    <section class="pb-10">
        <h3 class="text-2xl font-bold py-3">
            Quelques détails…
        </h3>
        <p class="py-2">
            Un outil basé sur <b>les référentiels nationaux</b> Climat-Air-Énergie et Économie circulaire de l'ADEME ;
        </p>
        <p class="py-2">
            <b>Des actions et indicateurs personnalisables</b> selon les spécificités de votre collectivité ;
        </p>
        <p class="py-2">
            Un <b>suivi</b> facilité <b>de vos actions</b>, individuellement ou en équipe.
        </p>
    </section>

    <section id="je-veux-un-compte" class="pb-10">
        <h3 class="text-2xl font-bold py-3">
            Ça m'intéresse, je peux avoir un compte ?
        </h3>
        <p class="py-2">
            Avec plaisir !
            <br>
            Il suffit de nous écrire à
            <a href="mailto:contact@territoiresentransitions.fr"
               class="underline">
                contact@territoiresentransitions.fr
            </a>
        </p>
    </section>

    <section class="pb-10">
        <h3 class="text-2xl font-bold py-3">
            Vous avez des questions ?
        </h3>
        <p class="py-2">
            N'hésitez pas à nous les poser sur
            <a href="mailto:contact@territoiresentransitions.fr"
               class="underline">
                contact@territoiresentransitions.fr
            </a>
        </p>
    </section>
</main>

<div class="hidden">
    <!-- Forces sapper to generate html pages -->
    <a href="fiches/">Plan d'actions</a>
    <a href="fiches/creation/">Nouvelle fiche action</a>
    <a href="fiches/edition/">Fiche action</a>
    <a href="actions_referentiels/">Référentiels</a>
    <a href="indicateurs/">Indicateurs</a>
</div>
