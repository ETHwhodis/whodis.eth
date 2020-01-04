import React from 'react';
import Content from './components/Content';
import { transitions, positions, Provider as AlertProvider } from 'react-alert'
import AlertTemplate from 'react-alert-template-basic'
import './App.css';


// optional cofiguration
const alertOptions = {
  // you can also just use 'bottom center'
  position: positions.TOP_CENTER,
  timeout: 5000,
  // you can also just use 'scale'
  transition: transitions.SCALE,
  containerStyle: {
    textAlign: 'center',
    lineHeight: '23px',
    padding: '15px 30px',
    borderRadius: '10px'
  }
}


function App() {
  
  return (
    <AlertProvider template={AlertTemplate} {...alertOptions}>
      <div className="wrapper">
        <Content /> 
      </div>
    </AlertProvider>
  );
}

export default App;
