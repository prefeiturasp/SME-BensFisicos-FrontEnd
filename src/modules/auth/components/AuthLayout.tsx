interface AuthLayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className='min-h-screen flex'>
      {/* Lado esquerdo - Imagem */}
      <div className='hidden lg:flex lg:w-2/3 relative'>
        <div
          className='absolute inset-0 bg-cover bg-center'
          style={{ backgroundImage: "url('/login_background.png')" }}
        />
      </div>

      {/* Lado direito - Formulário */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-8 bg-white mt-8'>
        <div className='w-full max-w-md'>
          {/* Logo Bens Físicos */}
          <div className='flex items-center gap-3 mb-12'>
            <img
              src='/bens_logo_padrao.png'
              alt='Logo Bens Físicos'
              className='h-20 w-auto object-contain'
            />
            <div className='w-57.5'>
              <div>{title}</div>
              {subtitle && <div>{subtitle}</div>}
            </div>
          </div>

          {/* Conteúdo */}
          {children}

          {/* Logo Prefeitura no rodapé */}
          <div className='mt-20 flex justify-center'>
            <img
              src='/prefeitura_logo_padrao.png'
              alt='Prefeitura de São Paulo'
              className='h-17.25 w-auto object-contain'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
