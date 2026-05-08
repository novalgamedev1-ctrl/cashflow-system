import { motion } from 'framer-motion'

export default function DashboardCard({
  icon: Icon,
  title,
  value,
  subtext,
  accentColor = 'from-accent to-accent-light',
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="glass p-6 rounded-2xl hover:border-accent/50 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${accentColor} group-hover:shadow-lg transition-shadow`}>
          <Icon size={24} className="text-dark-primary" />
        </div>
      </div>

      <p className="text-white/70 text-sm font-medium mb-2">{title}</p>
      <p className="text-3xl font-display font-bold text-white mb-2">{value}</p>
      <p className="text-xs text-white/50">{subtext}</p>
    </motion.div>
  )
}