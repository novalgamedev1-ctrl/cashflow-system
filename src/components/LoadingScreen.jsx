import { motion } from 'framer-motion'

export default function LoadingScreen() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delayChildren: 0.2,
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const loaderVariants = {
    animate: {
      scaleY: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-8 right-1/4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-8"
      >
        {/* Main Title */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-2 bg-gradient-to-r from-accent via-orange-400 to-accent bg-clip-text text-transparent">
            System Loading
          </h1>
          <p className="text-sm md:text-base text-white/60 font-light">
            CashFlow TKJ A by Kazuto
          </p>
        </motion.div>

        {/* Loading bars */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-end gap-1.5 h-12"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              variants={loaderVariants}
              animate="animate"
              transition={{ delay: i * 0.1 }}
              className="w-1.5 bg-gradient-to-t from-accent to-accent-light rounded-full"
              style={{ height: `${20 + i * 10}px` }}
            />
          ))}
        </motion.div>

        {/* Loading text */}
        <motion.div
          variants={itemVariants}
          className="mt-8 text-white/50 text-sm font-light tracking-wider"
        >
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Initializing...
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Glass effect border */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute inset-0 pointer-events-none border border-accent/10 rounded-3xl m-auto max-w-2xl h-80"
      />
    </div>
  )
}