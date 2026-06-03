type LogoProps = {
  className?: string
}

export function Logo({ className = 'h-10 w-auto' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="InvoiceFi"
      className={className}
      width={120}
      height={40}
      decoding="async"
    />
  )
}
