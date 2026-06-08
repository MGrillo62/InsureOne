import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrokerSync - SaaS de Corretaje de Seguros',
  description: 'Sistema integral de control de pólizas, vencimientos, cobranzas y comisiones para corredores de seguros.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
