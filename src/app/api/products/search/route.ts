import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../backend/routes/mongodb';
import { Product } from '../../../../../backend/models/Product';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get search query parameters
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    
    if (!q) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      );
    }
    
    // Search for products with a name or description containing the query
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { desc: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    return NextResponse.json(
      {
        success: true,
        count: products.length,
        products
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to search products' },
      { status: 500 }
    );
  }
}
