import React, { useState } from 'react'
import { CiBrightnessUp } from "react-icons/ci";
import Icon from '../assets/Icon.png'


const Navbar = () => {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e){
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className='w-[100vw] h-15 fixed top-0 left-0 bg-white border-b-2 border-gray-200'>
      <nav className='w-full flex justify-between items-center text-lg px-[4%] py-[0.5%]'>
        <div className='text-2xl font-bold flex items-center gap-2'>Face the Emoji <img src={Icon} /></div>
        {submitted ? <p>HI {name}</p>  : (
          <form onSubmit={handleSubmit} className='flex gap-2'>
            <span>HI</span>
            <input type="text" value={name} onChange={(e)=>setName(e.target.value)} className='border-b-2 border-black outline-none text-lg' placeholder='Enter Name' style={{ width: `${name.length > 12 ? name.length : 12}ch` }}
 />
            <button
            type="submit"
            className="bg-yellow-300 cursor-pointer px-3 py-1 text-xs rounded hover:bg-yellow-400"
          >
            Go
          </button>
          </form>
        )}
        
        <div className='rounded-full bg-gray-100 p-[0.4%] cursor-pointer'>
            <CiBrightnessUp size={32}  />
        </div>
        
      </nav>
    </div>
  )
}

export default Navbar
