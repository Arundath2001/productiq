import React, { useState } from "react";
import InputLine from "./InputLine";
import SolidButton from "./SolidButton";
import { useAuthStore } from "../store/useAuthStore.js";
import toast from "react-hot-toast";

const UserForm = ({ formTitile, role, closeForm, userData }) => {
  const { createUser } = useAuthStore();
  const isEditing = Boolean(userData?.username);

  const [formData, setFormData] = useState({
    username: userData?.username || "",
    password: "",
    position: userData?.position || "",
    companyCode: userData?.companyCode || "",
    location: userData?.location || "",
  });

  const [changePassword, setChangePassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.username) {
      toast.error("Username is required.");
      return;
    }
  
    if (!isEditing && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
  
    if (isEditing && changePassword && formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
  
    if (role === "employee" && !formData.position) {
      toast.error("Position is required for employees.");
      return;
    }
  
    if (role === "client" && (!formData.companyCode || !formData.location)) {
      toast.error("Company Code and Location are required for clients.");
      return;
    }
  
    const userDataToSend = {
      username: formData.username,
      role: role,
      ...(isEditing ? {} : { password: formData.password }),
      ...(isEditing && changePassword ? { password: formData.password } : {}),
      ...(role === "employee" && { position: formData.position }),
      ...(role === "client" && {
        companyCode: formData.companyCode,
        location: formData.location,
      }),
    };
  
    try {
      if (isEditing) {
        await useAuthStore.getState().editUser(userData._id, userDataToSend);
      } else {
        await createUser(userDataToSend);
      }
      toast.success(isEditing ? "User updated successfully!" : "User created successfully!");
      closeForm(false);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };
  

  return (
    <div className="bg-white px-5 py-4 rounded-xl w-96">
      <h1 className="text-center mb-4">{formTitile}</h1>

      <div className="h-0.5 bg-black mb-4"></div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <InputLine
          name="username"
          label="Username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
        />

        {!isEditing ? (
          <InputLine
            name="password"
            label="Password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
        ) : (
          <div className="flex flex-col">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={changePassword}
                onChange={() => setChangePassword(!changePassword)}
              />
              Change Password
            </label>
            {changePassword && (
              <InputLine
                name="password"
                label="New Password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleChange}
              />
            )}
          </div>
        )}

        {role === "employee" && (
          <InputLine
            name="position"
            label="Position"
            placeholder="Position"
            value={formData.position}
            onChange={handleChange}
          />
        )}

        {role === "client" && (
          <>
            <InputLine
              name="companyCode"
              label="Company Code"
              placeholder="Company Code"
              value={formData.companyCode}
              onChange={handleChange}
            />
            <InputLine
              name="location"
              label="Location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
            />
          </>
        )}

        <div className="flex gap-2.5 justify-center mt-7">
          <SolidButton
            buttonName="Cancel"
            variant="outlined"
            onClick={() => closeForm(false)}
          />
          <SolidButton buttonName="Save" type="submit" />
        </div>
      </form>
    </div>
  );
};

export default UserForm;
