import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/glass-tabs.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/pages-extra.css';
import './styles/animations.css';
import './index.css';
import App from './App.jsx';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
