-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'savings', 'cash')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(15, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    account_id INTEGER REFERENCES accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    limit_amount DECIMAL(15, 2) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, month, year)
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    icon VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, type, icon) VALUES
    ('Зарплата', 'income', 'Briefcase'),
    ('Бонусы', 'income', 'Gift'),
    ('Инвестиции', 'income', 'TrendingUp'),
    ('Продукты', 'expense', 'ShoppingCart'),
    ('Транспорт', 'expense', 'Car'),
    ('Рестораны', 'expense', 'Coffee'),
    ('Развлечения', 'expense', 'Tv'),
    ('Здоровье', 'expense', 'Heart'),
    ('Одежда', 'expense', 'ShoppingBag'),
    ('Образование', 'expense', 'BookOpen'),
    ('Жильё', 'expense', 'Home'),
    ('Связь', 'expense', 'Smartphone')
ON CONFLICT (name) DO NOTHING;

-- Insert sample accounts
INSERT INTO accounts (name, balance, type) VALUES
    ('Основная карта', 245680.00, 'card'),
    ('Накопительный', 520000.00, 'savings'),
    ('Наличные', 15000.00, 'cash');

-- Insert sample goals
INSERT INTO goals (name, target_amount, current_amount, icon) VALUES
    ('MacBook Pro', 250000.00, 178000.00, 'Laptop'),
    ('Отпуск в Италии', 180000.00, 95000.00, 'Plane'),
    ('Аварийный фонд', 300000.00, 210000.00, 'Shield');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(year, month);