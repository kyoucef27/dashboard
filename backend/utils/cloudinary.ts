import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Function to upload an image to Cloudinary
export async function uploadImage(imageFile: any, id?: string) {
  try {
    console.log("[DEBUG-CLOUDINARY] Starting upload with id:", id);
    
    // Convert the file to base64
    const base64Data = Buffer.from(await imageFile.arrayBuffer()).toString('base64');
    const dataURI = `data:${imageFile.type};base64,${base64Data}`;
    
    // Upload to Cloudinary, use id for public_id if provided
    const uploadOptions: any = {format: 'avif'};
    if (id) {
      uploadOptions.public_id = id;
      console.log("[DEBUG-CLOUDINARY] Using public_id:", id);
    } else {
      uploadOptions.folder = 'nadialuxe-products';
    }
    
    console.log("[DEBUG-CLOUDINARY] Upload options:", JSON.stringify(uploadOptions));
    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);
    console.log("[DEBUG-CLOUDINARY] Upload successful, result:", JSON.stringify({
      public_id: result.public_id,
      secure_url: result.secure_url
    }));
    
    return result.secure_url;
  } catch (error) {
    console.error('[DEBUG-CLOUDINARY] Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

// Function to upload multiple images to Cloudinary
export async function uploadImages(imageFiles: any[], specid?: string) {
  try {
    // If specid is provided, use it for the first image only
    if (specid && imageFiles.length > 0) {
      const firstImageUrl = await uploadImage(imageFiles[0], specid);
      if (imageFiles.length === 1) {
        return [firstImageUrl];
      }
      
      // Upload the rest without specid
      const otherUploadPromises = imageFiles.slice(1).map(file => uploadImage(file));
      const otherUrls = await Promise.all(otherUploadPromises);
      return [firstImageUrl, ...otherUrls];
    } else {
      // If no specid, upload all normally
      const uploadPromises = imageFiles.map(file => uploadImage(file));
      return await Promise.all(uploadPromises);
    }
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
}
