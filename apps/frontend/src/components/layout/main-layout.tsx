import type React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function MainLayout({ title, subtitle, children }: MainLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title={title} subtitle={subtitle} />
        <main style={{ padding: '0 32px 40px 32px', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
