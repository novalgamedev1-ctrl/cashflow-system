import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const SOURCES = [
  'Student Contributions',
  'Class Cash',
  'School Event',
  'Fundraising',
  'Bank Interest',
  'Other'
]

export default function IncomeForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    source: SOURCES[0],
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.amount) {
      setError('Please fill all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const incomeData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        source: formData.source,
        description: formData.description,
        created_at: new Date().toISOString(),
      }

      await onSubmit(incomeData)
    } catch (err) {
      setError(`Failed to add income: ${err.message}`)
      console.error('Error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass p-8 rounded-2xl max-w-lg w-full max-h-96 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold text-white">Add Income</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Income Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Income Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Monthly Class Contribution"
              className="w-full px-4 py-2.5 glass text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Amount (Rp)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-2.5 glass text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Source
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-2.5 glass text-white focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg appearance-none cursor-pointer"
            >
              {SOURCES.map((source) => (
                <option key={source} value={source} className="bg-dark-primary">
                  {source}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details about this income"
              rows="2"
              className="w-full px-4 py-2.5 glass text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 glass rounded-lg text-white hover:bg-white/10 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent to-accent-light text-dark-primary rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Income'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}