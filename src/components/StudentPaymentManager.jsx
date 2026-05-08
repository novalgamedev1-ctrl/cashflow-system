import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function StudentPaymentManager() {
  const [students, setStudents] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [payments, setPayments] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPaymentData()
  }, [selectedMonth])

  const fetchPaymentData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch students
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true })

      // Fetch payment status for selected month
      const { data: paymentData } = await supabase
        .from('payment_status')
        .select('*')
        .eq('month', selectedMonth)

      setStudents(studentData || [])
      
      // Create payment map
      const paymentMap = {}
      paymentData?.forEach((p) => {
        paymentMap[p.student_id] = p
      })
      setPayments(paymentMap)
    } catch (err) {
      console.error('Failed to fetch payment data:', err)
    } finally {
      setIsLoading(false)
    }
  }

const handleTogglePayment = async (
  studentId,
  studentName,
  currentStatus
) => {
  try {
    const payment = payments[studentId]

    // =========================
    // SET PAID
    // =========================
    if (!currentStatus) {
      // Update/Create payment_status
      if (payment) {
        await supabase
          .from('payment_status')
          .update({
            paid: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
      } else {
        await supabase
          .from('payment_status')
          .insert([
            {
              student_id: studentId,
              month: selectedMonth,
              year: new Date().getFullYear(),
              paid: true,
              updated_at: new Date().toISOString(),
            },
          ])
      }

      // Insert income otomatis
      await supabase
        .from('income')
        .insert([
          {
            name: studentName,
            amount: 10000,
            source: 'Student Contributions',
            description: '',
            created_at: new Date().toISOString(),
          },
        ])
    }

    // =========================
    // SET UNPAID
    // =========================
    else {
      // Update payment_status
      if (payment) {
        await supabase
          .from('payment_status')
          .update({
            paid: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
      }

      // Hapus income terkait
      await supabase
        .from('income')
        .delete()
        .eq('name', studentName)
        .eq('amount', 10000)
        .eq('source', 'Student Contributions')
    }

    fetchPaymentData()
  } catch (err) {
    console.error('Failed to update payment status:', err)
  }
}
  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-white">
          Manage Student Payments
        </h2>

        {/* Month selector */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-4 py-2 glass text-white focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg"
        >
          {MONTHS.map((month, idx) => (
            <option key={month} value={idx + 1} className="bg-dark-primary">
              {month}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-auto">
          {students.map((student) => {
            const payment = payments[student.id]
            const isPaid = payment?.paid || false

            return (
              <motion.div
                key={student.id}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div>
                  <p className="text-white font-medium">{student.name}</p>
                  <p className="text-xs text-white/50">Student ID: {student.id}</p>
                </div>

                <button
                  onClick={() =>
  handleTogglePayment(student.id, student.name, isPaid)
}
                  className={`p-3 rounded-lg transition-all ${
                    isPaid
                      ? 'bg-green-500/20 hover:bg-green-500/30 text-green-500'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-500'
                  }`}
                  title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                >
                  {isPaid ? (
                    <Check size={20} />
                  ) : (
                    <X size={20} />
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {!isLoading && students.length === 0 && (
        <p className="text-center text-white/50 py-8">
          No students found
        </p>
      )}

      {/* Legend */}
      <div className="flex gap-6 mt-8 pt-6 border-t border-accent/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-white/70">Bayar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm text-white/70">Belum Bayar</span>
        </div>
      </div>
    </div>
  )
}