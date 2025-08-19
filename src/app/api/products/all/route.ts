import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
const Product = require('../../../../../backend/models/Product').Product;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop';
const API_KEY = process.env.MY_SECRET_KEY; 
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

export async function GET(req: Request) {
  // Check API key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== API_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Optional: CORS check
  const origin = req.headers.get('origin');
  if (origin !== 'http://localhost:8888' ) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const products = await Product.find({});
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
