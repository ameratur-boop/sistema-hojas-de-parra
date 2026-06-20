import { forwardRef } from 'react'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: DivProps) {
  return (
    <div
      className={`rounded-xl border border-slate-700 bg-slate-800 shadow-sm ${className}`}
      {...props}
    />
  )
}

export function CardHeader({ className = '', ...props }: DivProps) {
  return <div className={`px-5 pt-5 pb-3 ${className}`} {...props} />
}

export function CardTitle({ className = '', ...props }: DivProps) {
  return <h2 className={`text-base font-semibold text-slate-100 ${className}`} {...props} />
}

export function CardBody({ className = '', ...props }: DivProps) {
  return <div className={`px-5 pb-5 ${className}`} {...props} />
}

const btnVariants: Record<string, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500',
  secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  ghost: 'text-slate-300 hover:bg-slate-700',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariants
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${btnVariants[variant]} ${className}`}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

const fieldBase =
  'w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`${fieldBase} ${className}`} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => (
  <textarea ref={ref} className={`${fieldBase} ${className}`} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = '', ...props }, ref) => (
  <select ref={ref} className={`${fieldBase} ${className}`} {...props} />
))
Select.displayName = 'Select'

export function Label({ className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`mb-1 block text-sm font-medium text-slate-300 ${className}`} {...props} />
  )
}

export function Badge({
  children,
  color = 'slate',
}: {
  children: React.ReactNode
  color?: 'slate' | 'red' | 'green' | 'amber'
}) {
  const colors = {
    slate: 'bg-slate-700 text-slate-200',
    red: 'bg-red-500/15 text-red-300',
    green: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-600 bg-slate-800 px-6 py-12 text-center text-sm text-slate-400">
      {children}
    </div>
  )
}
