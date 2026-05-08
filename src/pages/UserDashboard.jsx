import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Eye, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import DashboardCard from '../components/DashboardCard'
import PaymentStatusTable from '../components/PaymentStatusTable'
import TransactionList from '../components/TransactionList'

export default function UserDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState({
    totalCash: 0,
    miniBank: 0,
    treasurer: 0,
  })
  const [transactions, setTransactions] = useState([])
  const [paymentStatus, setPaymentStatus] = useState([])
  const [unpaidStudents, setUnpaidStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch financial data
      const { data: finData } = await supabase
        .from('financial_summary')
        .select('*')
        .single()

      // Fetch recent transactions
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch payment status
      const { data: paymentData } = await supabase
        .from('payment_status')
        .select('*')
        .eq('student_id', user?.id)
        .order('month', { ascending: true })

      // Fetch unpaid students for current month
      const { data: unpaidData } = await supabase
        .from('payment_status')
        .select('students(name, id)')
        .eq('paid', false)
        .eq('month', new Date().getMonth() + 1)

      setStats({
        totalCash: finData?.total_cash || 0,
        miniBank: finData?.mini_bank || 0,
        treasurer: finData?.treasurer || 0,
      })
      setTransactions(transData || [])
      setPaymentStatus(paymentData || [])
      setUnpaidStudents(unpaidData || [])
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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
            <h1 className="text-2xl font-display font-bold text-white">
              Dashboard
            </h1>
            <p className="text-sm text-white/60">{user?.name || 'Student'}</p>
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

      {/* Main content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants}>
            <DashboardCard
              icon={Wallet}
              title="Total Class Cash"
              value={`Rp ${stats.totalCash.toLocaleString('id-ID')}`}
              subtext="Available funds"
              accentColor="from-accent to-accent-light"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <DashboardCard
              icon={TrendingUp}
              title="Mini Bank"
              value={`Rp ${stats.miniBank.toLocaleString('id-ID')}`}
              subtext="Savings account"
              accentColor="from-green-500 to-emerald-500"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <DashboardCard
              icon={TrendingDown}
              title="Treasurer"
              value={`Rp ${stats.treasurer.toLocaleString('id-ID')}`}
              subtext="With treasurer"
              accentColor="from-blue-500 to-cyan-500"
            />
          </motion.div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent transactions */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <TransactionList transactions={transactions} isLoading={isLoading} />
          </motion.div>

          {/* Unpaid students */}
          <motion.div variants={itemVariants}>
            <div className="glass p-6">
              <h3 className="text-lg font-display font-bold text-white mb-4">
                Unpaid This Month
              </h3>
              <div className="space-y-3 max-h-96 overflow-auto">
                {unpaidStudents.length > 0 ? (
                  unpaidStudents.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-white text-sm">
                        {item.students?.name}
                      </span>
                      <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/50 text-red-200 text-xs rounded-full">
                        ❌ Unpaid
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-white/50 text-sm text-center py-6">
                    All paid! ✅
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Payment status table */}
        <motion.div variants={itemVariants}>
          <PaymentStatusTable payments={paymentStatus} isLoading={isLoading} />
        </motion.div>
      </motion.div>
    </div>
  )
}