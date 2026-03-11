'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
import { Logo } from '@/components/Logo'
import { BarChart2, Shield, Settings, User, LogOut, ChevronDown, Trophy, Sun, Moon, ClipboardList, Home } from 'lucide-react'
import { useTheme } from 'next-themes'

import { isAdmin } from '@/lib/admin'

export function Navbar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [isAdminUser, setIsAdminUser] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const supabase = createClient()
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            
            if (session?.user) {
                const adminStatus = await isAdmin(session.user.id)
                setIsAdminUser(adminStatus)
            }
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                isAdmin(session.user.id).then(setIsAdminUser)
            } else {
                setIsAdminUser(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    const desktopRoutes = [
        { href: '/scout/match', label: 'Match Scout', icon: Trophy },
        { href: '/scout/pit', label: 'Pit Scout', icon: ClipboardList },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    ]

    const mobileRoutes = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/scout', label: 'Scouting', icon: Trophy },
        { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    ]

    return (
        <>
            {/* Desktop Nav */}
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 hidden md:block">
                <div className="container flex h-16 items-center px-4 mx-auto">
                    <div className="mr-4 flex">
                        <Link href="/" className="mr-6 flex items-center space-x-2">
                            <Logo width={140} height={40} />
                        </Link>
                        <nav className="flex items-center space-x-8 text-sm font-medium">
                            {desktopRoutes.map((route) => (
                                <Link
                                    key={route.href}
                                    href={route.href}
                                    className={cn(
                                        "transition-colors hover:text-foreground/80",
                                        pathname === route.href ? "text-foreground" : "text-foreground/60"
                                    )}
                                >
                                    {route.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                <div className="flex flex-1 items-center justify-end space-x-2 ml-4">
                    {!user && <ModeToggle />}
                    {user ? (
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <User className="h-5 w-5" />
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    ) : (
                        <Link href="/login">
                            <Button variant="default" size="sm">Login</Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>

        {/* User Menu Dropdown - works for both desktop and mobile */}
        {showUserMenu && user && (
            <div className="fixed right-4 bottom-20 md:bottom-auto md:top-16 w-48 bg-background border rounded-md shadow-lg py-1 z-50">
                <div className="px-3 py-2 border-b text-xs text-muted-foreground truncate">
                    {user.email}
                </div>
                <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted" onClick={() => setShowUserMenu(false)}>
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
                <div className="px-3 py-2 border-t">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center gap-2 text-sm hover:bg-muted w-full text-left">
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                </div>
                {isAdminUser && (
                    <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted border-t" onClick={() => setShowUserMenu(false)}>
                        <Shield className="h-4 w-4" />
                        Admin
                    </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full text-left border-t text-destructive">
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        )}

        {/* Mobile Bottom Nav */}
        <nav className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="container flex h-16 items-center justify-around px-2 mx-auto">
                {mobileRoutes.map((route) => (
                    <Link key={route.href} href={route.href} className="flex flex-col items-center justify-center flex-1 py-2">
                        {route.icon ? <route.icon className={cn("h-5 w-5", pathname === route.href ? "text-primary" : "text-muted-foreground")} /> : null}
                    </Link>
                ))}
                {user ? (
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex flex-col items-center justify-center flex-1 py-2">
                        <User className={cn("h-5 w-5", showUserMenu ? "text-primary" : "text-muted-foreground")} />
                    </button>
                ) : (
                    <Link href="/login" className="flex flex-col items-center justify-center flex-1 py-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                    </Link>
                )}
            </div>
        </nav>
        </>
    )
}
