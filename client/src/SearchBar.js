// Import necessary React utilities and hooks for routing and context management.
import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchContext } from './SearchContext'; // Context for managing search criteria globally.
import axios from 'axios'; // Axios for making HTTP requests.

function SearchBar() {
    // State to hold the current value of the search input field.
    const [searchTerm, setSearchTerm] = useState('');
    // Extract setSearchCriteria function from context to update search criteria globally.
    const { setSearchCriteria } = useContext(SearchContext);
    // Hooks to access the current location and to navigate programmatically.
    const location = useLocation();
    const navigate = useNavigate();

    // Handler for the search form submission.
    const handleSearch = async (event) => {
        event.preventDefault(); // Prevent the default form submission behavior.
        // Special case for handling searches from the profile page.
        if (location.pathname.includes('/profile')) {
            // When on a profile page, search specifically for users by displayName.
            try {
                const response = await axios.get(`http://localhost:8888/users/search/${searchTerm}`);
                if (response.data.length > 0) {
                    // If users are found, navigate to the first user's profile using displayName.
                    navigate(`/profile/${response.data[0].displayName}`);
                } else {
                    alert('No users found'); // Alert if no users match the search term.
                }
            } catch (error) {
                console.error('Error searching for users:', error);
                // Provide more specific error feedback based on the server's response.
                if (error.response && error.response.status === 404) {
                    alert('No users found');
                } else {
                    alert('Failed to perform search');
                }
            }
        } else {
            // In other parts of the app, update the global search criteria used for filtering posts.
            setSearchCriteria(searchTerm);
        }
    };

    // Function to clear the search input
    const clearSearch = () => {
        setSearchTerm('');
        if (!location.pathname.includes('/profile')) {
            // Also clear global search criteria if not on profile page
            setSearchCriteria('');
        }
    };

    // Render the search bar with a conditional placeholder text based on the current location.
    return (
        <div style={{ position: 'absolute', right: '20px', top: '20px' }}>
            <form onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder={location.pathname.includes('/profile') ? "Search users by name..." : "Search posts..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} // Update searchTerm as the user types.
                />
                <button type="submit">Search</button> {/* Button to submit the search form. */}
                <button type="button" onClick={clearSearch}>Clear</button> {/* Button to clear the search input. */}
            </form>
        </div>
    );
}

export default SearchBar;
