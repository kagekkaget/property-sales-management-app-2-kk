import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["owner", "manager", "staff"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
  "refunded",
]);
export const propertyTypeEnum = pgEnum("property_type", [
  "rumah",
  "apartemen",
  "ruko",
  "tanah",
  "villa",
  "gudang",
  "kantor",
]);
export const listingStatusEnum = pgEnum("listing_status", [
  "tersedia",
  "terjual",
  "disewa",
  "pending",
  "tidak_tersedia",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("staff"),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Properties (Inventory) table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: propertyTypeEnum("type").notNull(),
  address: text("address").notNull(),
  area: decimal("area", { precision: 10, scale: 2 }), // in m²
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  pricePerMeter: decimal("price_per_meter", { precision: 15, scale: 2 }),
  stock: integer("stock").notNull().default(1),
  minStock: integer("min_stock").notNull().default(1),
  status: listingStatusEnum("status").notNull().default("tersedia"),
  expiryDate: date("expiry_date"), // listing expiration date
  imageUrl: text("image_url"),
  features: text("features"), // JSON string of features
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address"),
  nik: varchar("nik", { length: 20 }), // National ID
  occupation: varchar("occupation", { length: 100 }),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  preferences: text("preferences"), // JSON string of preferences
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  commission: decimal("commission", { precision: 15, scale: 2 }),
  notes: text("notes"),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  completedDate: timestamp("completed_date"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activity Log table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stock Alerts table
export const stockAlerts = pgTable("stock_alerts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // "low_stock" | "expiring"
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  customers: many(customers),
  orders: many(orders),
  activityLogs: many(activityLogs),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  creator: one(users, {
    fields: [properties.createdBy],
    references: [users.id],
  }),
  orders: many(orders),
  alerts: many(stockAlerts),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  creator: one(users, {
    fields: [customers.createdBy],
    references: [users.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  property: one(properties, {
    fields: [orders.propertyId],
    references: [properties.id],
  }),
  assignedUser: one(users, {
    fields: [orders.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const stockAlertsRelations = relations(stockAlerts, ({ one }) => ({
  property: one(properties, {
    fields: [stockAlerts.propertyId],
    references: [properties.id],
  }),
}));
