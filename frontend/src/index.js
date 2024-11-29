import './styles/index.css';
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import LoadingSpinner from './components/LoadingSpinner';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <UserProvider>
          <App />
        </UserProvider>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);