import React from 'react';
import ReactDOM from 'react-dom';
import {defaults} from 'react-chartjs-2';
import {App} from 'app/App';
import reportWebVitals from './reportWebVitals';

import 'css/tailwind.css';
import 'app/static/_app/assets/css/dsfr.css';
import 'css/app.css';

// typo par défaut pour les graphiques
defaults.font = {...defaults.font, family: 'Marianne', size: 14};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
