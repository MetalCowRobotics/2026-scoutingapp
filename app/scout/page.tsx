'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { usePermissions } from '@/contexts/PermissionsContext'
import { Loader2, Lock, Trophy, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import MatchScoutingForm from '@/components/scouting/MatchScoutingForm'
import PitScoutingForm from '@/components/scouting/PitScoutingForm'
import { cn } from '@/lib/utils'

type Tab = 'match' | 'pit'

function ScoutContent() {
    const { permissions, loading: permissionsLoading } = usePermissions()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [sessionLoading, setSessionLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('match')
    const supabase = createClient()

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'match' || tab === 'pit') {
            setActiveTab(tab)
        }
    }, [searchParams])

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
            } else {
                setSessionLoading(false)
            }
        }
        checkSession()
    }, [router, supabase])

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab)
        const url = new URL(window.location.href)
        url.searchParams.set('tab', tab)
        window.history.pushState({}, '', url)
    }

    if (permissionsLoading || sessionLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!permissions?.can_scout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] space-y-4">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">You don&apos;t have permission to access scouting forms.</p>
            </div>
        )
    }

    return (
        <div className="container px-4 py-8 md:py-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-card p-6 md:p-8 rounded-3xl border shadow-xl mb-6 flex flex-col lg:flex-row justify-between items-center lg:items-center gap-6">
                <div className="space-y-2 w-full text-center lg:text-left">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center justify-center lg:justify-start gap-3">
                        <Trophy className="h-8 w-8 md:h-10 md:w-10 text-primary" /> Scouting
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-lg">Capture match and pit data.</p>
                </div>
            </div>

            {/* Sticky Navigation */}
            <div className="sticky top-2 md:top-20 z-40 flex w-full lg:w-max mx-auto bg-background/95 backdrop-blur-sm p-2 rounded-2xl border shadow-lg mb-8">
                <div className="flex w-full flex-row bg-muted dark:bg-muted/30 p-1 rounded-xl border-2 dark:border-border/50">
                    <button
                        onClick={() => handleTabChange('match')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'match' ? "bg-background dark:bg-primary/15 shadow-md text-primary" : "text-muted-foreground hover:text-foreground dark:hover:bg-muted/50"
                        )}
                    >
                        <Trophy className="h-4 w-4" /> <span>Match</span>
                    </button>
                    <button
                        onClick={() => handleTabChange('pit')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'pit' ? "bg-background dark:bg-primary/15 shadow-md text-primary" : "text-muted-foreground hover:text-foreground dark:hover:bg-muted/50"
                        )}
                    >
                        <ClipboardList className="h-4 w-4" /> <span>Pit</span>
                    </button>
                </div>
            </div>

            {/* Form Content */}
            {activeTab === 'match' ? (
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-center md:hidden">Match Scouting</h2>
                    <MatchScoutingForm />
                </div>
            ) : (
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-center md:hidden">Pit Scouting</h2>
                    <PitScoutingForm />
                </div>
            )}
        </div>
    )
}

export default function ScoutPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ProtectedRoute>
                <ScoutContent />
            </ProtectedRoute>
        </Suspense>
    )
}
