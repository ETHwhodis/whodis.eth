import React from 'react';
import Select from 'react-select';

const options = [
  { value: 'low', label: 'Low ~ 6 hours' },
  { value: 'medium', label: 'Medium ~ 12 hours' },
  { value: 'high', label: 'High ~ 24 hours' },
];

export default function Step1(props){
    
    const { selectedLevel } = props;

    const handleChange = (selectedOption) => {
        props.onComplete(selectedOption);
    }
    
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

    
    return (
        <section>
            <h3>1 - CHOOSE YOUR ANONYMITY LEVEL</h3>
            <div className="select-wrapper">
                <Select
                    value={selectedLevel}
                    defaultValue={selectedLevel || options[1]}
                    onChange={handleChange}
                    options={options}
                    name="anonimity"
                    styles={customStyles}
                />
            </div>
        </section>
    );
}