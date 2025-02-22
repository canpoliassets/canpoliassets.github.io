const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('i18nextLng', lng);
    };

    return React.createElement('div', null,
        React.createElement('a', { href: '#', onClick: (e) => e.preventDefault() || changeLanguage("en"), style: { fontWeight: i18n.language === "en" ? "bold" : "normal" } }, 'En'),
        React.createElement('span', {}, '|'),
        React.createElement('a', { href: '#', onClick: (e) => e.preventDefault() || changeLanguage("fr"), style: { fontWeight: i18n.language === "fr" ? "bold" : "normal" } }, 'Fr')
    );
};

const Header = () => {
    const { t } = useTranslation();
    return React.createElement('div', { className: 'header' },
        React.createElement('h1', null, t('Is My MP a Landlord?')),
        React.createElement('span', null, t('All data sourced from the ')),
        React.createElement('a', { href: 'https://prciec-rpccie.parl.gc.ca/EN/PublicRegistries/Pages/PublicRegistry.aspx', target: '_blank' }, t('Office of Conflict of Interest and Ethics Commissioner')),
        React.createElement('h6', null, t('See our '), React.createElement('a', { href: '/about' }, t('About Us')))
    );
}


let mpname = window.location.pathname.split('/')[2];

function homeOwnerText(name, status) {
    if (status == 'Y') {
        return `${name} is a Home Owner.`
    }
    if (status == 'N') {
        return `${name} is not a Home Owner.`
    }
    if (status == 'UNDISCLOSED') {
        return `${name} has not disclosed their Home Ownership status.`
    }
    if (status == 'NOT SUBMITTED') {
        return `${name} has not submitted their ethics disclosure regarding Home Ownership.`
    }
    else {
        return `It is not presently known if ${name} is a Home Owner.`
    }
}

function landlordText(name, status) {
    if (status == 'Y') {
        return `${name} is a Landlord.`
    }
    if (status == 'N') {
        return `${name} is not a Landlord.`
    }
    if (status == 'UNDISCLOSED') {
        return `${name} has not disclosed their Landlord status.`
    }
    if (status == 'NOT SUBMITTED') {
        return `${name} has not submitted their ethics disclosure regarding Property Ownership.`
    }
    else {
        return `It is not presently known if ${name} is a Landlord.`
    }
}

function investorText(name, status) {
    if (status == 'Y') {
        return `${name} holds significant investments.`
    }
    if (status == 'N') {
        return `${name} does not hold any significant investments.`
    }
    if (status == 'UNDISCLOSED') {
        return `${name} has not disclosed their investment status.`
    }
    if (status == 'NOT SUBMITTED') {
        return `${name} has not submitted their ethics disclosure regarding investment status.`
    }
    else {
        return `It is not presently known if ${name} holds any investments.`
    }
}

function MPPortraitContainer({ mpData, sheetData, disclosures }) {
    const groupedDisclosures = disclosures.reduce((acc, disclosure) => {
        const { category, content } = disclosure;
        if (!acc[category]) {
        acc[category] = [];
        }
        acc[category].push(content);
        return acc;
    }, {});

    return React.createElement('div', { className: 'max'}, 
        React.createElement(LanguageSwitcher),
        React.createElement('header', {className: "title"}, React.createElement(Header)),
        React.createElement('div', { className: 'centered'}, 
            React.createElement(MPPortrait, { mpData }),
        ),
        React.createElement('div', { className: 'centered'}, 
            React.createElement('ul', { className: 'ul'},
                React.createElement('li', { className: 'homeowner'}, homeOwnerText(mpData.name, sheetData?.home_owner)),
                React.createElement('li', { className: 'landlord'}, landlordText(mpData.name, sheetData?.landlord)),
                React.createElement('li', { className: 'investor'}, investorText(mpData.name, sheetData?.investor)),
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

function MPPortrait({ mpData }) {
    return React.createElement('div', { className: 'mp-container-thin' }, 
        React.createElement('div', { className: 'flex' }, 
            React.createElement('div', { className: 'img-container' }, 
                React.createElement('img', { className: 'mp-img', src: `/images/${mpData.image_name}` })
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
    );
}

// Your existing fetch code with modifications
fetch(`/api/mp-data?name=${mpname}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Render the MPList component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(I18nextProvider, { i18n }, React.createElement(MPPortraitContainer, { mpData: data.mp[0], sheetData: data.sheet_data, disclosures: data.disclosures })));
    })
    .catch(error => {
        console.error('Error:', error);
    });
