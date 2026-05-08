import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  'Transportation',
  'Supplies',
  'Activities',
  'Food & Beverages',
  'Equipment',
  'Utilities',
  'Other'
]

export default function ExpenseForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: CATEGORIES[0],
    description: '',
  })
  const [proofImage, setProofImage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofImage(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.amount || !proofImage) {
      setError('Please fill all fields and upload proof image')
      return
    }

    setIsSubmitting(true)
    try {
      // Upload proof image to Supabase Storage
      const fileName = `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('expense-proofs')
        .upload(`${fileName}`, proofImage)

      if (uploadError) throw uploadError

      // Create expense record
      const expenseData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        proof_image_url: uploadData.path,
        created_at: new Date().toISOString(),
      }

      await onSubmit(expenseData)
    } catch (err) {
      setError(`Failed to add expense: ${err.message}`)
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
          <h2 className="text-2xl font-display font-bold text-white">Add Expense</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Expense Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Expense Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Class Trip Transportation"
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

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 glass text-white focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-dark-primary">
                  {cat}
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
              placeholder="Add details about this expense"
              rows="2"
              className="w-full px-4 py-2.5 glass text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Proof Image *
            </label>
            <label className="flex items-center justify-center w-full px-4 py-3 glass rounded-lg cursor-pointer hover:bg-white/10 transition-colors border-2 border-dashed border-accent/30">
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload size={24} className="text-accent" />
                <span className="text-sm text-white">
                  {proofImage ? proofImage.name : 'Click to upload image'}
                </span>
              </div>
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </label>
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
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}