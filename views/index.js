const [filterByParty, filterByProvince, filterByConstituency] = document.querySelectorAll("select");

filterByParty.addEventListener("input", filterResults);
filterByProvince.addEventListener("input", filterResults);
filterByConstituency.addEventListener("input", filterResults);

function filterResults(mp) {
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            for (const mp of document.querySelectorAll(".mp-card")) {
                mp.hidden = 
                    filterByParty.value === "All" && filterByProvince.value === "All" && filterByConstituency.value === "All"
                        ? false
                        : (filterByProvince.value !== "All" && mp.dataset.province !== filterByProvince.value) ||
                          (filterByParty.value !== "All" && mp.dataset.party !== filterByParty.value) ||
                          (filterByConstituency.value !== "All" && mp.dataset.constituency !== filterByConstituency.value);
            }
        });
    } else {
        for (const mp of document.querySelectorAll(".mp-card")) {
            mp.hidden = 
                filterByParty.value === "All" && filterByProvince.value === "All" && filterByConstituency.value === "All"
                    ? false
                    : (filterByProvince.value !== "All" && mp.dataset.province !== filterByProvince.value) ||
                    (filterByParty.value !== "All" && mp.dataset.party !== filterByParty.value) ||
                    (filterByConstituency.value !== "All" && mp.dataset.constituency !== filterByConstituency.value);
        }
    }
}
