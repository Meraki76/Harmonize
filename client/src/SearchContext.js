// Import necessary React functions for creating context and managing state.
import React, { createContext, useState } from 'react';

// Create a new context for the search criteria. This will be used to provide and consume search data across components.
export const SearchContext = createContext();

// Define the SearchProvider component which will wrap part of or the entire application to provide search context.
export const SearchProvider = ({ children }) => {
    // useState hook to manage the search criteria state. It starts with an empty string indicating no initial search.
    const [searchCriteria, setSearchCriteria] = useState('');

    // The SearchProvider component returns a Context.Provider component that passes the searchCriteria and its setter function (setSearchCriteria)
    // to all child components that consume this context.
    return (
        <SearchContext.Provider value={{ searchCriteria, setSearchCriteria }}>
            {children}  {/* This allows all child components wrapped by SearchProvider to access and modify the search criteria as needed. */}
        </SearchContext.Provider>
    );
};

