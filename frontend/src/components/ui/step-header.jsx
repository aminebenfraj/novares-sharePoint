import React from 'react';
import { motion } from 'framer-motion';

export function StepHeader({ title, currentStep, totalSteps }) {
  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <span className="px-3 py-1 text-sm font-medium rounded-full bg-muted">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 mt-4 overflow-hidden rounded-full bg-muted">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
