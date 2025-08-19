import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../backend/routes/mongodb";
import { Product } from "../../../../../backend/models/Product";
import cloudinary from "../../../../../backend/utils/cloudinary";

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    await connectDB();

    const { id } = params as { id: string };
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    await connectDB();

    const { id } = params as { id: string };
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Extract Cloudinary IDs
    const imageUrls = product.pictures || [];
    const publicIds = imageUrls.map((url: string) => {
      if (product.specid && url.includes(product.specid)) {
        return product.specid;
      }
      const parts = url.split("/");
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split(".")[0];
      const folderIndex = parts.indexOf("upload") + 2;
      return parts.slice(folderIndex).join("/");
    });

    // Delete from Cloudinary
    await Promise.all(
      publicIds.map(async (publicId: string) => {
        try {
          return await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete ${publicId}:`, err);
          return Promise.resolve();
        }
      })
    );

    // Delete product itself
    await Product.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: "Product and images deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
