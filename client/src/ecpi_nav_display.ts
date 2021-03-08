import EpciNavDisplay from './components/shared/EpciNavDisplay.svelte'

/**
 * Display epci name after site title.
 */
new EpciNavDisplay({
    target: document.body.querySelector('#epci_nav_display')!,
})
