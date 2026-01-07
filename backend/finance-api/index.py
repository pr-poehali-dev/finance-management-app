import json
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Создает подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """
    API для управления финансами: получение данных, добавление операций, 
    управление счетами, бюджетами и целями
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query_params = event.get('queryStringParameters', {}) or {}
        path = query_params.get('action', '')
        
        if method == 'GET':
            if path == 'dashboard':
                result = get_dashboard_data(cursor)
            elif path == 'accounts':
                result = get_accounts(cursor)
            elif path == 'transactions':
                result = get_transactions(cursor)
            elif path == 'budgets':
                result = get_budgets(cursor)
            elif path == 'goals':
                result = get_goals(cursor)
            elif path == 'categories':
                result = get_categories(cursor)
            else:
                result = {'error': 'Unknown action'}
                
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'transaction':
                result = add_transaction(cursor, conn, body)
            elif path == 'account':
                result = add_account(cursor, conn, body)
            elif path == 'goal':
                result = add_goal(cursor, conn, body)
            elif path == 'budget':
                result = add_budget(cursor, conn, body)
            else:
                result = {'error': 'Unknown action'}
                
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'goal':
                result = update_goal(cursor, conn, body)
            elif path == 'budget':
                result = update_budget(cursor, conn, body)
            else:
                result = {'error': 'Unknown action'}
        
        else:
            result = {'error': 'Method not allowed'}
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, default=str)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def get_dashboard_data(cursor):
    """Получить данные для главного дашборда"""
    cursor.execute('SELECT * FROM accounts ORDER BY id')
    accounts = cursor.fetchall()
    
    cursor.execute('''
        SELECT t.*, c.name as category_name, c.icon as category_icon, a.name as account_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts a ON t.account_id = a.id
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT 10
    ''')
    transactions = cursor.fetchall()
    
    cursor.execute('SELECT * FROM goals ORDER BY id')
    goals = cursor.fetchall()
    
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    cursor.execute('''
        SELECT 
            c.name as category,
            c.icon,
            COALESCE(b.limit_amount, 0) as limit_amount,
            COALESCE(SUM(t.amount), 0) as spent
        FROM categories c
        LEFT JOIN budgets b ON c.id = b.category_id 
            AND b.month = %s AND b.year = %s
        LEFT JOIN transactions t ON c.id = t.category_id 
            AND t.type = 'expense'
            AND EXTRACT(MONTH FROM t.transaction_date) = %s
            AND EXTRACT(YEAR FROM t.transaction_date) = %s
        WHERE c.type = 'expense'
        GROUP BY c.id, c.name, c.icon, b.limit_amount
        HAVING COALESCE(b.limit_amount, 0) > 0
        ORDER BY c.name
    ''', (current_month, current_year, current_month, current_year))
    budgets = cursor.fetchall()
    
    return {
        'accounts': accounts,
        'transactions': transactions,
        'goals': goals,
        'budgets': budgets
    }


def get_accounts(cursor):
    """Получить все счета"""
    cursor.execute('SELECT * FROM accounts ORDER BY id')
    return {'accounts': cursor.fetchall()}


def get_transactions(cursor):
    """Получить все транзакции"""
    cursor.execute('''
        SELECT t.*, c.name as category_name, c.icon as category_icon, a.name as account_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts a ON t.account_id = a.id
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT 50
    ''')
    return {'transactions': cursor.fetchall()}


def get_budgets(cursor):
    """Получить бюджеты текущего месяца"""
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    cursor.execute('''
        SELECT 
            b.id,
            c.name as category,
            c.icon,
            b.limit_amount,
            COALESCE(SUM(t.amount), 0) as spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t ON c.id = t.category_id 
            AND t.type = 'expense'
            AND EXTRACT(MONTH FROM t.transaction_date) = %s
            AND EXTRACT(YEAR FROM t.transaction_date) = %s
        WHERE b.month = %s AND b.year = %s
        GROUP BY b.id, c.name, c.icon, b.limit_amount
        ORDER BY c.name
    ''', (current_month, current_year, current_month, current_year))
    return {'budgets': cursor.fetchall()}


def get_goals(cursor):
    """Получить все цели"""
    cursor.execute('SELECT * FROM goals WHERE completed_at IS NULL ORDER BY id')
    return {'goals': cursor.fetchall()}


def get_categories(cursor):
    """Получить все категории"""
    cursor.execute('SELECT * FROM categories ORDER BY type, name')
    return {'categories': cursor.fetchall()}


def add_transaction(cursor, conn, data):
    """Добавить новую транзакцию"""
    cursor.execute('''
        INSERT INTO transactions (type, amount, category_id, description, transaction_date, account_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    ''', (
        data['type'],
        data['amount'],
        data['category_id'],
        data.get('description', ''),
        data.get('transaction_date', datetime.now().date()),
        data['account_id']
    ))
    
    transaction_id = cursor.fetchone()['id']
    
    if data['type'] == 'income':
        cursor.execute(
            'UPDATE accounts SET balance = balance + %s WHERE id = %s',
            (data['amount'], data['account_id'])
        )
    else:
        cursor.execute(
            'UPDATE accounts SET balance = balance - %s WHERE id = %s',
            (data['amount'], data['account_id'])
        )
    
    conn.commit()
    return {'success': True, 'transaction_id': transaction_id}


def add_account(cursor, conn, data):
    """Добавить новый счёт"""
    cursor.execute('''
        INSERT INTO accounts (name, balance, type)
        VALUES (%s, %s, %s)
        RETURNING id
    ''', (data['name'], data.get('balance', 0), data['type']))
    
    account_id = cursor.fetchone()['id']
    conn.commit()
    return {'success': True, 'account_id': account_id}


def add_goal(cursor, conn, data):
    """Добавить новую цель"""
    cursor.execute('''
        INSERT INTO goals (name, target_amount, current_amount, icon)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    ''', (
        data['name'],
        data['target_amount'],
        data.get('current_amount', 0),
        data['icon']
    ))
    
    goal_id = cursor.fetchone()['id']
    conn.commit()
    return {'success': True, 'goal_id': goal_id}


def add_budget(cursor, conn, data):
    """Добавить новый бюджет"""
    cursor.execute('''
        INSERT INTO budgets (category_id, limit_amount, month, year)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (category_id, month, year) 
        DO UPDATE SET limit_amount = EXCLUDED.limit_amount
        RETURNING id
    ''', (
        data['category_id'],
        data['limit_amount'],
        data.get('month', datetime.now().month),
        data.get('year', datetime.now().year)
    ))
    
    budget_id = cursor.fetchone()['id']
    conn.commit()
    return {'success': True, 'budget_id': budget_id}


def update_goal(cursor, conn, data):
    """Обновить прогресс цели"""
    cursor.execute('''
        UPDATE goals 
        SET current_amount = %s,
            completed_at = CASE WHEN %s >= target_amount THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE id = %s
        RETURNING id
    ''', (data['current_amount'], data['current_amount'], data['id']))
    
    conn.commit()
    return {'success': True}


def update_budget(cursor, conn, data):
    """Обновить бюджет"""
    cursor.execute('''
        UPDATE budgets 
        SET limit_amount = %s
        WHERE id = %s
        RETURNING id
    ''', (data['limit_amount'], data['id']))
    
    conn.commit()
    return {'success': True}