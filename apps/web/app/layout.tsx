import type { ReactNode } from 'react';

export const metadata = {
  title: 'Iralink Agency Watch',
  description: "Plateforme d'opportunités d'achat horlogères"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
