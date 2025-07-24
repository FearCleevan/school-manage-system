//src/lib/firebase/storage.js
export async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  
  // Validate configuration
  if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'student-profile-photos');

  try {
      const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
              method: 'POST',
              body: formData,
          }
      );

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Upload failed');
      }

      return await response.json();
  } catch (error) {
      console.error('Upload error:', error);
      throw error;
  }
}