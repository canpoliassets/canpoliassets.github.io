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

function MPPPortrait({ mpData }) {
    return React.createElement('div', { className: 'mp-list' },
    React.createElement('a', { className: 'mp-container', href: `mp/${mpData.name.replaceAll(' ','_').toLowerCase()}_${mpData.province.toLowerCase()}`},
        React.createElement('div', { className: 'flex' },
            React.createElement('div', { className: 'img-container' },
                React.createElement('img', { className: 'mp-img', src: `/images/mp_images/${mpData.image_name}`, loading: 'lazy'  })
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
function MPPList() {
    const [mps, setMps] = React.useState([]);
    const [error, setError] = React.useState(null);
    const { i18n, t } = useTranslation();

    const [selectedProvince, setSelectedProvince] = React.useState(t("All"));
    const [selectedParty, setSelectedParty] = React.useState(t("All"));

    React.useEffect(() => {
        setSelectedProvince(t("All"));
    }, [i18n.language, t]);

    React.useEffect(() => {
        setSelectedParty(t("All"));
    }, [i18n.language, t]);

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

    const provinces = React.useMemo(() => [t("All"), ...new Set(mps.map(mp => mp.province))], [mps, i18n.language]);
    const parties = React.useMemo(() => [t("All"), ...new Set(mps.map(mp => mp.party))], [mps, i18n.language]);

    const filteredMps = React.useMemo(() =>
        mps.filter(mp => {
        const provinceMatch = selectedProvince === t("All") || mp.province === selectedProvince;
        const partyMatch = selectedParty === t("All") || mp.party === selectedParty;
            return provinceMatch && partyMatch;
        }),
        [mps, selectedProvince, selectedParty]
    );

    return React.createElement('div', { className: 'mega-container'},
        React.createElement(LanguageSwitcher),
        React.createElement('header', {className: "title"}, React.createElement(Header)),
        React.createElement('div', { className: 'sorting-container'},
            React.createElement('p', {className: 'filter-text' }, t('Select Party')),
            React.createElement(
                "select",
                {
                value: selectedParty,
                onChange: (e) =>
                    setSelectedParty(e.target.value),
                className: "filter-selector"
                },
                ...parties.map(party =>
                    React.createElement(
                        "option",
                        { key: party, value: party },
                        party
                    )
                )
            ),
            React.createElement('p', {className: 'filter-text' }, t('Select Province')),
            React.createElement(
                "select",
                {
                value: selectedProvince,
                onChange: (e) =>
                    setSelectedProvince(e.target.value),
                className: "filter-selector"
                },
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
                React.createElement(MPPPortrait, { key: mp.name, mpData: mp })
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

// Render the MPPList component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(I18nextProvider, { i18n }, React.createElement(MPPList)));
