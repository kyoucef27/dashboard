import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../backend/routes/mongodb';
import { Product } from '../../../../../backend/models/Product';
import cloudinary from '../../../../../backend/utils/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const productId = params.id;
    
    // Find the product 
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        product
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const productId = params.id;
    
    // Find the product to get its images
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Extract the public IDs from the image URLs
    const imageUrls = product.pictures || [];
    const publicIds = imageUrls.map((url: string) => {
      // Check if this might be a specid-based URL
      if (product.specid && url.includes(product.specid)) {
        return product.specid;
      }
      
      // Otherwise, extract the public ID from a URL like:
      // https://res.cloudinary.com/cloud-name/image/upload/v1234567890/nadialuxe-products/image-id
      const parts = url.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split('.')[0];
      // Get the folder + filename (e.g., "nadialuxe-products/image-id")
      const folderIndex = parts.indexOf('upload') + 2;
      return parts.slice(folderIndex).join('/');
    });
    
    // Delete images from Cloudinary
    const deletePromises = publicIds.map((publicId: string) => {
      try {
        return cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error(`Failed to delete image with ID ${publicId}:`, error);
        // Continue even if one image fails to delete
        return Promise.resolve();
      }
    });
    
    // Wait for all image deletions to complete
    await Promise.all(deletePromises);
    
    // Delete the product from MongoDB
    await Product.findByIdAndDelete(productId);
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Product and associated images deleted successfully'
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
