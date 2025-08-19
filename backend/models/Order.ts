import mongoose, { Schema, models } from "mongoose";

// Define the Order item interface
interface OrderItem {
  productId: string;
  quantity: number;
}

// Define the Customer interface
interface Customer {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  phone?: string;
}

// Define the Order interface
export interface IOrder extends mongoose.Document {
  items: OrderItem[];
  total: number;
  customer: Customer;
  timestamp: string;
  status: 'pending' | 'delivered' | 'returned';
  deliveryDate?: string;
  returnDate?: string;
  statusHistory?: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
}

// Define the schema for Order items
const orderItemSchema = new Schema<OrderItem>({
  productId: {
    type: String,
    required: [true, "Product ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
});

// Define the schema for Customer
const customerSchema = new Schema<Customer>({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  phone:{
    type: String, 
  }
});

// Define the main Order schema
const orderSchema = new Schema<IOrder>({
  items: {
    type: [orderItemSchema],
    required: [true, "Order items are required"],
    validate: {
      validator: function(items: OrderItem[]) {
        return items.length > 0;
      },
      message: "At least one item is required",
    },
  },
  total: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [0, "Total amount cannot be negative"],
  },
  customer: {
    type: customerSchema,
    required: [true, "Customer information is required"],
  },
  timestamp: {
    type: String,
    required: [true, "Timestamp is required"],
    default: () => new Date().toISOString(),
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'returned'],
    default: 'pending',
    required: true,
  },
  deliveryDate: {
    type: String,
    default: null,
  },
  returnDate: {
    type: String,
    default: null,
  },
  statusHistory: {
    type: [{
      status: String,
      timestamp: String,
      note: String
    }],
    default: function() {
      return [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Order created'
      }];
    }
  }
}, { timestamps: true });

// Create and export the Order model
export const Order = models.Order || mongoose.model<IOrder>("Order", orderSchema);
