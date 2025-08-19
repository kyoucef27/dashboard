import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../backend/routes/mongodb";
import { Product } from "../../../../../../backend/models/Product";

export async function GET(
  request: NextRequest,
  { params }: { params: any }  
) {
  try {
    await connectDB();

    const { category } = params as { category: string };

    if (!["Man", "Woman", "Kid", "Parfume"].includes(category)) {
      return NextResponse.json(
        { success: false, message: "Invalid category" },
        { status: 400 }
      );
    }

    const products = await Product.find({ gender: category }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      { success: true, count: products.length, products },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching products by category:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
