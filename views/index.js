const [filterByParty, filterByProvince] = document.querySelectorAll("select");

filterByParty.addEventListener("input", filterResults);
filterByProvince.addEventListener("input", filterResults);

function filterResults(mp) {
    document.startViewTransition(() => {
        for (const mp of document.querySelectorAll(".mp-list")) {
            mp.hidden = 
                filterByParty.value === "All" && filterByProvince.value === "All"
                    ? false
                    : (filterByProvince.value !== "All" && mp.dataset.province !== filterByProvince.value) ||
                      (filterByParty.value !== "All" && mp.dataset.party !== filterByParty.value);
        }
    });
}
