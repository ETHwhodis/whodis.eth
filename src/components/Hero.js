import React  from 'react';

export default function Hero(props){

    return (
        <div className="image-holder">
            <h1 className="title">WHO DIS?</h1>
            <h2 className="subtitle">PRIVACY ON ETHEREUM</h2>
            { props.children }  
        </div>
    );
}