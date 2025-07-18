// Solution trouvée: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists

/** Attend qu'une balise html soit présente dans le dom pour faire une action */
export function waitForMarkup(selector: string) {
  return new Promise((resolve: (el: Element | null) => void) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
