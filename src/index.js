import React from 'react';
import ReactGA from 'react-ga';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import TagManager from 'react-gtm-module';
const tagManagerArgs = {
  gtmId: 'GTM-WMVNWGP6'
};
TagManager.initialize(tagManagerArgs);

const TRACKING_ID="G-9X7C374D7Y"
ReactGA.initialize(TRACKING_ID);
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
