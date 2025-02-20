import React from 'react'

const ConfirmAlert = ({alertInfo, handleClose, handleSubmit}) => {
  return (
    <div className='w-96 bg-white p-7 rounded-xl'>
        <h1 className='text-base text-center font-semibold mb-4 text-red-700'>Are You Sure?</h1>
        <div className='h-0.5 bg-black mb-1.5' />
        <p className='text-center mb-4 text-xs'>{alertInfo}</p>
        <div className='flex justify-center gap-7'>
            <div onClick={handleClose} className='w-20 text-white bg-red-500 px-3.5 py-2 rounded-xl text-center cursor-pointer'>No</div>
            <div onClick={handleSubmit} className='w-20 text-white bg-green-500 px-3.5 py-2 rounded-xl text-center cursor-pointer'>Yes</div>
        </div>
    </div>
  )
}

export default ConfirmAlert