import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle,
  ExternalLink, Bell, BellOff, BellRing, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import {
  getNotificationPermission,
  subscribeToPush,
  isSubscribed,
} from '../lib/pushNotifications'
import DashboardCard from '../components/DashboardCard'
import PaymentStatusTable from '../components/PaymentStatusTable'
import TransactionList from '../components/TransactionList'

// ─── Helper ────────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const getProofUrl = (path) => {
  if (!path) return ''
  return `https://fxxjfkcjtuuxbrxhfrph.supabase.co/storage/v1/object/public/expense-proofs/${path}`
}

// ─── Notification Permission Card ─────────────────────────────────────────────
function NotificationCard({ studentId }) {
  // 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'
  const [status, setStatus] = useState('idle')

  const syncStatus = useCallback(async () => {
    const perm = getNotificationPermission()
    if (perm === 'unsupported') { setStatus('unsupported'); return }
    if (perm === 'denied')      { setStatus('denied'); return }
    if (perm === 'granted') {
      const sub = await isSubscribed()
      setStatus(sub ? 'granted' : 'default')
      return
    }
    setStatus('default') // permission === 'default' (not asked yet)
  }, [])

  useEffect(() => { syncStatus() }, [syncStatus])
const isPWA = window.matchMedia('(display-mode: standalone)').matches
const handleEnable = async () => {
  if (!studentId) return

  // kalau denied, buka pengaturan browser
  if (Notification.permission === 'denied') {
    alert(
      'Notifikasi diblokir.\n\nBuka pengaturan browser lalu izinkan notifikasi untuk website ini.'
    )
    return
  }

  setStatus('loading')

  try {
    await subscribeToPush(studentId)
    setStatus('granted')
  } catch (err) {
    console.error(err)

    if (Notification.permission === 'denied') {
      setStatus('denied')
    } else {
      setStatus('default')
    }
  }
}

  // ── Derived UI values ──────────────────────────────────────────────────────
  const isGranted     = status === 'granted'
  const isDenied      = status === 'denied'
  const isLoading     = status === 'loading'
  const isUnsupported = status === 'unsupported'
  const isDefault     = status === 'default' || status === 'idle'

  return (
    <div className="glass p-6 rounded-2xl relative overflow-hidden">
      {/* accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500
          ${isGranted ? 'from-green-400 to-emerald-500'
          : isDenied  ? 'from-red-400 to-rose-500'
          : 'from-white/20 to-white/10'}`}
      />

      <div className="flex items-center justify-between">
        {/* Left: icon + text */}
        <div className="flex items-center gap-4">
          <div className={`relative p-3 rounded-xl transition-colors duration-300
            ${isGranted ? 'bg-green-500/15' : isDenied ? 'bg-red-500/15' : 'bg-white/10'}`}>
            {isLoading ? (
              <Loader2 size={22} className="text-white/60 animate-spin" />
            ) : isGranted ? (
              <BellRing size={22} className="text-green-400" />
            ) : isDenied ? (
              <BellOff size={22} className="text-red-400" />
            ) : (
              <Bell size={22} className="text-white/60" />
            )}
          </div>

          <div>
            <p className="text-white font-semibold text-sm">Notifikasi</p>
            <p className={`text-xs mt-0.5 transition-colors duration-300
              ${isGranted ? 'text-green-400' : isDenied ? 'text-red-400' : 'text-white/40'}`}>
              {isLoading     ? 'Memproses...'
               : isGranted   ? 'Aktif - kamu akan menerima notifikasi'
               : isDenied    ? 'Ditolak - ubah di pengaturan browser'
               : isUnsupported ? 'Browser tidak mendukung notifikasi'
               : 'Belum diaktifkan'}
            </p>
          </div>
        </div>

        {/* Right: status badge + toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Status icon */}
          <motion.div
            key={status}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14 }}
          >
            {isGranted ? (
              <CheckCircle2 size={22} className="text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
            ) : isDenied ? (
              <XCircle size={22} className="text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]" />
            ) : null}
          </motion.div>

          {/* Aktifkan button - hanya muncul kalau belum granted/unsupported */}
          {!isUnsupported && !isGranted && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleEnable}
              disabled={isLoading || isDenied}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30"
            >
              {isLoading ? '...' : 'Aktifkan'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Denied helper */}
      {isDenied && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 text-xs text-white/30 leading-relaxed"
        >
          Browser memblokir notifikasi. Buka <strong>Pengaturan → Privasi → Notifikasi</strong> dan izinkan situs ini, lalu muat ulang halaman.
        </motion.p>
      )}
    </div>
  )
}

// ─── Income row ────────────────────────────────────────────────────────────────
function IncomeRow({ income }) {
  return (
    <div className="flex items-start justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
          <ArrowUpCircle size={18} className="text-green-400" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{income.name}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {income.source && (
              <span className="inline-block px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full">
                {income.source}
              </span>
            )}
            <span className="text-xs text-white/40">{formatDate(income.created_at)}</span>
          </div>
        </div>
      </div>
      <p className="text-green-400 font-bold shrink-0 pt-1">
        +Rp {income.amount.toLocaleString('id-ID')}
      </p>
    </div>
  )
}

// ─── Expense row ───────────────────────────────────────────────────────────────
function ExpenseRow({ expense, onClick }) {
  return (
    <button
      onClick={() => onClick(expense)}
      className="w-full flex items-start justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.01] gap-3 text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-accent/10 rounded-lg shrink-0">
          <ArrowDownCircle size={18} className="text-accent" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-medium truncate">{expense.name}</p>
          {expense.description && (
            <p className="text-xs text-white/50 truncate mt-0.5">{expense.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {expense.category && (
              <span className="inline-block px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-xs rounded-full">
                {expense.category}
              </span>
            )}
            <span className="text-xs text-white/40">{formatDate(expense.created_at)}</span>
          </div>
        </div>
      </div>
      <p className="text-accent font-bold shrink-0 pt-1">
        -Rp {expense.amount.toLocaleString('id-ID')}
      </p>
    </button>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [stats, setStats]                     = useState({ totalCash: 0, miniBank: 0, treasurer: 0 })
  const [transactions, setTransactions]       = useState([])
  const [paymentStatus, setPaymentStatus]     = useState([])
  const [unpaidStudents, setUnpaidStudents]   = useState([])
  const [incomes, setIncomes]                 = useState([])
  const [expenses, setExpenses]               = useState([])
  const [activeTab, setActiveTab]             = useState('overview')
  const [isLoading, setIsLoading]             = useState(true)
  const [studentName, setStudentName]         = useState('')
  const [studentId, setStudentId]             = useState(null)
  const [selectedExpense, setSelectedExpense] = useState(null)

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)

      const { data: studentRow } = await supabase
        .from('students')
        .select('id, name')
        .eq('id', user?.student_id)
        .maybeSingle()

      const sid  = studentRow?.id   ?? null
      const name = studentRow?.name ?? ''
      setStudentName(name)
      setStudentId(sid)

      const [
        finRes, transRes, paymentRes, studentsRes,
        monthlyPaymentsRes, incomeRes, expenseRes,
      ] = await Promise.all([
        supabase.from('financial_summary').select('*').single(),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10),
        sid
          ? supabase.from('payment_status').select('*').eq('student_id', sid).order('month', { ascending: true })
          : Promise.resolve({ data: [] }),
        supabase.from('students').select('id, name'),
        supabase.from('payment_status')
          .select('student_id, paid')
          .eq('month', new Date().getMonth() + 1)
          .eq('year', new Date().getFullYear()),
        supabase.from('income').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      ])

      const fetchedIncomes  = incomeRes.data  || []
      const fetchedExpenses = expenseRes.data || []
      const computedCash =
        fetchedIncomes.reduce((s, r) => s + (r.amount ?? 0), 0) -
        fetchedExpenses.reduce((s, r) => s + (r.amount ?? 0), 0)

      setStats({
        totalCash: computedCash,
        miniBank:  finRes.data?.mini_bank  ?? 0,
        treasurer: finRes.data?.treasurer  ?? 0,
      })
      setTransactions(transRes.data    || [])
      setPaymentStatus(paymentRes.data || [])

      const allStudents     = studentsRes.data       || []
      const monthlyPayments = monthlyPaymentsRes.data || []
      const unpaid = allStudents.filter((student) => {
        const payment = monthlyPayments.find((p) => p.student_id === student.id)
        return !payment || payment.paid === false
      })
      setUnpaidStudents(unpaid)
      setIncomes(fetchedIncomes)
      setExpenses(fetchedExpenses)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const totalIncome  = incomes.reduce((s, r)  => s + (r.amount ?? 0), 0)
  const totalExpense = expenses.reduce((s, r) => s + (r.amount ?? 0), 0)

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  }
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

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
            <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
            <p className="text-xs text-white/40 mt-0.5 tracking-wide">by nopal</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0">
              <span className="text-accent text-sm font-bold">
                {(studentName || user?.name || 'S').charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-white">
              {studentName || user?.name || 'Student'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Navigation tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
      >
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'overview', label: 'Overview'    },
            { key: 'income',   label: 'Pemasukan'   },
            { key: 'expenses', label: 'Pengeluaran' },
            { key: 'payments', label: 'Pembayaran'  },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === key ? 'bg-accent text-dark-primary' : 'glass hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8"
      >
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* ── Notification permission card ── */}
            <motion.div variants={itemVariants}>
              <NotificationCard studentId={studentId} />
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants}>
                <DashboardCard
                  icon={Wallet}
                  title="Total Kas Kelas"
                  value={`Rp ${stats.totalCash.toLocaleString('id-ID')}`}
                  subtext="Kas Akumulasi"
                  accentColor="from-accent to-accent-light"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  icon={TrendingUp}
                  title="Bank Mini"
                  value={`Rp ${stats.miniBank.toLocaleString('id-ID')}K`}
                  subtext="Uang yang berada di bank mini"
                  accentColor="from-green-500 to-emerald-500"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <DashboardCard
                  icon={TrendingDown}
                  title="Bendahara"
                  value={`Rp ${stats.treasurer.toLocaleString('id-ID')}K`}
                  subtext="Uang di bendahara"
                  accentColor="from-blue-500 to-cyan-500"
                />
              </motion.div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <TransactionList transactions={transactions} isLoading={isLoading} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <div className="glass p-6 rounded-2xl">
                  <h3 className="text-lg font-display font-bold text-white mb-4">Yang belum bayar bulan ini</h3>
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {unpaidStudents.length > 0 ? (
                      unpaidStudents.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <span className="text-white text-sm">{item.name}</span>
                          <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/50 text-red-200 text-xs rounded-full">❌ Unpaid</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/50 text-sm text-center py-6">Semua Sudah bayar! ✅</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div variants={itemVariants}>
              <PaymentStatusTable payments={paymentStatus} isLoading={isLoading} />
            </motion.div>
          </>
        )}

        {/* ── INCOME TAB ── */}
        {activeTab === 'income' && (
          <motion.div variants={itemVariants}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Pemasukan</h2>
                  <p className="text-sm text-white/50 mt-0.5">
                    {incomes.length} transaksi •{' '}
                    <span className="text-green-400">+Rp {totalIncome.toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <ArrowUpCircle size={24} className="text-green-400" />
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)
                  : incomes.length > 0
                    ? incomes.map((income) => <IncomeRow key={income.id} income={income} />)
                    : <p className="text-white/40 text-sm text-center py-10">Belum ada data pemasukan.</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── EXPENSES TAB ── */}
        {activeTab === 'expenses' && (
          <motion.div variants={itemVariants}>
            <div className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Pengeluaran</h2>
                  <p className="text-sm text-white/50 mt-0.5">
                    {expenses.length} transaksi •{' '}
                    <span className="text-accent">-Rp {totalExpense.toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <div className="p-3 bg-accent/10 rounded-xl">
                  <ArrowDownCircle size={24} className="text-accent" />
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />)
                  : expenses.length > 0
                    ? expenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} onClick={setSelectedExpense} />)
                    : <p className="text-white/40 text-sm text-center py-10">Belum ada data pengeluaran.</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <motion.div variants={itemVariants}>
            <PaymentStatusTable payments={paymentStatus} isLoading={isLoading} />
          </motion.div>
        )}
      </motion.div>

      {/* ── EXPENSE DETAIL MODAL ── */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg glass rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Detail Pengeluaran</h2>
                <p className="text-sm text-white/40 mt-1">Lihat bukti bayar dan detail transaksi</p>
              </div>
              <button
                onClick={() => setSelectedExpense(null)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {selectedExpense.proof_image_url && (
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={getProofUrl(selectedExpense.proof_image_url)}
                    alt="Bukti pembayaran"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <p className="text-white/40 text-sm">Nama Pengeluaran</p>
                  <p className="text-white font-semibold text-lg">{selectedExpense.name}</p>
                </div>
                <div>
                  <p className="text-white/40 text-sm">Jumlah Pengeluaran</p>
                  <p className="text-accent font-bold text-2xl">
                    -Rp {selectedExpense.amount.toLocaleString('id-ID')}
                  </p>
                </div>
                {selectedExpense.category && (
                  <div>
                    <p className="text-white/40 text-sm">Kategori</p>
                    <span className="inline-block mt-1 px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-sm">
                      {selectedExpense.category}
                    </span>
                  </div>
                )}
                {selectedExpense.description && (
                  <div>
                    <p className="text-white/40 text-sm">Deskripsi</p>
                    <p className="text-white/80 leading-relaxed">{selectedExpense.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-white/40 text-sm">Tanggal</p>
                  <p className="text-white">{formatDate(selectedExpense.created_at)}</p>
                </div>
              </div>

              <div className="pt-2">
                {selectedExpense.proof_image_url ? (
                  <a
                    href={getProofUrl(selectedExpense.proof_image_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 transition-all duration-200 text-black font-bold shadow-lg shadow-orange-500/20"
                  >
                    <ExternalLink size={18} />
                    Lihat Bukti Bayar
                  </a>
                ) : (
                  <button disabled className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 cursor-not-allowed">
                    Tidak Ada Bukti Pembayaran
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}