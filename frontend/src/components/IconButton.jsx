import React from 'react'

const IconButton = ({btnName, btnType = 'normal', icon: Icon, onClick}) => {
  return (
    <div onClick={onClick} className={`px-0.5 justify-center flex gap-0.5 items-center py-2 cursor-pointer text-center rounded-xl border text-xs ${btnType === 'normal' ?  'text-black' : 'text-red-500 border-red-500' }`} >
        <Icon />
        {btnName}
    </div>
  )
}

export default IconButton