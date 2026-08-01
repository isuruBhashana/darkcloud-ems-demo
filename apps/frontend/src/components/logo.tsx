interface LogoProps {
  height?: number;
  alt?: string;
}

export function Logo({ height = 40, alt = 'Project Darkcloud' }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      style={{
        height: `${height}px`,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}
