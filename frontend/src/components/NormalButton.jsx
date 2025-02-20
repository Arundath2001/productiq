import React from 'react'

const NormalButton = ({buttonName, icon : Icon, onClick}) => {
  return (
    <div onClick={onClick} className='flex items-center gap-1 px-3 py-2.5 bg-black text-white rounded-xl text-xs cursor-pointer'>
        {Icon && <Icon /> }
        {buttonName && buttonName}
    </div>
  )
}

export default NormalButton