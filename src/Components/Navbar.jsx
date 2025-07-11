import React from 'react'
import { CiBrightnessUp } from "react-icons/ci";
import Icon from '../assets/Icon.png'


const Navbar = () => {
  return (
    <div className='w-[100vw] h-20 fixed top-0 left-0 bg-white border-b-2 border-gray-200'>
      <nav className='w-full flex justify-between items-center text-lg px-[4%] py-[1.5%]'>
        <div className='text-3xl font-bold flex items-center gap-2'>Face the Emoji <img src={Icon} /></div>
        <p>HI SNEHA</p>
        <div className='rounded-full bg-gray-100 p-[0.5%] cursor-pointer'>
            <CiBrightnessUp size={32}  />
        </div>
        
      </nav>
    </div>
  )
}

export default Navbar
