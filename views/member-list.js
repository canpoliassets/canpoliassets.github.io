const ALL = document.documentElement.lang === "fr-ca" ? "Toutes" : "All";

document.forms.filters.addEventListener("submit", event => {
    event.preventDefault();
});

for (const control of document.forms.filters) {
    control.addEventListener("input", filterResults);
}

function filterResults(event) {
    if (matchMedia("(prefers-reduced-motion)").matches) filter();
    const viewTransition = document.startViewTransition?.(filter) ?? filter();

    // TODO: reimplement live region

    function filter() {
        const filters = Object.fromEntries(new FormData(document.forms.filters));
        console.log(filters);
        for (const member of document.querySelectorAll(".member-card")) {
            console.log(member.dataset);
            member.hidden = 
                filters.party === ALL && filters.constituency === ALL && filters.landlords !== "on"
                    ? false
                    : (filters.party !== ALL && member.dataset.party !== filters.party) ||
                      (filters.constituency !== ALL && member.dataset.constituency !== filters.constituency) ||
                      (filters.landlords === "on" && member.dataset.landlord !== "true");
        }
    }
}
