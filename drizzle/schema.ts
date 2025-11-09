import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, varchar, text, datetime, decimal, int, tinyint, timestamp, mysqlEnum, unique, index, uniqueIndex } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const auditLogs = mysqlTable("auditLogs", {
	id: varchar({ length: 64 }).notNull(),
	userId: varchar({ length: 64 }),
	action: varchar({ length: 100 }).notNull(),
	entityType: varchar({ length: 50 }),
	entityId: varchar({ length: 64 }),
	details: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const cartItems = mysqlTable("cartItems", {
	id: varchar({ length: 64 }).notNull(),
	userId: varchar({ length: 64 }).notNull(),
	productId: varchar({ length: 64 }).notNull(),
	quantity: int().notNull(),
	pricePerUnit: decimal({ precision: 10, scale: 2 }).notNull(),
	customText: varchar({ length: 8 }),
	customSelect: varchar({ length: 100 }),
	addedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const minimumQuantities = mysqlTable("minimumQuantities", {
	id: varchar({ length: 64 }).notNull(),
	productId: varchar({ length: 64 }).notNull(),
	role: mysqlEnum(['user','distributor','reseller','admin']).notNull(),
	minQty: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const orderItems = mysqlTable("orderItems", {
	id: varchar({ length: 64 }).notNull(),
	orderId: varchar({ length: 64 }).notNull(),
	productId: varchar({ length: 64 }).notNull(),
	productName: varchar({ length: 255 }).notNull(),
	quantity: int().notNull(),
	pricePerUnit: decimal({ precision: 10, scale: 2 }).notNull(),
	subtotal: decimal({ precision: 12, scale: 2 }).notNull(),
	customText: varchar({ length: 8 }),
	customSelect: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const orders = mysqlTable("orders", {
	id: varchar({ length: 64 }).notNull(),
	userId: varchar({ length: 64 }).notNull(),
	clientId: varchar({ length: 64 }),
	orderNumber: varchar({ length: 50 }).notNull(),
	status: mysqlEnum(['pending','confirmed','shipped','delivered','cancelled']).default('pending'),
	subtotal: decimal({ precision: 12, scale: 2 }).notNull(),
	tax: decimal({ precision: 12, scale: 2 }).default('0.00'),
	total: decimal({ precision: 12, scale: 2 }).notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("orders_orderNumber_unique").on(table.orderNumber),
]);

export const pricingByType = mysqlTable("pricingByType", {
	id: int().autoincrement().notNull(),
	productId: varchar({ length: 64 }).notNull(),
	priceType: mysqlEnum(['ciudad','interior','especial']).notNull(),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	minQuantity: int().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("uniqueProductPriceType").on(table.productId, table.priceType),
]);

export const productVariants = mysqlTable("productVariants", {
	id: varchar({ length: 64 }).notNull(),
	productId: varchar({ length: 64 }).notNull(),
	variantType: varchar({ length: 100 }).notNull(),
	variantValue: varchar({ length: 100 }).notNull(),
	sku: varchar({ length: 100 }),
	stock: int().default(0).notNull(),
	basePrice: decimal({ precision: 10, scale: 2 }),
	precioCiudad: decimal({ precision: 10, scale: 2 }),
	precioInterior: decimal({ precision: 10, scale: 2 }),
	precioEspecial: decimal({ precision: 10, scale: 2 }),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const products = mysqlTable("products", {
	id: varchar({ length: 64 }).notNull(),
	sku: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	image: varchar({ length: 500 }),
	basePrice: decimal({ precision: 10, scale: 2 }).notNull(),
	stock: int().default(0).notNull(),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
	subcategory: varchar({ length: 100 }),
	displayOrder: int(),
	parentSku: varchar({ length: 100 }),
	variantName: varchar({ length: 255 }),
	dimension: varchar({ length: 100 }),
	line1Text: text(),
	minQuantity: int().default(1),
	line2Text: text(),
	location: varchar({ length: 100 }),
	unitsPerBox: int().default(0),
	hideInCatalog: tinyint().default(0),
	customText: varchar({ length: 8 }),
	customSelect: varchar({ length: 100 }),
},
(table) => [
	index("products_sku_unique").on(table.sku),
]);

export const promotions = mysqlTable("promotions", {
	id: varchar({ length: 64 }).notNull(),
	productId: varchar({ length: 64 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	discountType: mysqlEnum(['percentage','fixed']).notNull(),
	discountValue: decimal({ precision: 10, scale: 2 }).notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }).notNull(),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const rolePricing = mysqlTable("rolePricing", {
	id: varchar({ length: 64 }).notNull(),
	productId: varchar({ length: 64 }).notNull(),
	role: mysqlEnum(['user','distributor','reseller','admin']).notNull(),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	minQuantity: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
});

export const systemConfig = mysqlTable("systemConfig", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: text(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
	updatedBy: varchar({ length: 64 }),
},
(table) => [
	uniqueIndex("key_unique").on(table.key),
]);

export const users = mysqlTable("users", {
	id: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','distributor','reseller','admin','cliente','operador','administrador','vendedor']).default('cliente').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	companyName: varchar({ length: 255 }),
	companyTaxId: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	address: text(),
	gpsLocation: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	zipCode: varchar({ length: 20 }),
	country: varchar({ length: 100 }),
	isActive: tinyint().default(1),
	username: varchar({ length: 100 }),
	password: varchar({ length: 255 }),
	contactPerson: varchar({ length: 255 }),
	status: mysqlEnum(['active','frozen']).default('active').notNull(),
	agentNumber: varchar({ length: 100 }),
	clientNumber: varchar({ length: 100 }),
	priceType: mysqlEnum(['ciudad','interior','especial']).default('ciudad'),
	assignedVendorId: varchar({ length: 64 }),
},
(table) => [
	index("users_email_unique").on(table.email),
	index("users_username_unique").on(table.username),
]);
