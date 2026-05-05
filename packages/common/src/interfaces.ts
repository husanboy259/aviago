import { UserRole, UserStatus, OrderStatus, PaymentStatus, PaymentMethod, DroneStatus, RestaurantStatus } from './enums';

export interface IUser {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface IRestaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  rating: number;
  totalOrders: number;
  isOpen: boolean;
  status: RestaurantStatus;
  categories: string[];
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  createdAt: Date;
}

export interface IMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  preparationMinutes: number;
}

export interface IOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrder {
  id: string;
  customerId: string;
  restaurantId: string;
  droneId?: string;
  items: IOrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: IAddress;
  estimatedDeliveryAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDrone {
  id: string;
  serialNumber: string;
  model: string;
  operatorId?: string;
  status: DroneStatus;
  batteryPercent: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  maxPayloadGrams: number;
  maxRangeKm: number;
  currentOrderId?: string;
  lastSeenAt?: Date;
  createdAt: Date;
}

export interface IGpsLocation {
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  batteryPercent: number;
  timestamp: Date;
}

export interface IPaymentTransaction {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  externalId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IJwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
