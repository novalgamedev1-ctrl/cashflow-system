import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ChevronDown } from 'lucide-react'
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
  const [checkedStudents, setCheckedStudents] = useState(new Set())
  const [pendingChanges, setPendingChanges] = useState({})
  const [isSaving, setIsSaving] = useState(false)

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

  // Toggle checkbox
  const handleCheckboxChange = (studentId, studentName, currentStatus) => {
    const newChecked = new Set(checkedStudents)
    
    if (newChecked.has(studentId)) {
      newChecked.delete(studentId)
      const newPending = { ...pendingChanges }
      delete newPending[studentId]
      setPendingChanges(newPending)
    } else {
      newChecked.add(studentId)
      setPendingChanges({
        ...pendingChanges,
        [studentId]: {
          studentId,
          studentName,
          willBePaid: !currentStatus,
        },
      })
    }
    
    setCheckedStudents(newChecked)
  }

  // Save all changes to database
  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return

    setIsSaving(true)
    try {
      // Process each pending change
      for (const [studentId, change] of Object.entries(pendingChanges)) {
        const payment = payments[studentId]
        const { willBePaid, studentName } = change

        if (willBePaid) {
          // Update/Create payment_status to PAID
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
                name: `${studentName} - ${MONTHS[selectedMonth - 1]} Payment`,
                amount: 10000,
                source: 'Student Contributions',
                description: `Payment from ${studentName}`,
                created_at: new Date().toISOString(),
              },
            ])
        } else {
          // Update payment_status to UNPAID
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
            .ilike('name', `%${studentName}%`)
            .eq('amount', 10000)
        }
      }

      // Reset states
      setCheckedStudents(new Set())
      setPendingChanges({})
      
      // Refresh data
      await fetchPaymentData()
    } catch (err) {
      console.error('Failed to save payment changes:', err)
      alert('Gagal menyimpan perubahan. Silakan coba lagi.')
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel all changes
  const handleCancel = () => {
    setCheckedStudents(new Set())
    setPendingChanges({})
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
        <div className={`space-y-3 ${checkedStudents.size > 0 ? 'pb-32' : ''}`}>
          {students.map((student) => {
            const payment = payments[student.id]
            const isPaid = payment?.paid || false
            const isChecked = checkedStudents.has(student.id)
            const hasPending = pendingChanges[student.id]

            return (
              <motion.div
                key={student.id}
                layout
                className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-accent/20 border border-accent/50'
                    : 'bg-white/5 hover:bg-white/10'
                } group`}
                onClick={() =>
                  handleCheckboxChange(student.id, student.name, isPaid)
                }
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Checkbox */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        handleCheckboxChange(student.id, student.name, isPaid)
                      }
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-accent border-accent'
                          : 'border-white/30 hover:border-accent'
                      }`}
                    >
                      {isChecked && <Check size={16} className="text-dark-primary" />}
                    </button>
                  </motion.div>

                  {/* Student info */}
                  <div>
                    <p className="text-white font-medium">{student.name}</p>
                    <p className="text-xs text-white/50">
                      {hasPending ? (
                        <span className="text-accent">
                          {hasPending.willBePaid ? '→ Will change to: Bayar' : '→ Will change to: Belum Bayar'}
                        </span>
                      ) : (
                        `Current: ${isPaid ? '✓ Bayar' : '✗ Belum Bayar'}`
                      )}
                    </p>
                  </div>
                </div>

                {/* Current status badge */}
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isPaid
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isPaid ? '✓ Bayar' : '✗ Belum Bayar'}
                </div>
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

      {/* Bottom pop-up with save button */}
      <AnimatePresence>
        {checkedStudents.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-dark-secondary/95 backdrop-blur-md border-t border-accent/30 shadow-2xl z-50"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
              {/* Left side - info */}
              <div>
                <p className="text-white font-semibold">
                  {checkedStudents.size} student{checkedStudents.size !== 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-white/60 mt-1">
                  {Object.values(pendingChanges).filter(p => p.willBePaid).length} akan Bayar,{' '}
                  {Object.values(pendingChanges).filter(p => !p.willBePaid).length} akan Belum Bayar
                </p>
              </div>

              {/* Right side - buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-6 py-3 glass text-white font-semibold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="px-8 py-3 bg-gradient-to-r from-accent to-accent-light text-dark-primary font-display font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-4 h-4 border-2 border-dark-primary border-t-transparent rounded-full"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}