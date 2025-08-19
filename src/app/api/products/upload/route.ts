import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../backend/routes/mongodb';
import { Product } from '../../../../../backend/models/Product';
import { uploadImages } from '../../../../../backend/utils/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Process the form data
    const formData = await request.formData();
    
    // Extract text fields
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const desc = formData.get('desc') as string;
    const fullDesc = formData.get('fullDesc') as string;
    const gender = formData.get('gender') as string;
    
    // Validate required fields
    if (!name || !price || !desc || !fullDesc || !gender) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if gender is valid
    if (!['Man', 'Woman', 'Kid', 'Parfume'].includes(gender)) {
      return NextResponse.json(
        { success: false, message: 'Invalid gender category' },
        { status: 400 }
      );
    }
    
    // Extract image files
    const files = formData.getAll('pictures') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one image is required' },
        { status: 400 }
      );
    }
    
    // Generate specid first
    const timestamp = Date.now();
    const specid = `prod_${timestamp}`;
    
    // Upload images to Cloudinary with specid for the first image
    const firstImageUrl = await uploadImages(files.slice(0, 1), specid);
    const otherImageUrls = files.length > 1 ? await uploadImages(files.slice(1)) : [];
    const pictureUrls = [...firstImageUrl, ...otherImageUrls];
    
    // Create and save the product in the database
    const product = await Product.create({
      specid,
      name,
      price,
      desc,
      fullDesc,
      gender,
      pictures: pictureUrls,
      views: 0,
      stars: 0,
      sold: 0
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Product created successfully', 
        product 
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
