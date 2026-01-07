import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, type DashboardData, type Category } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category_id: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    account_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboard, categoriesData] = await Promise.all([
        api.getDashboard(),
        api.getCategories(),
      ]);
      setDashboardData(dashboard);
      setCategories(categoriesData.categories);
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      await api.addTransaction({
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        category_id: parseInt(newTransaction.category_id),
        account_id: parseInt(newTransaction.account_id),
      });
      
      toast({
        title: 'Успешно',
        description: 'Операция добавлена',
      });
      
      setDialogOpen(false);
      setNewTransaction({
        type: 'expense',
        amount: '',
        category_id: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        account_id: '',
      });
      
      loadData();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить операцию',
        variant: 'destructive',
      });
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  const { accounts, transactions, goals, budgets } = dashboardData;

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const monthExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.transaction_date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const monthIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.transaction_date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(num);
  };

  const filteredCategories = categories.filter(c => c.type === newTransaction.type);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-accent text-accent-foreground w-10 h-10 rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FINMAP PRO</h1>
                <p className="text-xs text-muted-foreground">Управление финансами</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Icon name="Plus" size={16} />
                  Добавить операцию
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая операция</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Тип</Label>
                    <Select value={newTransaction.type} onValueChange={(value: 'income' | 'expense') => setNewTransaction({ ...newTransaction, type: value, category_id: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Доход</SelectItem>
                        <SelectItem value="expense">Расход</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Сумма</Label>
                    <Input type="number" placeholder="0" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                  </div>
                  <div>
                    <Label>Категория</Label>
                    <Select value={newTransaction.category_id} onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Счёт</Label>
                    <Select value={newTransaction.account_id} onValueChange={(value) => setNewTransaction({ ...newTransaction, account_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите счёт" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Input placeholder="Описание операции" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} />
                  </div>
                  <Button className="w-full" onClick={handleAddTransaction}>Добавить</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover-scale">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="Wallet" size={16} />
                Общий баланс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{formatCurrency(totalBalance)}</div>
              <p className="text-xs text-muted-foreground mt-1">{accounts.length} счетов</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="TrendingUp" size={16} />
                Доходы за месяц
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--success))' }}>{formatCurrency(monthIncome)}</div>
              <p className="text-xs text-muted-foreground mt-1">Январь 2026</p>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="TrendingDown" size={16} />
                Расходы за месяц
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{formatCurrency(monthExpenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">Январь 2026</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="PieChart" size={20} />
                  Бюджет по категориям
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Бюджеты не установлены</p>
                ) : (
                  budgets.map((budget) => {
                    const limit = parseFloat(budget.limit_amount);
                    const spent = parseFloat(budget.spent);
                    const percentage = (spent / limit) * 100;
                    const isOverBudget = percentage > 100;
                    const isNearLimit = percentage > 80 && percentage <= 100;

                    return (
                      <div key={budget.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon name={budget.icon} size={16} className="text-muted-foreground" />
                            <span className="font-medium text-sm">{budget.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{formatCurrency(spent)}</span>
                            <span className="text-xs text-muted-foreground">/ {formatCurrency(limit)}</span>
                            {isOverBudget && (
                              <Badge variant="destructive" className="text-xs">Превышен</Badge>
                            )}
                            {isNearLimit && (
                              <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">Близко к лимиту</Badge>
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className={`h-2 ${isOverBudget ? 'bg-destructive/20' : ''}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          Осталось: {formatCurrency(Math.max(0, limit - spent))} ({Math.max(0, 100 - percentage).toFixed(0)}%)
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Receipt" size={20} />
                  Последние операции
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Операций пока нет</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            <Icon name={transaction.type === 'income' ? 'ArrowDownLeft' : 'ArrowUpRight'} size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{transaction.category_name} • {transaction.account_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="CreditCard" size={20} />
                  Счета
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="p-4 rounded-lg border border-border hover:border-accent transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon 
                          name={account.type === 'card' ? 'CreditCard' : account.type === 'savings' ? 'PiggyBank' : 'Wallet'} 
                          size={16} 
                          className="text-accent"
                        />
                        <p className="font-medium text-sm">{account.name}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold">{formatCurrency(account.balance)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Target" size={20} />
                  Финансовые цели
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.map((goal) => {
                  const target = parseFloat(goal.target_amount);
                  const current = parseFloat(goal.current_amount);
                  const percentage = (current / target) * 100;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name={goal.icon} size={16} className="text-accent" />
                          <span className="font-medium text-sm">{goal.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{formatCurrency(current)}</span>
                        <span className="font-semibold">{formatCurrency(target)}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="BarChart3" size={20} />
              Аналитика расходов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="month" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Неделя</TabsTrigger>
                <TabsTrigger value="month">Месяц</TabsTrigger>
                <TabsTrigger value="year">Год</TabsTrigger>
              </TabsList>
              <TabsContent value="month" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Всего за месяц</span>
                    <span className="font-bold text-lg">{formatCurrency(monthExpenses)}</span>
                  </div>
                  {budgets.length > 0 && (
                    <div className="space-y-2">
                      {budgets.map((budget, index) => {
                        const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spent), 0);
                        const spent = parseFloat(budget.spent);
                        const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
                        
                        return (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{budget.category}</span>
                              <span className="font-semibold">{formatCurrency(spent)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-accent h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="week" className="mt-6">
                <p className="text-center text-muted-foreground py-8">Данные за неделю в разработке</p>
              </TabsContent>
              <TabsContent value="year" className="mt-6">
                <p className="text-center text-muted-foreground py-8">Годовая статистика в разработке</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
