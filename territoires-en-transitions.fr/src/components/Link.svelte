<script>
  export let href = '';
  export let title = undefined;
</script>

<a {href} {title} rel={href.substring(0, 4) === 'http' ? 'external' : undefined}>
  <slot />
</a>
