const API_URL = 'https://functions.poehali.dev/bcb1a421-2117-4ab4-b3d2-b0f163ef7d27';

export interface Account {
  id: number;
  name: string;
  balance: string;
  type: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  description: string;
  transaction_date: string;
  account_id: number;
  account_name: string;
  created_at: string;
}

export interface Budget {
  id?: number;
  category: string;
  icon: string;
  limit_amount: string;
  spent: string;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  icon: string;
  created_at: string;
  completed_at: string | null;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

export interface DashboardData {
  accounts: Account[];
  transactions: Transaction[];
  goals: Goal[];
  budgets: Budget[];
}

async function apiRequest(action: string, method: string = 'GET', body?: any) {
  const url = `${API_URL}?action=${action}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getDashboard: (): Promise<DashboardData> => apiRequest('dashboard'),
  
  getAccounts: (): Promise<{ accounts: Account[] }> => apiRequest('accounts'),
  
  getTransactions: (): Promise<{ transactions: Transaction[] }> => apiRequest('transactions'),
  
  getBudgets: (): Promise<{ budgets: Budget[] }> => apiRequest('budgets'),
  
  getGoals: (): Promise<{ goals: Goal[] }> => apiRequest('goals'),
  
  getCategories: (): Promise<{ categories: Category[] }> => apiRequest('categories'),
  
  addTransaction: (data: {
    type: 'income' | 'expense';
    amount: number;
    category_id: number;
    description: string;
    transaction_date: string;
    account_id: number;
  }) => apiRequest('transaction', 'POST', data),
  
  addAccount: (data: {
    name: string;
    balance: number;
    type: string;
  }) => apiRequest('account', 'POST', data),
  
  addGoal: (data: {
    name: string;
    target_amount: number;
    current_amount: number;
    icon: string;
  }) => apiRequest('goal', 'POST', data),
  
  addBudget: (data: {
    category_id: number;
    limit_amount: number;
    month: number;
    year: number;
  }) => apiRequest('budget', 'POST', data),
  
  updateGoal: (data: {
    id: number;
    current_amount: number;
  }) => apiRequest('goal', 'PUT', data),
  
  updateBudget: (data: {
    id: number;
    limit_amount: number;
  }) => apiRequest('budget', 'PUT', data),
};
