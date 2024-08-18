export const migrations = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE COLLATE NOCASE NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE COLLATE NOCASE NOT NULL,
  salesPrice NUMERIC NOT NULL,
  productionCost NUMERIC NOT NULL,
  stock INTEGER,
  stockWarningLimit INTEGER,
  sku TEXT UNIQUE COLLATE NOCASE,
  barcode TEXT UNIQUE COLLATE NOCASE,
  category_id INTEGER,
  createdAt TEXT NOT NULL,
  updatedAt TEXT DEFAULT NULL,
  archivedAt TEXT DEFAULT NULL,
  disabledAt TEXT DEFAULT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE IF NOT EXISTS orders_products (
  order_id INTEGER,
  product_id INTEGER,
  name TEXT NOT NULL,
  salesPrice NUMERIC NOT NULL,
  productionCost NUMERIC NOT NULL,
  sku TEXT,
  barcode TEXT,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoiceNumber TEXT UNIQUE COLLATE NOCASE NOT NULL,
  discountAsPercent NUMERIC NOT NULL,
  discountAsValue NUMERIC NOT NULL,
  feeServiceAsPercent NUMERIC NOT NULL,
  feeServiceAsValue NUMERIC NOT NULL,
  isFeeServiceTaxable BOOLEAN NOT NULL,
  feeTaxAsPercent NUMERIC NOT NULL,
  feeTaxAsValue NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  productionCost NUMERIC NOT NULL,
  paid NUMERIC NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT DEFAULT NULL,
  
  voidedAt TEXT DEFAULT NULL,
  isVoidReturnStock BOOLEAN DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT UNIQUE COLLATE NOCASE NOT NULL,
  notes TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS carts_products (
  cart_id INTEGER,
  product_id INTEGER,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (cart_id, product_id),
  FOREIGN KEY (cart_id) REFERENCES carts (id),
  FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE IF NOT EXISTS generalSettings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  currency TEXT NOT NULL,
  currencyDecimalLength INTEGER NOT NULL,
  currencyThousandSeparator TEXT NOT NULL,
  isVoidReturnStock BOOLEAN NOT NULL,
  discount NUMERIC NOT NULL,
  isDiscountAlwaysUsed BOOLEAN NOT NULL,
  feeService NUMERIC NOT NULL,
  isFeeServiceAlwaysUsed BOOLEAN NOT NULL,
  isFeeServiceTaxable BOOLEAN NOT NULL,
  feeTax NUMERIC NOT NULL,
  isFeeTaxAlwaysUsed BOOLEAN NOT NULL,
  updatedAt TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS receiptSettings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storeName TEXT NOT NULL,
  storeAddress TEXT NOT NULL,
  storeContact TEXT NOT NULL,
  footerMessage TEXT NOT NULL,
  updatedAt TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS printers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deviceId TEXT UNIQUE COLLATE NOCASE NOT NULL,
  name TEXT UNIQUE COLLATE NOCASE NOT NULL,
  paperSize TEXT NOT NULL
);

`;

export const seeds = `
INSERT INTO generalSettings (currency, currencyDecimalLength, currencyThousandSeparator, isVoidReturnStock, discount, isDiscountAlwaysUsed, feeService, isFeeServiceAlwaysUsed, isFeeServiceTaxable, feeTax, isFeeTaxAlwaysUsed)
VALUES ('USD', 2, ',', 0, 0, 0, 0, 0, 0, 0, 0);

INSERT INTO receiptSettings (storeName, storeAddress, storeContact, footerMessage)
VALUES ('Good Store', 'Main Street 123', 'contact@example.com', 'Thank you!');

`;

export const dummies = `
INSERT INTO categories (name, createdAt) 
VALUES 
('Foods', datetime('now', 'localtime')),
('Drinks', datetime('now', 'localtime')),
('Snacks', datetime('now', 'localtime'));

INSERT INTO products (name, salesPrice, productionCost, stock, stockWarningLimit, sku, barcode, category_id, createdAt) 
VALUES 
('Satay', 11.00, 10.00, 100, 10, 'AAABBBCCC111', '333222111', 1, datetime('now', 'localtime')),
('Dimsum', 12.00, 10.00, 100, 10, 'AAABBBCCC112', '333222112', 1, datetime('now', 'localtime')),
('Orange Juice', 13.00, 10.00, 100, 10, 'AAABBBCCC113', '333222113', 2, datetime('now', 'localtime')),
('Green Tea', 14.00, 10.00, 100, 10, 'AAABBBCCC114', '333222114', 2, datetime('now', 'localtime')),
('Banana Chips', 15.00, 10.00, 100, 10, 'AAABBBCCC115', '333222115', 3, datetime('now', 'localtime'));

INSERT INTO carts (title, notes, createdAt)
VALUES 
('Table 1', 'No plastics', datetime('now', 'localtime')),
('Table 2', 'No plastics', datetime('now', 'localtime')),
('Table 3', 'No plastics', datetime('now', 'localtime'));

INSERT INTO carts_products (cart_id, product_id, quantity)
VALUES 
(1, 1, 1),
(1, 2, 1),
(2, 1, 1),
(2, 3, 1),
(3, 2, 1),
(3, 3, 1);

INSERT INTO printers (deviceId, name, paperSize)
VALUES
('66:32:C9:90:ED:40', 'Epson', '58mm');

`;