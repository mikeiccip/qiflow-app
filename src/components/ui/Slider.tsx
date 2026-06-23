import { cn } from '@/lib/utils'

interface SliderProps {
  label: string
  name: string
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  hint?: string
  valueLabel?: (value: number) => string
  className?: string
}

export default function Slider({ label, name, min, max, value, onChange, hint, valueLabel, className }: SliderProps) {
  const displayValue = valueLabel ? valueLabel(value) : String(value)
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        <span className="text-sm font-semibold text-primary w-8 text-right">{displayValue}</span>
      </div>
      <input
        id={name}
        name={name}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-gray-200 accent-primary cursor-pointer"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}
