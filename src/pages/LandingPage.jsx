import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-dark-primary">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1600&h=900&fit=crop)',
          filter: 'brightness(0.4) blur(4px)',
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Logo/Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 glass">
            <div className="text-2xl font-display font-bold text-accent">₭</div>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-4">
            <span className="text-gradient">CashFlow</span>
            <span className="block text-white mt-2">System by Kazuto</span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-white/70 max-w-2xl mb-12 font-light"
        >
          Manage your class cash flow efficiently. Track income, expenses, and student payments in one beautiful dashboard.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255, 165, 0, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/login')}
          className="relative px-10 py-4 bg-gradient-to-r from-accent to-accent-light text-dark-primary font-display font-bold text-lg rounded-full flex items-center gap-3 hover:shadow-lg transition-shadow duration-300 group"
        >
          Get Started
          <motion.div
            className="relative"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight size={20} />
          </motion.div>
        </motion.button>

        {/* Divider */}
        <motion.div variants={itemVariants} className="mt-16 flex items-center gap-4">
          <div className="w-12 h-px bg-white/20" />
          <p className="text-sm text-white/50">X TKJ A</p>
          <div className="w-12 h-px bg-white/20" />
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="absolute bottom-8 text-xs text-white/40"
        >
          A modern financial management system for your class
        </motion.p>
      </motion.div>

      {/* Floating elements */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-20 right-10 w-32 h-32 glass rounded-3xl opacity-10"
      />
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        className="absolute bottom-20 left-10 w-40 h-40 glass rounded-full opacity-5"
      />
    </div>
  )
}