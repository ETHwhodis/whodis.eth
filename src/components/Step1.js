import React, { useState } from 'react';
import Select from 'react-select';
import Button from './Button';

const options = [
  { value: 'low', label: 'Low ~ 6 hours' },
  { value: 'medium', label: 'Medium ~ 12 hours' },
  { value: 'high', label: 'High ~ 24 hours' },
];

export default function Step1(props){
    
    const [anonimity, setAnonimity] = useState(options[1]);

    const handleChange = (selectedOption) => setAnonimity(selectedOption);
    
    const customStyles = {
        option: (provided, state) => ({
            ...provided,
            backgroundColor: 'transparent',
            border: '1px solid white',
            borderRadius: 5,
            color: state.isFocused ? 'black' : 'black',
            padding: 20,
        }),
        
        singleValue: (provided, state) => {
            const opacity = state.isDisabled ? 0.5 : 1;
            const transition = 'opacity 300ms';
        
            return { ...provided, opacity, transition, backgroundColor: 'transparent', padding: 0 };
        }
    }

    const next = () => {
        props.onComplete(anonimity.value);
    }
    
    return (
        <section>
            <h3>CHOOSE YOUR ANONYMITY LEVEL</h3>
            <Select
                value={anonimity}
                defaultValue={anonimity}
                onChange={handleChange}
                options={options}
                name="anonimity"
                styles={customStyles}
            />

            <div className={'section-footer'}>
                <Button onClick={next}>NEXT</Button>
            </div>
        </section>
    );
}