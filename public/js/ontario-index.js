function MPPPortrait({ mpData: mppData }) {
    return React.createElement('div', { className: 'mp-list' }, 
    React.createElement('a', { className: 'mp-container', href: `/en/on/${mppData.name.replaceAll(' ','_').toLowerCase()}`},
        React.createElement('div', { className: 'flex' }, 
            React.createElement('div', { className: 'img-container' }, 
                React.createElement('img', { className: 'mp-img', src: `/images/mpp_images/${mppData.image_name}`, loading: 'lazy' })
            ),
            React.createElement('div', { className: 'txt-container' }, 
                React.createElement('div', { className: 'top-tile' }, 
                    React.createElement('p', { className: 'mp-name' }, mppData.name),
                    React.createElement('p', { className: `mp-party ${mppData.party.toLowerCase().replace(" ", "-")}` }, mppData.party)
                ),
                React.createElement('div', { className: 'bottom-tile' }, 
                    React.createElement('p', { className: 'mp-constituency' }, mppData.constituency),
                )
            )
        )  
        )
    );
}

// Create a container component to manage the data fetching and rendering
function MPPList() {
    const [mpps, setMpps] = React.useState([]);
    const [error, setError] = React.useState(null);

    const [selectedParty, setSelectedParty] = React.useState("All");
  
    React.useEffect(() => {
        fetch('/api/mpps-data')
            .then(response => response.json())
            .then(data => {
                setMpps(data.mpps);
            })
            .catch(error => {
                console.error('Error:', error);
                setError(error);
            });
    }, []);
  
    if (error) {
        return React.createElement('div', null, 'Error loading MPP data');
    }

    const parties = React.useMemo(() => ["All", ...new Set(mpps.map(mpp => mpp.party))], [mpps]);

    const filteredMps = React.useMemo(() =>
        mpps.filter(mp => {
        const partyMatch = selectedParty === "All" || mp.party === selectedParty;
            return partyMatch;
        }),
        [mpps, selectedParty]
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
            filteredMps.map(mpp => 
                React.createElement(MPPPortrait, { key: mpp.name, mpData: mpp })
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
root.render(React.createElement(MPPList));
