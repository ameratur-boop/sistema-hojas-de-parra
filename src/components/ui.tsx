import { forwardRef } from 'react'
import { CANAL_COLOR, CANAL_LABEL, type Canal } from '@/lib/productos'
import { IconBorrar, IconEditar, IconSearch } from '@/components/icons'

type DivProps = React.HTMLAttributes<HTMLDivElement>

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

export function PageHeader({
  title,
  meta,
  children,
}: {
  title: string
  meta?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">{title}</h1>
        {meta && <p className="mt-1 text-sm text-ink-3">{meta}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

export function SectionHeader({
  title,
  meta,
  children,
}: {
  title: string
  meta?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {meta && <p className="text-sm text-ink-3">{meta}</p>}
      </div>
      {children}
    </div>
  )
}

export function Panel({ className = '', ...props }: DivProps) {
  return <div className={`rounded-lg border border-line bg-surface ${className}`} {...props} />
}

const btnVariants = {
  primary: 'bg-accent-strong text-white hover:brightness-110 active:brightness-95',
  secondary: 'border border-line bg-raised text-ink hover:bg-line/70 active:bg-line',
  ghost: 'text-ink-2 hover:bg-raised hover:text-ink active:bg-line/70',
  danger: 'text-ink-3 hover:bg-danger/10 hover:text-danger active:bg-danger/15',
}

const btnSizes = {
  md: 'h-10 px-3.5 text-sm sm:h-9',
  sm: 'h-9 px-2.5 text-[13px] sm:h-8',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof btnVariants
  size?: keyof typeof btnSizes
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 ${focusRing} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

const fieldBase =
  'w-full rounded-md border border-line bg-field px-3 text-sm text-ink placeholder:text-ink-3 transition-colors duration-150 hover:border-ink-3/50 focus:border-accent/70 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60'

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`${fieldBase} h-10 sm:h-9 ${className}`} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => (
  <textarea ref={ref} className={`${fieldBase} py-2 ${className}`} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = '', ...props }, ref) => (
  <select ref={ref} className={`${fieldBase} h-10 sm:h-9 ${className}`} {...props} />
))
Select.displayName = 'Select'

export function Field({
  label,
  htmlFor,
  hint,
  className = '',
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-2">
        {label}
        {hint && <span className="ml-1 font-normal text-ink-3">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  )
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 border-t border-line pt-4">{children}</div>
}

const badgeTones = {
  neutral: 'bg-raised text-ink-2',
  accent: 'bg-accent/10 text-accent',
  danger: 'bg-danger/10 text-danger',
  warn: 'bg-warn/10 text-warn',
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: keyof typeof badgeTones
}) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  )
}

export function CanalTag({ canal }: { canal: Canal }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-ink-2">
      <span aria-hidden className="size-2 rounded-full" style={{ background: CANAL_COLOR[canal] }} />
      {CANAL_LABEL[canal]}
    </span>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink-2">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-3">{children}</p>}
    </div>
  )
}

export function TableWrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-line bg-surface ${className}`}>
      <table className="w-full text-sm tabular-nums">{children}</table>
    </div>
  )
}

export function Th({
  num,
  className = '',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { num?: boolean }) {
  return (
    <th
      scope="col"
      className={`h-10 whitespace-nowrap border-b border-line bg-side/70 px-3 text-xs font-medium text-ink-3 sm:px-4 ${num ? 'text-right' : 'text-left'} ${className}`}
      {...props}
    />
  )
}

export function Td({
  num,
  className = '',
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { num?: boolean }) {
  return <td className={`px-3 py-3 align-middle sm:px-4 ${num ? 'whitespace-nowrap text-right' : ''} ${className}`} {...props} />
}

export const rowClass = 'border-b border-line/60 transition-colors duration-150 last:border-0 hover:bg-raised/40'

export function RowActions({ onEditar, onBorrar, que }: { onEditar?: () => void; onBorrar: () => void; que: string }) {
  const base = `grid size-9 place-items-center rounded-md text-ink-3 transition-colors duration-150 sm:size-8 ${focusRing}`
  return (
    <div className="flex justify-end gap-0.5">
      {onEditar && (
        <button type="button" onClick={onEditar} aria-label={`Editar ${que}`} title="Editar" className={`${base} hover:bg-raised hover:text-ink`}>
          <IconEditar />
        </button>
      )}
      <button type="button" onClick={onBorrar} aria-label={`Eliminar ${que}`} title="Eliminar" className={`${base} hover:bg-danger/10 hover:text-danger`}>
        <IconBorrar />
      </button>
    </div>
  )
}

export const linkClass = `rounded-sm font-medium text-ink transition-colors hover:text-accent ${focusRing}`

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line bg-field p-0.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`h-9 rounded-[5px] px-3 text-[13px] font-medium transition-colors duration-150 sm:h-8 ${focusRing} ${
              active ? 'bg-raised text-ink shadow-sm shadow-black/30' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative w-full sm:w-64">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
      <Input type="search" className="pl-9" {...props} />
    </div>
  )
}
