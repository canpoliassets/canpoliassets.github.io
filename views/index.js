const ALL = document.documentElement.lang === "fr-ca" ? "Toutes" : "All";
const controls = [filterByParty, filterByProvince, filterByConstituency] = document.querySelectorAll("select");

for (const control of controls) control.addEventListener("input", filterResults)

function filterResults(mp) {
    if (matchMedia("not (prefers-reduced-motion)").matches) filter();
    document.startViewTransition?.(filter) ?? filter();

    function filter() {
        for (const mp of document.querySelectorAll(".mp-card")) {
            mp.hidden = 
                filterByParty.value === ALL && filterByProvince.value === ALL && filterByConstituency.value === ALL
                ? false
                : (filterByProvince.value !== ALL && mp.dataset.province !== filterByProvince.value) ||
                  (filterByParty.value !== ALL && mp.dataset.party !== filterByParty.value) ||
                  (filterByConstituency.value !== ALL && mp.dataset.constituency !== filterByConstituency.value);
        }
    }
}

