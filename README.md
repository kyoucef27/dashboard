# NadiaLuxe Dashboard

A comprehensive admin dashboard for managing products and orders for NadiaLuxe.

## Features

- **Product Management**: Add, view, edit, and delete products
- **Order Management**: Track orders with status updates (pending, delivered, returned)
- **Authentication**: Secure login system
- **Image Upload**: Upload and manage product images with Cloudinary
- **Analytics**: View basic stats about products and orders

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Image Storage**: Cloudinary

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/dashboard.git
   cd dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file based on `.env.example` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

- `/src/app`: Next.js pages and layouts
- `/src/components`: React components
- `/src/lib`: Utility functions
- `/backend/models`: MongoDB models
- `/backend/routes`: API route helpers
- `/backend/utils`: Backend utilities

## API Routes

- `/api/products`: Product management endpoints
- `/api/order`: Order management endpoints
- `/api/auth`: Authentication endpoints

## Deployment

This project can be deployed on Vercel or any other platform that supports Next.js applications.

## License

[MIT](https://choosealicense.com/licenses/mit/)
