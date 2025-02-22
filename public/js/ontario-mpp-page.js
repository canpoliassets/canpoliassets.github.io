let mppname = window.location.pathname.split('/')[2];

function homeOwnerText(name, disclosures) {
    for (let i = 0; i < disclosures.length; ++i) {
        if (disclosures[i].category == 'Liabilities') {
            if (disclosures[i].content.includes('Mortgage')) {
                return `${name} is a Home Owner.`;
            }
        }
    }
    return `${name} is not known to be a Home Owner.`;
}

function landlordText(name, disclosures) {
    for (let i = 0; i < disclosures.length; ++i) {
        if (disclosures[i].category == 'Income') {
            if (disclosures[i].content.includes('Rental')) {
                return `${name} is a Landlord.`;
            }
        }
    }
    return `${name} is not known to be a Landlord.`;
}

function investorText(name, disclosures) {
    for (let i = 0; i < disclosures.length; ++i) {
        if (disclosures[i].category == 'Assets') {
            if (disclosures[i].content.includes('securities')) {
                return `${name} holds significant investments.`;
            }
        }
    }
    for (let i = 0; i < disclosures.length; ++i) {
        if (disclosures[i].category == 'Income') {
            if (disclosures[i].content.includes('Investment')) {
                return `${name} holds significant investments.`;
            }
        }
    }
    return `${name} is not known to hold significant investments.`;
}

function MPPPortraitContainer({ mppData, disclosures }) {
    const groupedDisclosures = disclosures.reduce((acc, disclosure) => {
        const { category, content } = disclosure;
        if (!acc[category]) {
        acc[category] = [];
        }
        acc[category].push(content);
        return acc;
    }, {});

    return React.createElement('div', { className: 'max'}, 
        React.createElement('div', { className: 'centered'}, 
            React.createElement(MPPPortrait, { mppData }),
        ),
        React.createElement('div', { className: 'centered'}, 
            React.createElement('ul', { className: 'ul'},
                React.createElement('li', { className: 'homeowner'}, homeOwnerText(mppData.name, disclosures)),
                React.createElement('li', { className: 'landlord'}, landlordText(mppData.name, disclosures)),
                React.createElement('li', { className: 'investor'}, investorText(mppData.name, disclosures)),
            )
        ),
        React.createElement('div', { className: 'centered'},
            React.createElement('div', { className: 'disclosure-container'},
                Object.entries(groupedDisclosures).map(([category, contents]) =>
                    React.createElement('div', { key: category },
                        React.createElement('p', { className: 'category' }, category),
                            contents.map(content => 
                                React.createElement('div', { key: `${category}-disclosure` },
                                    content.split('\n').map((line, index) => 
                                        React.createElement('p', { key: `${category}-disclosure-${index}` }, line)
                                    )
                                )
                            )
                    )
                )
            )
        )
    )
}

function MPPPortrait({ mppData }) {
    return React.createElement('div', { className: 'mp-container-thin' }, 
        React.createElement('div', { className: 'flex' }, 
            React.createElement('div', { className: 'img-container' }, 
                React.createElement('img', { className: 'mp-img', src: `/images/mpp_images/${mppData.image_name}` })
            ),
            React.createElement('div', { className: 'txt-container' }, 
                React.createElement('div', { className: 'top-tile' }, 
                    React.createElement('p', { className: 'mp-name' }, mppData.name),
                    React.createElement('p', { className: `mp-party ${mppData.party.toLowerCase().replace(" ", "-")}` }, mppData.party)
                ),
                React.createElement('div', { className: 'bottom-tile' }, 
                    React.createElement('p', { className: 'mp-constituency' }, mppData.constituency),
                    React.createElement('p', { className: 'mp-province' }, mppData.province),
                )
            )
        )
    );
}

// Your existing fetch code with modifications
fetch(`/api/mpp-data?name=${mppname}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Render the MPList component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(MPPPortraitContainer, { mppData: data.mpp[0], disclosures: data.disclosures }));
    })
    .catch(error => {
        console.error('Error:', error);
    });
