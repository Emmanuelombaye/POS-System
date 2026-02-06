import { motion } from "framer-motion";

interface LogoLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export const LogoLoader = ({ label = "Loading...", size = "md" }: LogoLoaderProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-brand-gold/40"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border border-brand-burgundy/30"
        />
        <div className={`relative ${sizeMap[size]} rounded-full bg-white shadow-lg ring-2 ring-brand-gold/40 flex items-center justify-center overflow-hidden`}>
          <img
            src="/logo.png"
            alt="Eden Drop 001"
            className="h-3/4 w-3/4 object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
            }}
          />
          <span className="absolute text-sm font-black text-brand-charcoal">ED</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-xs font-black uppercase tracking-[0.3em] text-gray-400"
      >
        {label}
      </motion.div>
    </div>
  );
};
