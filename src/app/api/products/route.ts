import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../backend/routes/mongodb';
import { Product } from '../../../../backend/models/Product';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Fetch all products
    const products = await Product.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json(
      { 
        success: true, 
        products 
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const price = Number(formData.get('price'));
    const desc = formData.get('desc') as string;
    const fullDesc = formData.get('fullDesc') as string;
    const gender = formData.get('gender') as string;
    const files = formData.getAll('pictures') as File[];
    
    if (!price || !desc || !fullDesc || !gender || !files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    
    if (!['Man', 'Woman', 'Kid', 'Parfume'].includes(gender)) {
      return NextResponse.json({ success: false, message: 'Invalid gender category' }, { status: 400 });
    }
    
    // Generate ID first and separate from other operations
    const timestamp = Date.now();
    
    
    // Upload image using specid
    const { uploadImage } = require('../../../../backend/utils/cloudinary');
    const imageUrl = await uploadImage(files[0], `prod_${timestamp}`);
    console.log("[DEBUG] Image uploaded, URL:", imageUrl);
    
    // Create product data object
    const productData = {
      specid: `prod_${timestamp}`,
      name,
      price,
      desc,
      fullDesc,
      gender,
      pictures: [imageUrl],
      views: 0,
      stars: 0,
      sold: 0
    };
    
    // Create and save the product
    const product = new Product(productData);
    await product.save();
    
    console.log("[DEBUG] Product saved with specid:", product.specid);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Product created', 
      product 
    }, { status: 201 });
  } catch (error: any) {
    console.error("[DEBUG] Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to create product' 
    }, { status: 500 });
  }
}
