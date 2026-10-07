type IconProps = React.SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconInicio = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
  </Svg>
)

export const IconPedidos = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5h12a1 1 0 0 1 1 1V20l-2.5-1.5L14 20l-2-1.5L10 20l-2.5-1.5L5 20V4.5a1 1 0 0 1 1-1Z" />
    <path d="M9 8.5h6M9 12h6" />
  </Svg>
)

export const IconClientes = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 19.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
    <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18.2 14.8c1.6.8 2.8 2.5 3.3 4.7" />
  </Svg>
)

export const IconGastos = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2.5" />
    <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3.5M4 7.5A1 1 0 0 0 5 8.5h14a1 1 0 0 1 1 1V12" />
    <path d="M20 12h-4a2 2 0 0 0 0 4h4z" />
  </Svg>
)

export const IconProductos = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7.5 12 3.5l8 4v9l-8 4-8-4z" />
    <path d="m4 7.5 8 4 8-4M12 11.5v9" />
  </Svg>
)

export const IconAnaliticas = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h16" />
    <path d="M7 16.5v-5M12 16.5V6M17 16.5v-8" />
  </Svg>
)

export const IconPlus = (p: IconProps) => (
  <Svg width={16} height={16} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const IconSearch = (p: IconProps) => (
  <Svg width={16} height={16} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Svg>
)

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const IconEditar = (p: IconProps) => (
  <Svg width={16} height={16} {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </Svg>
)

export const IconBorrar = (p: IconProps) => (
  <Svg width={16} height={16} {...p}>
    <path d="M4.5 7h15M10 11v6M14 11v6" />
    <path d="M6 7l1 12a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 19l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
)

export const IconChevronLeft = (p: IconProps) => (
  <Svg width={16} height={16} {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Svg>
)
