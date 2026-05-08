import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function TransactionList({ transactions, isLoading }) {
  return (
    <div className="glass p-6 rounded-2xl">
      <h3 className="text-lg font-display font-bold text-white mb-6">
        Transaksi Terakhir
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-auto">
          {transactions.map((tx, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`p-3 rounded-lg ${
                    tx.type === 'income'
                      ? 'bg-green-500/20'
                      : 'bg-red-500/20'
                  }`}
                >
                  {tx.type === 'income' ? (
                    <TrendingUp size={20} className="text-green-500" />
                  ) : (
                    <TrendingDown size={20} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{tx.name}</p>
                  <p className="text-xs text-white/50">{tx.category}</p>
                </div>
              </div>
              <span
                className={`text-lg font-bold whitespace-nowrap ${
                  tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}Rp {Math.abs(tx.amount).toLocaleString('id-ID')}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-white/50 py-8">
          No transactions yet
        </p>
      )}
    </div>
  )
}