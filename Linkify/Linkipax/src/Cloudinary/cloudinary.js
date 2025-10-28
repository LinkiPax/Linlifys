import axios from "axios";

const cloudinaryAxios = axios.create({
  baseURL: "https://api.cloudinary.com/v1_1/dh9lbowq2",
  withCredentials: false, // 🚫 must be false
  headers: { "Content-Type": "multipart/form-data" },
});

export const uploadToCloudinary = async (file) => {
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await cloudinaryAxios.post("/upload", formData);
  return response.data;
};
