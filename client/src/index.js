import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MessageProvider } from './MessageContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MessageProvider>
                <App />
        </MessageProvider>
  </React.StrictMode>
);

