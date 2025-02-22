function MPPortrait({ mpData }) {
    return React.createElement('div', { className: 'mp-list' }, 
    React.createElement('a', { className: 'mp-container', href: `mp/${mpData.name.replaceAll(' ','_').toLowerCase()}_${mpData.province.toLowerCase()}`},
        React.createElement('div', { className: 'flex' }, 
            React.createElement('div', { className: 'img-container' }, 
                React.createElement('img', { className: 'mp-img', src: `/images/${mpData.image_name}`, loading: 'lazy' })
            ),
            React.createElement('div', { className: 'txt-container' }, 
                React.createElement('div', { className: 'top-tile' }, 
                    React.createElement('p', { className: 'mp-name' }, mpData.name),
                    React.createElement('p', { className: `mp-party ${mpData.party.toLowerCase().replace(" ", "-")}` }, mpData.party)
                ),
                React.createElement('div', { className: 'bottom-tile' }, 
                    React.createElement('p', { className: 'mp-constituency' }, mpData.constituency),
                    React.createElement('p', { className: 'mp-province' }, mpData.province),
                )
            )
        )  
        )
    );
}

// Create a container component to manage the data fetching and rendering
function MPList() {
    const [mps, setMps] = React.useState([]);
    const [error, setError] = React.useState(null);

    const [selectedProvince, setSelectedProvince] = React.useState("All");
    const [selectedParty, setSelectedParty] = React.useState("All");
  
    React.useEffect(() => {
        fetch('/api/mps-data')
            .then(response => response.json())
            .then(data => {
                setMps(data.mps);
            })
            .catch(error => {
                console.error('Error:', error);
                setError(error);
            });
    }, []);
  
    if (error) {
        return React.createElement('div', null, 'Error loading MP data');
    }

    const provinces = React.useMemo(() => ["All", ...new Set(mps.map(mp => mp.province))], [mps]);
    const parties = React.useMemo(() => ["All", ...new Set(mps.map(mp => mp.party))], [mps]);

    const filteredMps = React.useMemo(() =>
        mps.filter(mp => {
        const provinceMatch = selectedProvince === "All" || mp.province === selectedProvince;
        const partyMatch = selectedParty === "All" || mp.party === selectedParty;
            return provinceMatch && partyMatch;
        }),
        [mps, selectedProvince, selectedParty]
    );

    return React.createElement('div', { className: 'mega-container'},
        React.createElement('div', { className: 'sorting-container'},
            React.createElement('p', {className: 'filter-text' }, 'Select Party'),
            React.createElement(
                "select",
                {
                value: selectedParty,
                onChange: (e) => 
                    setSelectedParty(e.target.value),
                className: "filter-selector"
                },
                React.createElement(
                "option",
                { value: "All" },
                "Filter by Party"
                ),
                ...parties.map(party => 
                    React.createElement(
                        "option",
                        { key: party, value: party },
                        party
                    )
                )
            ),
            React.createElement('p', {className: 'filter-text' }, 'Select Province'),
            React.createElement(
                "select",
                {
                value: selectedProvince,
                onChange: (e) => 
                    setSelectedProvince(e.target.value),
                className: "filter-selector"
                },
                React.createElement(
                "option",
                { value: "All" },
                "Filter by Province"
                ),
                ...provinces.map(province => 
                    React.createElement(
                        "option",
                        { key: province, value: province },
                        province
                    )
                )
            ),
        ),
        React.createElement('div', { className: 'mp-grid-container'},
            filteredMps.map(mp => 
                React.createElement(MPPortrait, { key: mp.name, mpData: mp })
            )
        )
    );
}


// Add lazy loading to images
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.loading = 'lazy';
    });
});
  
// Render the MPList component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(MPList));
