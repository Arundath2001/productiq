import React, { useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore.js';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {

    const {login, isLoggingIng} = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const validateLogin = () => {
        if(!formData.username.trim()) return toast.error("Username is required");
        if(!formData.password.trim()) return toast.error("Password is required");

        return true;
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        const success = validateLogin();

        if(success === true){
            login(formData);
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    }

  return (
    <div className='flex flex-col md:flex-row min-h-screen'>

        <div className='w-full md:w-4/6 flex flex-col justify-center px-8 md:px-16 py-12 md:py-0 items-center bg-black relative overflow-hidden'>
            <div className='relative'>
                <p className='text-white text-3xl md:text-4xl font-semibold'>Get started with</p>
                <p className='text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#6FB5FF] via-[#FFC79C] to-[#C39EF2] text-transparent bg-clip-text'>
                    Aswaq Forwader
                </p>
                <p className='text-white text-base md:text-lg '>Simplify shipping, organize efficiently, and <br /> stay connected</p>
            </div>

            <div className='absolute md:left-[-100px] md:bottom-[-180px] w-[400px] h-[400px] border border-gray-500 rounded-full'></div>
            <div className='absolute md:left-[-50px] md:bottom-[-200px] w-[400px] h-[400px] border border-gray-500 rounded-full'></div>
        </div>

        <div className='w-full md:w-2/6 flex flex-col justify-center items-center bg-white px-6 md:px-18 py-12'>
            <div className='w-full max-w-md'>
                <h2 className='text-gray-800 text-xl md:text-2xl font-bold mb-2'>Hello!</h2>
                <p className='text-gray-800 mb-6'>Sign in to Get Started</p>

                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <label className='text-gray-800 block'>Admin ID</label>
                        <input 
                            type='text' 
                            placeholder='Admin ID'
                            className='w-full px-4 py-2 border-b-2 border-gray-300 focus:outline-none focus:border-gray-950'    
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />
                    </div>

                    <div className='mb-4'>
                        <label className='text-gray-800 block'>Password</label>
                        <div className='relative'>
                            <input 
                                type={showPassword ? 'text' : 'password'}
                                placeholder='Password'
                                className='w-full px-4 py-2 border-b-2 border-gray-300 focus:outline-none focus:border-gray-950'
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                            <button 
                                type='button'
                                className='absolute right-2 top-2 text-gray-500 hover:text-gray-800 transition'
                                onClick={togglePasswordVisibility}
                            >
                                {showPassword ? (
                                    <Eye size={20} />
                                ) : (
                                    <EyeOff size={20} />
                                )}
                            </button>
                        </div>
                        
                    </div>

                    <button 
                        className='w-full flex justify-center bg-black px-4 py-3 text-white mt-4 hover:bg-gray-800 transition cursor-pointer' 
                        type='submit'
                        disabled={isLoggingIng}
                    >
                        {isLoggingIng ? (
                            <Loader2 className='h-5 w-5 animate-spin' />
                        ):(
                            "LOGIN"
                        )}
                    </button>
                </form>
            </div>
        </div>

    </div>
  )
}

export default LoginPage