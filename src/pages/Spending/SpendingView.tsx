import React, { useState } from 'react';
import { Transaction, Category, Wallet, RecurringTransaction, RecurrenceType, TransactionType } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { Plus, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isSameWeek, addWeeks, subWeeks, startOfDay, isBefore, isSameDay, isAfter, addMonths, endOfDay } from 'date-fns';
import { TransactionCard } from '../../components/TransactionCard';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'motion/react';
import { TransactionModal } from '../../components/TransactionModal';
import { SpendingViewProps } from './types';

export function SpendingView({ transactions, recurringTransactions, categories, wallets, currency, onAddTransaction, onUpdateTransaction, onDeleteTransaction, onAddRecurringTransaction, onUpdateRecurringTransaction, onDeleteRecurringTransaction, onSkipRecurringDate }: SpendingViewProps) {
  const expenseCategories = (categories || []).filter(c => c.type === 'expense');
  const incomeCategories = (categories || []).filter(c => c.type === 'income');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handlePrevWeek = () => {
    setDirection(-1);
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setDirection(1);
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: (e) => {
      const target = e.event.target as HTMLElement;
      if (target.closest('.swipe-card-container')) return;
      handleNextWeek();
    },
    onSwipedRight: (e) => {
      const target = e.event.target as HTMLElement;
      if (target.closest('.swipe-card-container')) return;
      handlePrevWeek();
    },
    trackMouse: false
  });

  // Weekly calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

  const thisWeekTransactions = transactions.filter(t => isSameWeek(parseISO(t.date), currentDate, { weekStartsOn: 1 }));
  
  // Calculate scheduled transactions for the week
  const scheduledTransactions: Transaction[] = [];
  recurringTransactions.forEach(r => {
    if (!r.isActive) return;

    const start = parseISO(r.startDate);
    const now = startOfDay(new Date());
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    let checkDate = start;
    // Find the absolute next occurrence from today that hasn't been posted yet
    let foundNext = false;
    let iterations = 0;
    while (!foundNext && iterations < 100) { // Safety break
      iterations++;
      if (isBefore(checkDate, now)) {
        checkDate = r.recurrence === 'weekly' ? addWeeks(checkDate, 1) : addMonths(checkDate, 1);
        continue;
      }

      // Check if this specific occurrence was already posted or skipped
      const isAlreadyPosted = transactions.some(t => t.recurringId === r.id && isSameDay(parseISO(t.date), checkDate));
      const isSkipped = r.skippedDates?.some(d => isSameDay(parseISO(d), checkDate));
      
      if (isAlreadyPosted || isSkipped) {
        checkDate = r.recurrence === 'weekly' ? addWeeks(checkDate, 1) : addMonths(checkDate, 1);
        continue;
      }

      foundNext = true;
    }

    // Only show this single next occurrence if it falls within the current week view
    if (foundNext && 
        (isSameDay(checkDate, weekStart) || isAfter(checkDate, weekStart)) && 
        (isSameDay(checkDate, weekEnd) || isBefore(checkDate, weekEnd))) {
      
      scheduledTransactions.push({
        id: `scheduled-${r.id}-${checkDate.getTime()}`,
        amount: r.amount,
        type: r.type,
        category: r.category,
        description: r.description,
        date: checkDate.toISOString(),
        walletId: r.walletId,
        recurringId: r.id,
        status: 'scheduled',
        isFixedCost: r.isFixedCost
      });
    }
  });

  const allDisplayTransactions = [...thisWeekTransactions, ...scheduledTransactions]
    .filter(t => !(t.status === 'scheduled' && isBefore(parseISO(t.date), startOfDay(new Date()))))
    .sort((a, b) => 
      parseISO(b.date).getTime() - parseISO(a.date).getTime()
    );

  const postedTransactions = thisWeekTransactions.filter(t => !t.status || t.status === 'posted');
  const weeklyIncome = postedTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const weeklyExpense = postedTransactions.filter(t => t.type === 'expense' && !t.isFixedCost).reduce((acc, t) => acc + t.amount, 0);
  const weeklyBalance = weeklyIncome - weeklyExpense;

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (editingTransaction) {
      if (editingTransaction.id.startsWith('scheduled-')) {
        const withoutPrefix = editingTransaction.id.replace('scheduled-', '');
        const lastDashIndex = withoutPrefix.lastIndexOf('-');
        const recurringId = withoutPrefix.substring(0, lastDashIndex);
        onSkipRecurringDate(recurringId, editingTransaction.date);
      } else {
        onDeleteTransaction(editingTransaction.id);
      }
      setIsModalOpen(false);
    }
  };

  const handleSave = (data: {
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    date: string;
    walletId?: string;
    recurrence: RecurrenceType | 'none';
    status: 'posted' | 'scheduled';
    isFixedCost?: boolean;
  }) => {
    const { amount, type, category, description, date, walletId, recurrence, status, isFixedCost } = data;
    
    if (editingTransaction) {
      let recurringId = editingTransaction.recurringId;
      
      if (recurrence === 'none') {
        if (recurringId) {
          onDeleteRecurringTransaction(recurringId);
          recurringId = undefined;
        }
      } else {
        if (recurringId) {
          const existingRule = recurringTransactions.find(r => r.id === recurringId);
          if (existingRule) {
            onUpdateRecurringTransaction({
              ...existingRule,
              amount,
              type,
              category,
              description,
              walletId,
              recurrence: recurrence as RecurrenceType,
              isFixedCost
            });
          }
        } else {
          // Converting normal to recurring
          recurringId = crypto.randomUUID();
          onAddRecurringTransaction({
            id: recurringId,
            amount,
            type,
            category,
            description,
            walletId,
            recurrence: recurrence as RecurrenceType,
            startDate: date,
            lastGeneratedDate: date,
            isActive: true,
            isFixedCost
          });
        }
      }

      if (editingTransaction.id.startsWith('scheduled-')) {
        onAddTransaction({
          id: editingTransaction.id,
          date,
          amount,
          type,
          category,
          description,
          walletId,
          recurringId,
          status,
          isFixedCost
        });
      } else {
        onUpdateTransaction({
          id: editingTransaction.id,
          date,
          amount,
          type,
          category,
          description,
          walletId,
          recurringId,
          status,
          isFixedCost
        });
      }
    } else {
      const transactionId = crypto.randomUUID();
      let recurringId = undefined;

      if (recurrence !== 'none') {
        recurringId = crypto.randomUUID();
        onAddRecurringTransaction({
          id: recurringId,
          amount,
          type,
          category,
          description,
          walletId,
          recurrence: recurrence as RecurrenceType,
          startDate: date,
          lastGeneratedDate: date,
          isActive: true,
          isFixedCost
        });
      }

      onAddTransaction({
        id: transactionId,
        date,
        amount,
        type,
        category,
        description,
        walletId,
        recurringId,
        status,
        isFixedCost
      });
    }
  };

  // Group transactions by day for the current week
  const groupedTransactions = allDisplayTransactions.reduce((groups, t) => {
    const d = parseISO(t.date);
    const dayKey = format(d, 'yyyy-MM-dd');
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(t);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const handlePostScheduled = (e: React.MouseEvent, t: Transaction) => {
    e.stopPropagation();
    if (t.id.startsWith('scheduled-')) {
      // It's virtual, add it as a real record
      onAddTransaction({
        ...t,
        id: t.id,
        status: 'posted'
      });
    } else {
      // It's already a real record, just update status
      onUpdateTransaction({
        ...t,
        status: 'posted'
      });
    }
  };

  const renderCategoryIcon = (categoryName: string, tType: 'income' | 'expense') => {
    const cat = (categories || []).find(c => c.name === categoryName && c.type === tType);
    if (cat && cat.icon) {
      const IconComponent = (Icons as any)[cat.icon];
      if (IconComponent) return <IconComponent className="w-5 h-5" />;
    }
    return tType === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />;
  };

  const sortedDays = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const timestampVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction * 20
    }),
    center: {
      opacity: 1,
      x: 0
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: -direction * 20
    })
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className="relative min-h-full pb-20 overflow-hidden" {...swipeHandlers}>
      <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={handlePrevWeek} className="p-2 text-slate-400 hover:text-royal transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center overflow-hidden relative h-8 flex items-center justify-center w-[200px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.h2 
              key={weekRange}
              custom={direction}
              variants={timestampVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-lg font-medium text-slate-800 absolute whitespace-nowrap"
            >
              {weekRange}
            </motion.h2>
          </AnimatePresence>
        </div>
        <button onClick={handleNextWeek} className="p-2 text-slate-400 hover:text-royal transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentDate.toISOString()}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="space-y-6"
        >
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Weekly Balance</p>
            <h2 className={`text-4xl font-light tracking-tight ${weeklyBalance >= 0 ? 'text-royal-dark' : 'text-red-500'}`}>
              {formatCurrency(weeklyBalance, currency)}
            </h2>
            
            <div className="flex w-full justify-between mt-6 pt-6 border-t border-slate-100">
              <div className="flex flex-col items-center">
                <div className="flex items-center text-notion-green mb-1">
                  <ArrowUpCircle className="w-4 h-4 mr-1" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Income</span>
                </div>
                <span className="font-mono text-sm">{formatCurrency(weeklyIncome, currency)}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center text-rose-500 mb-1">
                  <ArrowDownCircle className="w-4 h-4 mr-1" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Expense</span>
                </div>
                <span className="font-mono text-sm">{formatCurrency(weeklyExpense, currency)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {sortedDays.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No transactions this week.</p>
            ) : (
              sortedDays.map(day => (
                <div key={day} className="space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1 flex justify-between items-center">
                    <span>{format(parseISO(day), 'EEEE MMM d')}</span>
                    <span>
                      {groupedTransactions[day]
                        .filter(t => t.status !== 'scheduled')
                        .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0) >= 0 ? '+' : ''}
                      {groupedTransactions[day]
                        .filter(t => t.status !== 'scheduled')
                        .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0).toFixed(2)}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {groupedTransactions[day].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
                        const category = categories.find(c => c.name === t.category && c.type === t.type);
                        const mainCategory = category?.mainCategoryId ? categories.find(c => c.id === category.mainCategoryId) : undefined;
                        const isScheduled = t.status === 'scheduled';
                        
                        return (
                          <motion.div 
                            key={t.id} 
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, x: -100, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative overflow-hidden rounded-xl group swipe-card-container"
                          >
                            {/* Delete background action - only for non-scheduled */}
                            {!isScheduled && (
                              <div className="absolute inset-0 bg-slate-100 flex items-center justify-end pr-6 rounded-xl">
                                <div className="flex flex-col items-center text-slate-400">
                                  <Icons.Trash2 className="w-5 h-5 mb-1" />
                                  <span className="text-[10px] font-bold uppercase tracking-tighter">Delete</span>
                                </div>
                              </div>
                            )}

                            <motion.div
                              drag={isScheduled ? false : "x"}
                              dragConstraints={{ left: -100, right: 0 }}
                              dragElastic={0.05}
                              onDragEnd={(_, info) => {
                                if (info.offset.x < -70) {
                                  if (isScheduled) {
                                    // Parse id: scheduled-{recurringId}-{dateISO}
                                    const parts = t.id.split('-');
                                    const recurringId = parts[1];
                                    const date = parts.slice(2).join('-');
                                    onSkipRecurringDate(recurringId, date);
                                  } else {
                                    onDeleteTransaction(t.id);
                                  }
                                }
                              }}
                              onTouchStart={(e) => e.stopPropagation()}
                              onTouchMove={(e) => e.stopPropagation()}
                              className="relative z-10 bg-white rounded-xl"
                            >
                              <TransactionCard
                                transaction={t}
                                category={category}
                                mainCategory={mainCategory}
                                currency={currency}
                                onClick={() => handleOpenEdit(t)}
                                onAdd={t.status === 'scheduled' ? (e) => handlePostScheduled(e, t) : undefined}
                                icon={renderCategoryIcon(t.category, t.type)}
                                showLifestyleType={true}
                                isFixedCost={t.isFixedCost}
                              />
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Floating Action Button */}
      <button
        onClick={handleOpenAdd}
        className="fixed bottom-24 right-6 w-14 h-14 bg-royal text-white rounded-full shadow-lg shadow-royal/30 flex items-center justify-center hover:bg-royal-dark transition-transform active:scale-95 z-30"
        aria-label="Add Transaction"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <TransactionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            onDelete={editingTransaction ? handleDelete : undefined}
            initialData={editingTransaction ? {
              ...editingTransaction,
              recurrence: editingTransaction.recurringId ? recurringTransactions.find(r => r.id === editingTransaction.recurringId)?.recurrence : 'none'
            } : undefined}
            categories={categories}
            wallets={wallets}
            currency={currency}
            title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
