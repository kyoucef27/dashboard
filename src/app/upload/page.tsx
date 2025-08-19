'use client';

import { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
export default function UploadProductPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadedProduct, setUploadedProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Handle image preview
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPreviewImages([]);
    const files = e.target.files;
    
    if (files) {
      const newPreviews: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          newPreviews.push(URL.createObjectURL(file));
        }
      }
      
      setPreviewImages(newPreviews);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setUploadedProduct(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload product');
      }
      
      setSuccess('Product uploaded successfully!');
      setUploadedProduct(data.product);
      formRef.current?.reset();
      setPreviewImages([]);
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while uploading the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar></Navbar>
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Upload New Product</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-4 rounded">
          {success}
        </div>
      )}
      
      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (DZD) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              required
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            id="gender"
            name="gender"
            required
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select a category</option>
            <option value="Man">Man</option>
            <option value="Woman">Woman</option>
            <option value="Kid">Kid</option>
            <option value="Parfume">Parfume</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-1">
            Short Description *
          </label>
          <input
            type="text"
            id="desc"
            name="desc"
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label htmlFor="fullDesc" className="block text-sm font-medium text-gray-700 mb-1">
            Full Description *
          </label>
          <textarea
            id="fullDesc"
            name="fullDesc"
            required
            rows={4}
            className="w-full p-2 border border-gray-300 rounded"
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="pictures" className="block text-sm font-medium text-gray-700 mb-1">
            Product Images *
          </label>
          <input
            type="file"
            id="pictures"
            name="pictures"
            accept="image/*"
            multiple
            required
            onChange={handleImageChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        {previewImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {previewImages.map((preview, index) => (
              <div 
                key={index} 
                className="relative h-32 w-full cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedImage(preview);
                }}
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full p-3 text-white rounded ${
            isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
      
      {uploadedProduct && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Uploaded Product</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold">{uploadedProduct.name}</h3>
            <p className="text-lg text-blue-600 font-medium mt-1">
              {uploadedProduct.price} DZD
            </p>
            <p className="text-gray-600 mt-2">{uploadedProduct.desc}</p>
            <p className="text-sm text-gray-500 mt-2">Category: {uploadedProduct.gender}</p>
            
            <div className="mt-4">
              <h4 className="font-medium">Full Description:</h4>
              <p className="text-gray-700 mt-1">{uploadedProduct.fullDesc}</p>
            </div>
            
            {uploadedProduct.pictures && uploadedProduct.pictures.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Product Images:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedProduct.pictures.map((url: string, index: number) => (
                    <div 
                      key={index} 
                      className="relative h-40 w-full cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedImage(url);
                      }}
                    >
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-40 object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(null);
          }}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-white rounded-full w-10 h-10 flex items-center justify-center text-black font-bold z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              X
            </button>
            <div className="relative w-full h-[80vh]">
              <img
                src={selectedImage}
                alt="Enlarged preview"
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
