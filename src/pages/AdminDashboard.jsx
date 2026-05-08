import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Plus, MoreVertical, Pencil, X, Check, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import ExpenseForm from '../components/ExpenseForm'
import IncomeForm from '../components/IncomeForm'
import StudentPaymentManager from '../components/StudentPaymentManager'

// ─── Helper ────────────────────────────────────────────────────────────────────
const calcTotalCash = (incomes = [], expenses = []) => {
  const totalIncome  = incomes.reduce((sum, r) => sum + (r.amount ?? 0), 0)
  const totalExpense = expenses.reduce((sum, r) => sum + (r.amount ?? 0), 0)
  return totalIncome - totalExpense
}

// ─── Inline edit card ──────────────────────────────────────────────────────────
function EditableCard({ icon: Icon, title, value, subtext, accentClass, onSave }) {
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState('')
  const [saving, setSaving]     = useState(false)

  const startEdit = () => {
    // strip non-numeric chars coming from formatted display value
    setDraft(String(value))
    setEditing(true)
  }

  const cancel = () => setEditing(false)

  const save = async () => {
    const num = parseFloat(draft.replace(/[^0-9.-]/g, ''))
    if (isNaN(num)) return
    setSaving(true)
    await onSave(num)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden">
      {/* accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentClass}`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${accentClass} bg-opacity-20`}>
          <Icon size={20} className="text-white" />
        </div>
        {!editing ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={startEdit}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title={`Edit ${title}`}
          >
            <Pencil size={15} className="text-white/50 hover:text-accent" />
          </motion.button>
        ) : (
          <div className="flex gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={cancel}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={15} className="text-white/50" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={save}
              disabled={saving}
              className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
            >
              <Check size={15} className="text-green-400" />
            </motion.button>
          </div>
        )}
      </div>

      <p className="text-white/60 text-sm mb-1">{title}</p>

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.input
            key="input"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
            autoFocus
            className="w-full bg-white/10 border border-accent/40 rounded-lg px-3 py-1.5 text-white text-lg font-bold focus:outline-none focus:border-accent"
          />
        ) : (
          <motion.p
            key="value"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xl font-display font-bold text-white"
          >
            Rp {Number(value).toLocaleString('id-ID')}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="text-white/40 text-xs mt-1">{subtext}</p>
    </div>
  )
}

// ─── Read-only stat card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, subtext, accentClass }) {
  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentClass}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${accentClass} bg-opacity-20`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-white/60 text-sm mb-1">{title}</p>
      <p className="text-xl font-display font-bold text-white">{value}</p>
      <p className="text-white/40 text-xs mt-1">{subtext}</p>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [expenses, setExpenses]               = useState([])
  const [incomes, setIncomes]                 = useState([])
  const [financialSummary, setFinancialSummary] = useState({ mini_bank: 0, treasurer: 0 })
  const [summaryId, setSummaryId]             = useState(null)   // id of the financial_summary row
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm]   = useState(false)
  const [activeTab, setActiveTab]             = useState('overview')
  const [isLoading, setIsLoading]             = useState(true)

  useEffect(() => { fetchAdminData() }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAdminData = async () => {
    try {
      setIsLoading(true)

      const [expenseRes, incomeRes, summaryRes] = await Promise.all([
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('income').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_summary').select('*').limit(1).maybeSingle(),
      ])

      setExpenses(expenseRes.data || [])
      setIncomes(incomeRes.data  || [])

      if (summaryRes.data) {
        setFinancialSummary({
          mini_bank:  summaryRes.data.mini_bank  ?? 0,
          treasurer:  summaryRes.data.treasurer  ?? 0,
        })
        setSummaryId(summaryRes.data.id)
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Derived value ──────────────────────────────────────────────────────────
  const totalClassCash = calcTotalCash(incomes, expenses)

  // ── Upsert a field in financial_summary ────────────────────────────────────
  const updateSummaryField = async (field, value) => {
    try {
      if (summaryId) {
        const { error } = await supabase
          .from('financial_summary')
          .update({ [field]: value })
          .eq('id', summaryId)
        if (error) throw error
      } else {
        // No row yet - insert one
        const { data, error } = await supabase
          .from('financial_summary')
          .insert([{ [field]: value }])
          .select()
          .single()
        if (error) throw error
        setSummaryId(data.id)
      }
      setFinancialSummary((prev) => ({ ...prev, [field]: value }))
    } catch (err) {
      console.error(`Failed to update ${field}:`, err)
    }
  }

  // ── CRUD helpers ───────────────────────────────────────────────────────────
  const handleLogout = () => { logout(); navigate('/login') }

  const handleAddExpense = async (expenseData) => {
    try {
      const { error } = await supabase.from('expenses').insert([expenseData])
      if (error) throw error
      setShowExpenseForm(false)
      fetchAdminData()
    } catch (err) { console.error('Failed to add expense:', err) }
  }

  const handleAddIncome = async (incomeData) => {
    try {
      const { error } = await supabase.from('income').insert([incomeData])
      if (error) throw error
      setShowIncomeForm(false)
      fetchAdminData()
    } catch (err) { console.error('Failed to add income:', err) }
  }

  const handleDeleteExpense = async (id) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      fetchAdminData()
    } catch (err) { console.error('Failed to delete expense:', err) }
  }

  const handleDeleteIncome = async (id) => {
    try {
      const { error } = await supabase.from('income').delete().eq('id', id)
      if (error) throw error
      fetchAdminData()
    } catch (err) { console.error('Failed to delete income:', err) }
  }

  // ── Animation variants ─────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 glass border-b border-accent/10 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-white/60">{user?.name || 'Admin'}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 glass hover:bg-red-500/20 transition-colors rounded-lg"
          >
            <LogOut size={18} className="text-accent" />
            <span className="text-sm font-medium">Logout</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
      >
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['overview', 'expenses', 'income', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab ? 'bg-accent text-dark-primary' : 'glass hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-6"
      >
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <motion.div variants={itemVariants} className="space-y-6">

            {/* ── Financial summary cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Class Cash - computed, read-only */}
              <StatCard
                icon={Wallet}
                title="Total Class Cash"
                value={`Rp ${totalClassCash.toLocaleString('id-ID')}`}
                subtext="Income − Expenses (real-time)"
                accentClass="from-accent to-accent-light"
              />

              {/* Mini Bank - editable */}
              <EditableCard
                icon={TrendingUp}
                title="Mini Bank"
                value={financialSummary.mini_bank}
                subtext="Savings account - tap ✏ to edit"
                accentClass="from-green-500 to-emerald-500"
                onSave={(val) => updateSummaryField('mini_bank', val)}
              />

              {/* Treasurer (Bendahara) - editable */}
              <EditableCard
                icon={TrendingDown}
                title="Bendahara"
                value={financialSummary.treasurer}
                subtext="With treasurer - tap ✏ to edit"
                accentClass="from-blue-500 to-cyan-500"
                onSave={(val) => updateSummaryField('treasurer', val)}
              />
            </div>

            {/* ── Quick action buttons ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowExpenseForm(true)}
                className="glass p-8 text-center hover:bg-white/20 transition-colors rounded-2xl"
              >
                <Plus size={32} className="mx-auto mb-3 text-accent" />
                <p className="text-lg font-display font-bold text-white">Add Expense</p>
                <p className="text-sm text-white/60">Record class expenses with proof</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowIncomeForm(true)}
                className="glass p-8 text-center hover:bg-white/20 transition-colors rounded-2xl"
              >
                <Plus size={32} className="mx-auto mb-3 text-accent" />
                <p className="text-lg font-display font-bold text-white">Add Income</p>
                <p className="text-sm text-white/60">Record class income/collections</p>
              </motion.button>
            </div>

            {/* ── Recent activity ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-display font-bold text-white mb-4">Recent Expenses</h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{expense.name}</p>
                        <p className="text-xs text-white/50">{expense.category}</p>
                      </div>
                      <p className="text-accent font-bold">-Rp {expense.amount.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-display font-bold text-white mb-4">Recent Income</h3>
                <div className="space-y-3 max-h-96 overflow-auto">
                  {incomes.slice(0, 5).map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{income.name}</p>
                        <p className="text-xs text-white/50">{income.source}</p>
                      </div>
                      <p className="text-green-500 font-bold">+Rp {income.amount.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── EXPENSES TAB ── */}
        {activeTab === 'expenses' && (
          <motion.div variants={itemVariants}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">All Expenses</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExpenseForm(true)}
                  className="px-4 py-2 bg-accent text-dark-primary font-bold rounded-lg hover:shadow-lg transition-shadow"
                >
                  + Add Expense
                </motion.button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-auto">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{expense.name}</p>
                      <p className="text-xs text-white/50 truncate">{expense.description}</p>
                      {expense.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-xs rounded-full">
                          {expense.category}
                        </span>
                      )}
                    </div>
                    <p className="text-accent font-bold mx-4 shrink-0">
                      -Rp {expense.amount.toLocaleString('id-ID')}
                    </p>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors shrink-0"
                    >
                      <MoreVertical size={18} className="text-white/60" />
                    </button>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-8">No expenses recorded yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── INCOME TAB ── */}
        {activeTab === 'income' && (
          <motion.div variants={itemVariants}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-white">All Income</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowIncomeForm(true)}
                  className="px-4 py-2 bg-accent text-dark-primary font-bold rounded-lg hover:shadow-lg transition-shadow"
                >
                  + Add Income
                </motion.button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-auto">
                {incomes.map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{income.name}</p>
                      <p className="text-xs text-white/50 truncate">{income.description}</p>
                      {income.source && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
                          {income.source}
                        </span>
                      )}
                    </div>
                    <p className="text-green-500 font-bold mx-4 shrink-0">
                      +Rp {income.amount.toLocaleString('id-ID')}
                    </p>
                    <button
                      onClick={() => handleDeleteIncome(income.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors shrink-0"
                    >
                      <MoreVertical size={18} className="text-white/60" />
                    </button>
                  </div>
                ))}
                {incomes.length === 0 && (
                  <p className="text-white/40 text-sm text-center py-8">No income recorded yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <motion.div variants={itemVariants}>
            <StudentPaymentManager />
          </motion.div>
        )}

        {/* ── MODALS ── */}
        {showExpenseForm && (
          <ExpenseForm
            onClose={() => setShowExpenseForm(false)}
            onSubmit={handleAddExpense}
          />
        )}
        {showIncomeForm && (
          <IncomeForm
            onClose={() => setShowIncomeForm(false)}
            onSubmit={handleAddIncome}
          />
        )}
      </motion.div>
    </div>
  )
}