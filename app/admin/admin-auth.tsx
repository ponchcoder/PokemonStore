'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, LayoutDashboard, LogOut, PackagePlus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type AdminGuardProps = {
  children: (context: {
    supabase: SupabaseClient;
    signOut: () => Promise<void>;
  }) => ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const supabase = useMemo(() => getSupabase(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const checkSession = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    setIsLoggedIn(Boolean(data.session));

    if (!data.session) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    const { data: adminResult, error } = await supabase.rpc('is_admin');
    setIsAdmin(!error && adminResult === true);
    setIsLoading(false);
  };

  useEffect(() => {
    checkSession().catch((error) => {
      setMessage(error instanceof Error ? error.message : 'Failed to load admin session');
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    setMessage('');
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await checkSession();
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
  };

  if (!supabase) {
    return (
      <CenterShell>
        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-sm text-zinc-200 shadow-xl shadow-black/40">
          Supabase environment variables are not configured.
        </div>
      </CenterShell>
    );
  }

  if (isLoading) {
    return (
      <CenterShell>
        <div className="flex items-center gap-3 text-sm text-zinc-300">
          <span className="size-2 animate-pulse rounded-full bg-purple-400" />
          Loading admin console…
        </div>
      </CenterShell>
    );
  }

  if (!isLoggedIn) {
    return (
      <CenterShell>
        <form onSubmit={signIn} className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/85 shadow-2xl shadow-black/60 backdrop-blur">
          <div className="border-b border-white/5 bg-gradient-to-br from-purple-600/15 via-purple-700/5 to-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-200 ring-1 ring-purple-500/30">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-purple-300/80">Pokemon Store</p>
                <h1 className="text-xl font-semibold text-white">Admin Sign In</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-400">Use your Supabase admin account. Only allow-listed accounts can manage inventory.</p>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-zinc-200">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10 border-white/10 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus-visible:ring-purple-500/40"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-zinc-200">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 border-white/10 bg-zinc-950/60 text-white placeholder:text-zinc-500 focus-visible:ring-purple-500/40"
                placeholder="••••••••"
              />
            </div>
            {message && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-200">{message}</p>
            )}
            <Button disabled={submitting} className="h-10 w-full bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60">
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </div>
        </form>
      </CenterShell>
    );
  }

  if (!isAdmin) {
    return (
      <CenterShell>
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-center shadow-xl shadow-black/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300 ring-1 ring-red-500/30">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Not Authorized</h1>
          <p className="mt-2 text-sm text-zinc-400">You are signed in, but this account is not on the admin allowlist.</p>
          <Button onClick={signOut} className="mt-5 h-10 w-full bg-purple-600 text-white hover:bg-purple-500">
            <LogOut className="size-4" /> Sign Out
          </Button>
        </div>
      </CenterShell>
    );
  }

  return <>{children({ supabase, signOut })}</>;
}

function CenterShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0712] p-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.18),_transparent_60%)]" />
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}

export function AdminShell({
  title,
  description,
  action,
  onSignOut,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#0b0712] text-white">
      <AdminTopBar onSignOut={onSignOut} />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:mb-8 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            {description ? <p className="mt-1 text-sm text-zinc-400 md:text-base">{description}</p> : null}
          </div>
          {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
        </div>
        {children}
      </div>
    </main>
  );
}

function AdminTopBar({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/add', label: 'Add', icon: PackagePlus },
    { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0712]/85 backdrop-blur supports-[backdrop-filter]:bg-[#0b0712]/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 text-purple-200 ring-1 ring-purple-500/30">
            <ShieldCheck className="size-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">Pokemon Store</span>
            <span className="text-sm font-semibold text-white">Admin Console</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Button
          onClick={onSignOut}
          variant="ghost"
          className="h-9 gap-2 px-3 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-purple-600/15 text-white ring-1 ring-purple-500/30'
          : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white',
      )}
    >
      <Icon className="size-4" />
      {children}
    </Link>
  );
}
