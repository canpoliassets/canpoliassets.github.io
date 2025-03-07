function MNAPortrait({ mpData: mnaData }) {
    return React.createElement('div', { className: 'mp-list' }, 
    React.createElement('a', { className: 'mp-container', href: `mna/${mnaData.name.replaceAll(' ','_').toLowerCase()}`},
        React.createElement('div', { className: 'flex' }, 
            React.createElement('div', { className: 'img-container' }, 
                React.createElement('img', { className: 'mp-img', src: `/images/mna_images/${mnaData.image_name}`, loading: 'lazy' })
            ),
            React.createElement('div', { className: 'txt-container' }, 
                React.createElement('div', { className: 'top-tile' }, 
                    React.createElement('p', { className: 'mp-name' }, mnaData.name),
                    React.createElement('p', { className: `mp-party ${mnaData.party.toLowerCase().replace(" ", "-")}` }, mnaData.party)
                ),
                React.createElement('div', { className: 'bottom-tile' }, 
                    React.createElement('p', { className: 'mp-constituency' }, mnaData.constituency),
                )
            )
        )  
        )
    );
}

// Create a container component to manage the data fetching and rendering
function MNAList() {
    const [mnas, setMnas] = React.useState([]);
    const [error, setError] = React.useState(null);

    const [selectedParty, setSelectedParty] = React.useState("Tous");
  
    React.useEffect(() => {
        fetch('/api/mnas-data')
            .then(response => response.json())
            .then(data => {
                setMnas(data.mnas);
            })
            .catch(error => {
                console.error('Error:', error);
                setError(error);
            });
    }, []);
  
    if (error) {
        return React.createElement('div', null, 'Error loading MNA data');
    }

    const parties = React.useMemo(() => ["Tous", ...new Set(mnas.map(mna => mna.party))], [mnas]);

    const filteredMps = React.useMemo(() =>
        mnas.filter(mna => {
        const partyMatch = selectedParty === "Tous" || mna.party === selectedParty;
            return partyMatch;
        }),
        [mnas, selectedParty]
    );

    return React.createElement('div', { className: 'mega-container'},
        React.createElement('div', { className: 'sorting-container'},
            React.createElement('p', {className: 'filter-text' }, 'Sélectionnez le parti politique'),
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
                { value: "Tous" },
                "Filtrer par parti politique"
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
            filteredMps.map(mna => 
                React.createElement(MNAPortrait, { key: mna.name, mpData: mna })
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
root.render(React.createElement(MNAList));
