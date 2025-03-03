const Modal = ({ children, onClose }) => {
    return (
      <div className=" min-h-screenp inset-0 bg-black bg-opacity-50 ">
        <div className="bg-white p-6 rounded shadow-lg relative">
          <button onClick={onClose} className="absolute top-2 right-2 text-gray-700">&times;</button>
          {children}
        </div>
      </div>
    );
  };
  
  export default Modal;
  