import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchContext } from './SearchContext';
import axios from 'axios';

function SearchBar() {
    const [searchTerm, setSearchTerm] = useState('');
    const { setSearchCriteria } = useContext(SearchContext);
    const location = useLocation();
    const navigate = useNavigate();

    const handleSearch = async (event) => {
        event.preventDefault();
        if (location.pathname.includes('/profile')) {
            // When in profile page, search for users by displayName
            try {
                const response = await axios.get(`http://localhost:8888/users/search/${searchTerm}`);
                if (response.data.length > 0) {
                    navigate(`/profile/${response.data[0].displayName}`); // Navigate using displayName
                } else {
                    alert('No users found'); // This should be triggering already if no users are found
                }
            } catch (error) {
                console.error('Error searching for users:', error);
                if (error.response && error.response.status === 404) {
                    alert('No users found');
                } else {
                    alert('Failed to perform search');
                }
            }
        } else {
            // Default behavior in other parts of the app
            setSearchCriteria(searchTerm);
        }
    };

    return (
        <div style={{ position: 'absolute', right: '20px', top: '20px' }}>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder={location.pathname.includes('/profile') ? "Search users by name..." : "Search posts..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">Search</button>
            </form>
        </div>
    );
}

export default SearchBar;
