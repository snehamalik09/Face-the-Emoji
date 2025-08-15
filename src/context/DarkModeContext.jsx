import {createContext, useState} from 'react';

const DarkModeContext = createContext();

function DarkModeThemeProvider(props){
    const [darkMode, setDarkMode] = useState(false);

    return (
        <DarkModeContext.Provider value={{darkMode, setDarkMode}}>
            {props.children}
        </DarkModeContext.Provider>
    )
}

export {DarkModeContext, DarkModeThemeProvider};