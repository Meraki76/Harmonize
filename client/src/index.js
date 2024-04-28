// Import React library for building user interfaces and ReactDOM for DOM-related rendering methods.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import the main App component of the application.
import { MessageProvider } from './MessageContext'; // Import the context provider for managing global state related to messages.

// Use ReactDOM to get a reference to the root DOM element where the React app will be mounted.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the React application within the root element with strict mode enabled.
root.render(
  <React.StrictMode>
    {/* MessageProvider wraps the App component to provide message-related state throughout the component tree. */}
    <MessageProvider>
      <App /> {/* The App component is the root component of the React application, containing all other components. */}
    </MessageProvider>
  </React.StrictMode>
);
