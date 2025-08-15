import React, { useState, useContext, useEffect } from 'react'
import { CiBrightnessUp } from "react-icons/ci";
import Icon from '../assets/Icon.png'
import { DarkModeContext } from '../context/DarkModeContext.jsx';


const Navbar = () => {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const {darkMode, setDarkMode} = useContext(DarkModeContext);

  useEffect(()=>{
    console.log(darkMode);
  }, [darkMode]);

  function handleSubmit(e){
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className={`w-[100vw] h-15 fixed top-0 left-0 ${darkMode? 'bg-purple-500 border-b-2 border-gray-800 text-white' : 'bg-white border-b-2 border-gray-200 text-black'} `}>
      <nav className='w-full flex justify-between items-center text-sm md:text-lg px-[4%] py-[0.5%]'>
        <div className='text-xs md:text-2xl font-bold flex items-center md:gap-2'> <p className='hidden md:block'>Face the Emoji </p> <img  src={Icon} /></div>
        {submitted ? <p>HI {name}</p>  : (
          <form onSubmit={handleSubmit} className='flex items-center gap-2'>
            <span>Hi</span>
            <input type="text" value={name} onChange={(e)=>setName(e.target.value)} className={`border-b-2  outline-none text-sm md:text-lg ${darkMode? 'border-white' : 'border-black'}`} placeholder='Enter Name' style={{ width: `${name.length > 12 ? name.length : 12}ch` }}
 />
            <button
            type="submit"
            className={` cursor-pointer px-3 py-1 text-xs rounded ${darkMode? 'bg-gray-800 hover:font-bold' : 'bg-yellow-300 hover:bg-yellow-400 '} `}
          >
            Go
          </button>
          </form>
        )}
        
          <button className={`cursor-pointer rounded-full p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} onClick={() => setDarkMode(!darkMode)}> <CiBrightnessUp size={32}  /> </button> 
        
      </nav>
    </div>
  )
}

export default Navbar
