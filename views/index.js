const ALL = document.documentElement.lang === "fr-ca" ? "Toutes" : "All";
const controls = [filterByParty, filterByProvince, filterByConstituency] = Array.from(document.querySelectorAll("select"));
const onlyLandlords = document.getElementById("only-landlords");
const liveRegion = document.getElementById("live-region");

controls.push(onlyLandlords);

for (const control of controls) control.addEventListener("input", filterResults)

function filterResults(mp) {
    liveRegion.ariaBusy = "true";
    if (matchMedia("(prefers-reduced-motion)").matches) filter();
    const viewTransition = document.startViewTransition?.(filter) ?? filter();

    viewTransition?.finished.then(updateLiveRegion) ?? requestAnimationFrame(updateLiveRegion);

    function filter() {
        for (const mp of document.querySelectorAll(".mp-card")) {
            mp.hidden = 
                filterByParty.value === ALL && filterByProvince.value === ALL && filterByConstituency.value === ALL && !onlyLandlords.checked
                ? false
                : (filterByProvince.value !== ALL && mp.dataset.province !== filterByProvince.value) ||
                  (filterByParty.value !== ALL && mp.dataset.party !== filterByParty.value) ||
                  (filterByConstituency.value !== ALL && mp.dataset.constituency !== filterByConstituency.value) ||
                  (onlyLandlords.checked && mp.dataset.landlord === "false");
        }
    }

    function updateLiveRegion() {
        const visibleCards = Array.from(document.querySelectorAll(".mp-card:not([hidden])")).length;

        liveRegion.textContent = `Showing ${visibleCards} ${filterByParty.value === ALL ? "" : `${filterByParty.value}`} MPs from ${filterByProvince.value === ALL ? "all provinces and territories" : filterByProvince.value}${onlyLandlords.checked ? " that are landlords" : ""}.`;
        liveRegion.ariaBusy = "false";
    }
}
