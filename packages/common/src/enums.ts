export enum UserRole {
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant',
  OPERATOR = 'operator',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  PENDING = 'pending',
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  DISPATCHED = 'dispatched',
  IN_FLIGHT = 'in_flight',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  PAYME = 'payme',
  CLICK = 'click',
  UZCARD = 'uzcard',
  HUMO = 'humo',
  CASH = 'cash',
}

export enum DroneStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  CHARGING = 'charging',
}

export enum RestaurantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_APPROVAL = 'pending_approval',
  SUSPENDED = 'suspended',
}

export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_ACCEPTED = 'order_accepted',
  ORDER_PREPARING = 'order_preparing',
  ORDER_DISPATCHED = 'order_dispatched',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  DRONE_ASSIGNED = 'drone_assigned',
  PROMO = 'promo',
}

export enum DeliveryEventType {
  DRONE_LOCATION = 'drone:location',
  ORDER_STATUS = 'order:status',
  DRONE_STATUS = 'drone:status',
  BATTERY_UPDATE = 'drone:battery',
}
