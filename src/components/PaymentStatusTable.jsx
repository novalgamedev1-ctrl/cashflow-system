import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function PaymentStatusTable({ payments, isLoading }) {
  const getPaymentStatus = (month) => {
    const payment = payments.find(p => p.month === month)
    return payment?.paid || false
  }

  return (
    <div className="glass p-6 rounded-2xl">
      <h3 className="text-lg font-display font-bold text-white mb-6">
        Status Pembayaran - 2026
      </h3>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {MONTHS.map((month, idx) => {
            const isPaid = getPaymentStatus(idx + 1)
            return (
              <motion.div
                key={month}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-lg text-center cursor-pointer transition-all ${
                  isPaid
                    ? 'bg-green-500/20 border border-green-500/50'
                    : 'bg-red-500/20 border border-red-500/50 hover:bg-red-500/30'
                }`}
              >
                <p className="text-xs font-medium text-white/80 mb-2">
                  {month.substring(0, 3)}
                </p>
                <div className={`flex justify-center ${isPaid ? 'text-green-500' : 'text-red-500'}`}>
                  {isPaid ? <Check size={20} /> : <X size={20} />}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 mt-8 pt-6 border-t border-accent/10">
        <div className="flex items-center gap-2">
          <Check size={18} className="text-green-500" />
          <span className="text-sm text-white/70">Sudah Bayar</span>
        </div>
        <div className="flex items-center gap-2">
          <X size={18} className="text-red-500" />
          <span className="text-sm text-white/70">Belum Bayar</span>
        </div>
      </div>
    </div>
  )
}