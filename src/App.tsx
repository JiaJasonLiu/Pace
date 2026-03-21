import { useState } from 'react';
import { Layout } from './components/Layout';
import { SpendingView } from './pages/Spending/SpendingView';
import { WalletsView } from './pages/Wallets/WalletsView';
import { LifestyleView } from './pages/Lifestyle/LifestyleView';
import { SettingsView } from './pages/Settings/SettingsView';
import { useStore } from './hooks/useStore';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const store = useStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <SpendingView 
            transactions={store.state.transactions} 
            recurringTransactions={store.state.recurringTransactions}
            categories={store.state.categories}
            wallets={store.state.wallets}
            currency={store.state.currency}
            onAddTransaction={store.addTransaction} 
            onUpdateTransaction={store.updateTransaction}
            onDeleteTransaction={store.deleteTransaction}
            onAddRecurringTransaction={store.addRecurringTransaction}
            onUpdateRecurringTransaction={store.updateRecurringTransaction}
            onDeleteRecurringTransaction={store.deleteRecurringTransaction}
            onSkipRecurringDate={store.skipRecurringDate}
          />
        );
      case 'wallets':
        return (
          <WalletsView 
            transactions={store.state.transactions} 
            recurringTransactions={store.state.recurringTransactions}
            wallets={store.state.wallets} 
            currency={store.state.currency} 
            onAddWallet={store.addWallet}
            onUpdateWallet={store.updateWallet}
            onDeleteWallet={store.deleteWallet}
            onAddRecurringTransaction={store.addRecurringTransaction}
            onUpdateRecurringTransaction={store.updateRecurringTransaction}
            onDeleteRecurringTransaction={store.deleteRecurringTransaction}
          />
        );
      case 'lifestyle':
        return (
          <LifestyleView 
            goals={store.state.lifestyleGoals} 
            wallets={store.state.wallets}
            transactions={store.state.transactions}
            categories={store.state.categories}
            currency={store.state.currency}
            lifestyleSettings={store.state.lifestyleSettings}
            motivationalEarning={store.state.motivationalEarning}
            onAddGoal={store.addGoal}
            onUpdateGoal={store.updateGoal}
            onDeleteGoal={store.deleteGoal}
            onUpdateLifestyleSettings={store.updateLifestyleSettings}
            onUpdateMotivationalEarning={store.updateMotivationalEarning}
            onAddTransaction={store.addTransaction}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            state={store.state} 
            onAddCategory={store.addCategory}
            onUpdateCategory={store.updateCategory}
            onDeleteCategory={store.deleteCategory}
            onSetCurrency={store.setCurrency}
            onUpdateRecurringTransaction={store.updateRecurringTransaction}
            onDeleteRecurringTransaction={store.deleteRecurringTransaction}
            onImport={store.importData} 
            onClear={store.clearData} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
