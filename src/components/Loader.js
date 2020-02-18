import React from 'react';
import ClipLoader from "react-spinners/ClipLoader";

const Loader = () => (
    <div className={'loading-wrapper'}>
        <ClipLoader
            size={50}
            color={"#3FC7FA"}
        />
    </div>
);

export default Loader;