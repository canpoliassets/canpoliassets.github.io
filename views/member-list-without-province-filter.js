const ALL = document.documentElement.lang === "fr-ca" ? "Toutes" : "All";

document.forms.filters.addEventListener("submit", event => event.preventDefault());

for (const control of document.forms.filters) control.addEventListener("input", filterResults);

function filterResults() {
    if (matchMedia("(prefers-reduced-motion) or (max-width: 450px)").matches) filter();
    document.startViewTransition?.(filter) ?? filter();

    function filter() {
        const filters = Object.fromEntries(new FormData(document.forms.filters));
        for (const member of document.querySelectorAll(".member-card")) {
            member.hidden = 
                filters.party === ALL && filters.constituency === ALL && filters.landlords !== "on"
                    ? false
                    : (filters.party !== ALL && member.dataset.party !== filters.party) ||
                      (filters.constituency !== ALL && member.dataset.constituency !== filters.constituency) ||
                      (filters.landlords === "on" && member.dataset.landlord !== "true");
        }
    }
}
