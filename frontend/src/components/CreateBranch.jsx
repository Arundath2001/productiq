import React, { useState, useEffect } from "react";
import { Plus, X, Eye, EyeOff, Loader2, ChevronDown } from "lucide-react";
import { useBranch } from "../store/useBranchStore";

// Country data with flags and codes
const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
];

const SolidButton = ({
  buttonName,
  variant = "solid",
  onClick,
  disabled = false,
  isLoading = false,
}) => {
  const baseClasses =
    "px-6 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2";
  const variants = {
    solid:
      "bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
    outlined:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && <Loader2 size={15} className="animate-spin" />}
      {buttonName}
    </button>
  );
};

const InputLine = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  error = null,
  disabled = false,
}) => {
  return (
    <div className="w-full flex flex-col">
      <label className="text-gray-400 text-[12px]">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full focus:outline-none px-4 py-2 border-b ${
          error ? "border-red-500" : "border-gray-500"
        } focus:border-black focus:border-b-2 ${
          disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""
        }`}
      />
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
};

const CountryDropdown = ({
  label,
  value,
  onChange,
  error = null,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedCountry = countries.find((country) => country.code === value);

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (countryCode) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="w-full flex flex-col relative">
      <label className="text-gray-400 text-[12px]">{label}</label>
      <div className="relative">
        <div
          className={`w-full cursor-pointer flex items-center justify-between px-4 py-2 border-b ${
            error ? "border-red-500" : "border-gray-500"
          } focus-within:border-black focus-within:border-b-2 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            {selectedCountry ? (
              <>
                <span className="text-lg">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
                <span className="text-gray-500 text-sm">
                  ({selectedCountry.code})
                </span>
              </>
            ) : (
              <span className="text-gray-400">Select a country</span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-48">
              {filteredCountries.map((country) => (
                <div
                  key={country.code}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelect(country.code)}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-gray-500 text-sm">{country.code}</span>
                </div>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
};

const CreateBranch = ({
  setShowCreateBranch,
  editMode = false,
  editData = null,
  onEditComplete = null,
}) => {
  const [branchName, setBranchName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [administrators, setAdministrators] = useState([]);
  const [errors, setErrors] = useState({});

  const {
    isLoading,
    error: storeError,
    createBranchWithAdmins,
    clearError,
    resetStates,
  } = useBranch();

  const roles = [
    "ship_cargo_admin",
    "air_cargo_admin",
    "bl",
    "Invoice",
    "approve",
  ];

  const parseAdminRoles = (adminRoles) => {
    if (!adminRoles) return [];

    if (Array.isArray(adminRoles)) {
      return adminRoles;
    }

    if (typeof adminRoles === "string") {
      return adminRoles
        .split(",")
        .map((role) => role.trim())
        .filter((role) => role);
    }

    if (typeof adminRoles === "object") {
      if (adminRoles.roles && Array.isArray(adminRoles.roles)) {
        return adminRoles.roles;
      }
      if (adminRoles.roleList && Array.isArray(adminRoles.roleList)) {
        return adminRoles.roleList;
      }
    }

    console.warn("Unable to parse adminRoles:", adminRoles);
    return [];
  };

  useEffect(() => {
    if (editMode && editData) {
      setBranchName(editData.branchName || "");
      setCountryCode(editData.countryCode || "");

      if (editData.admin) {
        const adminRoles = parseAdminRoles(editData.admin.adminRoles);

        const adminData = {
          id: editData.admin._id || Date.now(),
          roles: adminRoles,
          name: editData.admin.username || "",
          password: "",
          showPassword: false,
          showRoleDropdown: false,
        };
        setAdministrators([adminData]);
      }
    }
  }, [editMode, editData]);

  const handleAddAdmin = () => {
    const newAdmin = {
      id: Date.now(),
      roles: [],
      name: "",
      password: "",
      showPassword: false,
      showRoleDropdown: false,
    };
    setAdministrators([...administrators, newAdmin]);
  };

  const handleRemoveAdmin = (id) => {
    setAdministrators(administrators.filter((admin) => admin.id !== id));
    const newErrors = { ...errors };
    delete newErrors[`admin_${id}_name`];
    delete newErrors[`admin_${id}_password`];
    delete newErrors[`admin_${id}_roles`];
    setErrors(newErrors);
  };

  const togglePasswordVisibility = (adminId) => {
    setAdministrators(
      administrators.map((admin) =>
        admin.id === adminId
          ? { ...admin, showPassword: !admin.showPassword }
          : admin
      )
    );
  };

  const handleRoleChange = (adminId, role) => {
    setAdministrators(
      administrators.map((admin) => {
        if (admin.id === adminId) {
          const updatedRoles = admin.roles.includes(role)
            ? admin.roles.filter((r) => r !== role)
            : [...admin.roles, role];
          return { ...admin, roles: updatedRoles };
        }
        return admin;
      })
    );

    if (errors[`admin_${adminId}_roles`]) {
      setErrors((prev) => ({
        ...prev,
        [`admin_${adminId}_roles`]: null,
      }));
    }
  };

  const removeRole = (adminId, roleToRemove) => {
    setAdministrators(
      administrators.map((admin) => {
        if (admin.id === adminId) {
          const updatedRoles = admin.roles.filter(
            (role) => role !== roleToRemove
          );
          return { ...admin, roles: updatedRoles };
        }
        return admin;
      })
    );
  };

  const updateAdminField = (adminId, field, value) => {
    setAdministrators(
      administrators.map((admin) =>
        admin.id === adminId ? { ...admin, [field]: value } : admin
      )
    );

    if (errors[`admin_${adminId}_${field}`]) {
      setErrors((prev) => ({
        ...prev,
        [`admin_${adminId}_${field}`]: null,
      }));
    }
  };

  const toggleRoleDropdown = (adminId) => {
    setAdministrators(
      administrators.map((admin) =>
        admin.id === adminId
          ? { ...admin, showRoleDropdown: !admin.showRoleDropdown }
          : admin
      )
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!branchName.trim()) {
      newErrors.branchName = "Branch name is required";
    }

    if (!countryCode) {
      newErrors.countryCode = "Country selection is required";
    }

    if (administrators.length === 0) {
      newErrors.administrators = "At least one administrator is required";
    }

    administrators.forEach((admin) => {
      if (!admin.name.trim()) {
        newErrors[`admin_${admin.id}_name`] = "Admin name is required";
      }

      if (!editMode && !admin.password.trim()) {
        newErrors[`admin_${admin.id}_password`] = "Password is required";
      } else if (admin.password.trim() && admin.password.length < 8) {
        newErrors[`admin_${admin.id}_password`] =
          "Password must be at least 8 characters";
      }

      if (admin.roles.length === 0) {
        newErrors[`admin_${admin.id}_roles`] = "At least one role is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    clearError();

    try {
      if (editMode) {
        if (onEditComplete) {
          const formattedAdmins = administrators.map((admin) => ({
            id: admin.id,
            username: admin.name,
            password: admin.password || undefined,
            adminRoles: admin.roles.join(","),
          }));

          await onEditComplete({
            branchName: branchName.trim(),
            countryCode: countryCode,
            admin: formattedAdmins[0],
          });
        }
      } else {
        const formattedAdmins = administrators.map((admin) => ({
          username: admin.name,
          password: admin.password,
          adminRoles: admin.roles.join(","),
        }));

        await createBranchWithAdmins({
          branchName: branchName.trim(),
          countryCode: countryCode,
          admins: formattedAdmins,
        });
      }

      setBranchName("");
      setCountryCode("");
      setAdministrators([]);
      setErrors({});
      resetStates();

      setTimeout(() => {
        setShowCreateBranch(false);
      }, 1000);
    } catch (error) {
      console.error(
        `Error ${editMode ? "editing" : "creating"} branch:`,
        error
      );
    }
  };

  const handleCancel = () => {
    setBranchName("");
    setCountryCode("");
    setAdministrators([]);
    setErrors({});
    clearError();
    resetStates();
    setShowCreateBranch(false);
  };

  return (
    <div className="flex flex-col p-6 bg-white rounded-lg shadow-lg max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg text-center flex-1">
          {editMode ? "Edit Administrator" : "Create New Branch"}
        </h3>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X size={20} />
        </button>
      </div>

      <div className="border-b mb-6"></div>

      {storeError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {storeError}
        </div>
      )}

      <div className="mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col mb-4">
            <InputLine
              label="Branch Name"
              placeholder="Branch Name"
              value={branchName}
              onChange={(e) => {
                setBranchName(e.target.value);
                if (errors.branchName) {
                  setErrors((prev) => ({ ...prev, branchName: null }));
                }
              }}
              error={errors.branchName}
              disabled={editMode}
            />
          </div>
          <div className="flex flex-col mb-4">
            <CountryDropdown
              label="Country"
              value={countryCode}
              onChange={(code) => {
                setCountryCode(code);
                if (errors.countryCode) {
                  setErrors((prev) => ({ ...prev, countryCode: null }));
                }
              }}
              error={errors.countryCode}
              disabled={editMode}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">
            {editMode ? "Administrator Details" : "Branch Administrators"}
          </h4>
          {errors.administrators && (
            <span className="text-red-500 text-sm">
              {errors.administrators}
            </span>
          )}
        </div>

        {administrators.map((admin) => (
          <div key={admin.id} className="rounded-lg p-4 mb-4 bg-gray-50">
            {!editMode && (
              <div className="flex items-center justify-end">
                <button
                  onClick={() => handleRemoveAdmin(admin.id)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="relative">
                <label className="text-gray-400 text-[12px] block mb-1">
                  Role
                </label>
                <div className="relative">
                  <div
                    className={`w-full cursor-pointer flex items-center justify-between min-h-[40px] px-4 py-2 border-b ${
                      errors[`admin_${admin.id}_roles`]
                        ? "border-red-500"
                        : "border-gray-500"
                    } focus-within:border-black focus-within:border-b-2`}
                    onClick={() => !isLoading && toggleRoleDropdown(admin.id)}
                  >
                    <div className="flex gap-1 flex-1 items-center flex-wrap">
                      {admin.roles.length > 0 ? (
                        admin.roles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs whitespace-nowrap mb-1"
                          >
                            {role}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isLoading) removeRole(admin.id, role);
                              }}
                              className="ml-1 hover:text-blue-800"
                              disabled={isLoading}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Select roles
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ml-2 flex-shrink-0 ${
                        admin.showRoleDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {admin.showRoleDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="p-2">
                        {roles.map((role) => (
                          <label
                            key={role}
                            className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded"
                          >
                            <input
                              type="checkbox"
                              checked={admin.roles.includes(role)}
                              onChange={() => handleRoleChange(admin.id, role)}
                              className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              disabled={isLoading}
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors[`admin_${admin.id}_roles`] && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors[`admin_${admin.id}_roles`]}
                  </span>
                )}
              </div>

              <div>
                <InputLine
                  label="Admin Name"
                  placeholder="Enter Admin Name"
                  value={admin.name}
                  onChange={(e) =>
                    updateAdminField(admin.id, "name", e.target.value)
                  }
                  error={errors[`admin_${admin.id}_name`]}
                />
              </div>

              <div>
                <div className="w-full flex flex-col">
                  <label className="text-gray-400 text-[12px]">
                    Password {editMode && "(Leave empty to keep current)"}
                  </label>
                  <div className="relative">
                    <input
                      type={admin.showPassword ? "text" : "password"}
                      placeholder={
                        editMode
                          ? "Enter new password (optional)"
                          : "Enter Password"
                      }
                      value={admin.password}
                      onChange={(e) =>
                        updateAdminField(admin.id, "password", e.target.value)
                      }
                      className={`w-full focus:outline-none px-4 py-2 pr-12 border-b ${
                        errors[`admin_${admin.id}_password`]
                          ? "border-red-500"
                          : "border-gray-500"
                      } focus:border-black focus:border-b-2`}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(admin.id)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {admin.showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {errors[`admin_${admin.id}_password`] && (
                    <span className="text-red-500 text-xs mt-1">
                      {errors[`admin_${admin.id}_password`]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {!editMode && (
          <button
            onClick={handleAddAdmin}
            className="border border-dashed border-gray-300 flex items-center justify-center p-4 rounded transition hover:bg-gray-50 cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <Plus size={20} className="mr-2" />
            <span>Add New Administrator</span>
          </button>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <SolidButton
          buttonName="Cancel"
          variant="outlined"
          onClick={handleCancel}
          disabled={isLoading}
        />
        <SolidButton
          buttonName={
            isLoading
              ? editMode
                ? "Updating..."
                : "Creating..."
              : editMode
              ? "UPDATE"
              : "SAVE"
          }
          onClick={handleSave}
          disabled={isLoading}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default CreateBranch;
