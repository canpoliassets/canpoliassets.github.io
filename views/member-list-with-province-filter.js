const ALL = document.documentElement.lang === "fr-ca" ? "Toutes" : "All";

document.forms.filters.addEventListener("submit", event => event.preventDefault());

for (const control of document.forms.filters) control.addEventListener("input", filterResults);

function filterResults(event) {
    if (matchMedia("(prefers-reduced-motion) or (max-width: 450px)").matches) filter();
    document.startViewTransition?.(filter) ?? filter();

    function filter() {
        if (event.target.id === "filter-province") {
            for (const group of document.querySelectorAll("#filter-constituency optgroup")) {
                const filteredOut = event.target.value === ALL ? false : event.target.value !== group.dataset.province;
                group.hidden = filteredOut;
                for (const option of group.children) {
                    /* This accommodates for Chrome (without custom select styling) */
                    option.hidden = filteredOut;
                    /* This accommodates for Safari */
                    option.disabled = filteredOut;
                }
            }
            document.forms.filters.constituency.value = ALL;
        }

        const filters = Object.fromEntries(new FormData(document.forms.filters));
        for (const member of document.querySelectorAll(".member-card")) {
            member.hidden = 
                filters.party === ALL && filters.province === ALL && filters.constituency === ALL && filters.landlords !== "on"
                    ? false
                    : (filters.province !== ALL && member.dataset.province !== filters.province) ||
                      (filters.party !== ALL && member.dataset.party !== filters.party) ||
                      (filters.constituency !== ALL && member.dataset.constituency !== filters.constituency) ||
                      (filters.landlords === "on" && member.dataset.landlord !== "true");
        }
    }
}
