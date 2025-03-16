function MLAPortrait({ mpData: mlaData }) {
    return React.createElement('div', { className: 'mp-list' }, 
    React.createElement('a', { className: 'mp-container', href: `mla/${mlaData.name.replaceAll(' ','_').toLowerCase()}`},
        React.createElement('div', { className: 'flex' }, 
            React.createElement('div', { className: 'img-container' }, 
                React.createElement('img', { className: 'mp-img', src: `/images/ab_mla_images/${mlaData.image_name}`, loading: 'lazy' })
            ),
            React.createElement('div', { className: 'txt-container' }, 
                React.createElement('div', { className: 'top-tile' }, 
                    React.createElement('p', { className: 'mp-name' }, mlaData.name),
                    React.createElement('p', { className: `mp-party ${mlaData.party.toLowerCase().replace(" ", "-")}` }, mlaData.party)
                ),
                React.createElement('div', { className: 'bottom-tile' }, 
                    React.createElement('p', { className: 'mp-constituency' }, mlaData.constituency),
                )
            )
        )  
        )
    );
}

// Create a container component to manage the data fetching and rendering
function MLAList() {
    const [mlas, setMlas] = React.useState([]);
    const [error, setError] = React.useState(null);

    const [selectedParty, setSelectedParty] = React.useState("All");
  
    React.useEffect(() => {
        fetch('/api/mlas-data')
            .then(response => response.json())
            .then(data => {
                setMlas(data.mlas);
            })
            .catch(error => {
                console.error('Error:', error);
                setError(error);
            });
    }, []);
  
    if (error) {
        return React.createElement('div', null, 'Error loading MLA data');
    }

    const parties = React.useMemo(() => ["All", ...new Set(mlas.map(mla => mla.party))], [mlas]);

    const filteredMps = React.useMemo(() =>
        mlas.filter(mp => {
        const partyMatch = selectedParty === "All" || mp.party === selectedParty;
            return partyMatch;
        }),
        [mlas, selectedParty]
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
        ),
        React.createElement('div', { className: 'mp-grid-container'},
            filteredMps.map(mla => 
                React.createElement(MLAPortrait, { key: mla.name, mpData: mla })
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
root.render(React.createElement(MLAList));
