import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { UserProvider } from './context/UserContext'; // <-- 1. Import the provider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider> {/* <-- 2. Wrap your App component */}
      <App />
    </UserProvider>
  </React.StrictMode>,
); 