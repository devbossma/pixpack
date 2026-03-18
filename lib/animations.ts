export const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { ease: [0.25, 0.1, 0.25, 1] as const } },
}

export const cardEntrance = (index: number) => ({
  initial: { opacity: 0, scale: 0.93 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay: index * 0.06, ease: [0.34, 1.56, 0.64, 1] as const, duration: 0.45 },
  whileHover: { y: -3, transition: { duration: 0.18 } },
})

export const slideUp = {
  initial: { y: 80, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 80, opacity: 0 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 36 },
}
