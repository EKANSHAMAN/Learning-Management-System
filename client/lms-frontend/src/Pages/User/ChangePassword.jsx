import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import HomeLayout from "../../Layouts/HomeLayout";

function ChangePassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: ""
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { oldPassword, newPassword } = formData;

    if (!oldPassword || !newPassword) {
      toast.error("All fields are required");
      return;
    }

    try {
      const response = await axios.post(
        "/api/v1/user/change-password",
        { oldPassword, newPassword },
        { withCredentials: true }
      );
      toast.success(response?.data?.message || "Password changed successfully");
      navigate("/user/profile");
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "Failed to change password");
    }
  }

  return (
    <HomeLayout>
      <div className="flex items-center justify-center h-[90vh]">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-6 rounded-lg w-96 text-white shadow-[0_0_10px_black]"
        >
          <h1 className="text-center text-2xl font-semibold">Change Password</h1>

          <input
            type="password"
            name="oldPassword"
            placeholder="Enter old password"
            className="bg-transparent px-3 py-2 border"
            value={formData.oldPassword}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="newPassword"
            placeholder="Enter new password"
            className="bg-transparent px-3 py-2 border"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="bg-yellow-600 hover:bg-yellow-500 rounded-sm py-2 text-lg transition-all"
          >
            Change Password
          </button>
        </form>
      </div>
    </HomeLayout>
  );
}

export default ChangePassword;
