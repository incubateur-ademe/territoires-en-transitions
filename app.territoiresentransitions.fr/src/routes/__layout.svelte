<script lang="ts">
	import Matomo, {asyncMatomo} from '$components/tracking/Matomo.svelte'
	import {onMount} from 'svelte'
	import Header from '$components/shared/Layout/Header.svelte'
	import Footer from '$components/shared/Layout/Footer.svelte'
	import Head from './_head.svelte'
	import Nav from '$components/shared/Nav/Nav.svelte'
	import NavDev from '$components/shared/Nav/NavDev.svelte'
	import Tailwind from '$components/Tailwind.svelte'
	import { page } from '$app/stores';
	import { updateEpciIdAndFetchAll } from '$api/svelteStore';
	import { getCurrentEpciId } from '$api/currentEpci';


	$: if ($page) {
		asyncMatomo.trackPageView()
	}

	onMount(async () => {
		asyncMatomo.trackPageView();
		// Note that `getCurrentEpciId` method is deprecated to get rid of it everywhere, except here.
		const epciId = getCurrentEpciId();
		if (epciId) await updateEpciIdAndFetchAll(epciId);
	})

</script>

<style>
	main {
		position: relative;
		max-width: 70em;
		padding: 3.25rem 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>

<div>

</div>
<Tailwind />
<Head/>
<Matomo />
<div class="fr-container">

	<p class="p-5">
		⚠🐞⌛ Migration technique et correction de bugs d'affichage en cours. Vous
		pouvez continuer à utiliser l'application, il est possible que vous
		rencontriez des bugs d'affichage. Les sessions sont limitées à 60 minutes.
		Au-delà, reconnectez vous à l'application afin d'assurer l'enregistrement
		des vos informations. ⌛🐞⚠
	</p>
</div>
<Header>
	<Nav slot="nav" />
	<NavDev slot="secondary" />
</Header>

<main>
	<slot></slot>
</main>

<Footer>
	<div slot="description">
		<p class="fr-footer__content-desc">
			Territoires en transitions accompagne les collectivités afin de les aider à piloter plus facilement leur
			transition écologique.
		</p>
		<p class="fr-footer__content-desc">
			Vous rencontrez une difficulté ? Une suggestion pour nous aider à améliorer l'outil ? Écrivez-nous à :
			<a href="mailto:aide@territoiresentransitions.fr?subject=Aide sur app.territoiresentransitions.fr">
				aide@territoiresentransitions.fr
			</a>
		</p>
	</div>


	<div slot="navigation" class="fr-footer__bottom">
		<ul class="fr-footer__bottom-list">
			<li class="fr-footer__bottom-item">
				<a class="fr-footer__bottom-link" href="https://territoiresentransitions.fr/mentions-legales/" target="_self">Mentions légales</a>
			</li>
			<li class="fr-footer__bottom-item">
				<a class="fr-footer__bottom-link" href="https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel" rel="external" target="_blank">Protection des données</a>
			</li>
		</ul>
	</div>
</Footer>
