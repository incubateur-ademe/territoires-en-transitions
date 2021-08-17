import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import {App} from 'app/App';
import reportWebVitals from './reportWebVitals';
// import { RouteProvider } from "app/Router";
import {overmind} from 'core-logic/overmind';
import {Provider} from 'overmind-react';

ReactDOM.render(
  <React.StrictMode>
    <Provider value={overmind}>
      {/* <RouteProvider> */}
      <App />
      {/* </RouteProvider> */}
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
