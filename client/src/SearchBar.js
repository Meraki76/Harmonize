// SearchBar.js
import React, { useContext, useState } from 'react';
import { SearchContext } from './SearchContext'; // Assuming this is set up for global state management

function SearchBar() {
    const [searchTerm, setSearchTerm] = useState('');
    const { setSearchCriteria } = useContext(SearchContext);

    const handleSearch = (event) => {
        event.preventDefault();
        setSearchCriteria(searchTerm);
    };

    return (
        <div style={{ position: 'absolute', right: '20px', top: '20px' }}>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>
        </div>
    );
}

export default SearchBar;
