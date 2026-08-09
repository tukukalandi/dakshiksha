import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingBackButton } from './FloatingBackButton';
import { Breadcrumbs } from './Breadcrumbs';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAppViewer = location.pathname.startsWith('/my-apps/') && location.pathname !== '/my-apps';

  return (
    <div className="flex min-h-screen flex-col">
      {!isAppViewer && (
        <>
          <Navbar />
          <Breadcrumbs />
          <FloatingBackButton />
        </>
      )}
      <main className={isAppViewer ? "h-screen flex flex-col" : "flex-grow"}>
        {children}
      </main>
      {!isAppViewer && <Footer />}
    </div>
  );
}
