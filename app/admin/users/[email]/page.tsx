'use client'

import { useState, useEffect, use } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Database, ArrowLeft, Trash2, BarChart3, ClipboardList, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getAllUserRoles, setUserRole, getDefaultPermissions, UserRole, UserPermissions } from '@/lib/admin'
import { useSettings } from '@/contexts/SettingsContext'
import Link from 'next/link'

export default function UserDetailPage({ params }: { params: Promise<{ email: string }> }) {
    const resolvedParams = use(params)
    const decodedEmail = decodeURIComponent(resolvedParams.email)
    const { settings, user: currentUser } = useSettings()
    const supabase = createClient()
    
    const [userData, setUserData] = useState<UserPermissions & { email: string } | null>(null)
    const [submittedData, setSubmittedData] = useState<{
        matches: number
        pits: number
        matchEntries: Array<{ id: string; team_number: number; match_number: number; event_key: string }>
        pitEntries: Array<{ id: string; team_number: number; event_key: string; drive_train_type: string }>
    }>({ matches: 0, pits: 0, matchEntries: [], pitEntries: [] })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userName, setUserName] = useState<string | null>(null)

    const [role, setRole] = useState<UserRole>('scout')
    const [perms, setPerms] = useState<UserPermissions>({
        role: 'scout',
        can_scout: true,
        can_view_analytics: false,
        can_manage_data: false,
        can_manage_users: false
    })

    useEffect(() => {
        fetchUserData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [decodedEmail])

    const fetchUserData = async () => {
        setLoading(true)
        
        // Get user role data
        const allRoles = await getAllUserRoles()
        const user = allRoles.find(u => u.email === decodedEmail)
        
        if (user) {
            setUserName(user.full_name || null)
            setUserData(user)
            setRole(user.role)
            setPerms({
                role: user.role,
                can_scout: user.can_scout,
                can_view_analytics: user.can_view_analytics,
                can_manage_data: user.can_manage_data,
                can_manage_users: user.can_manage_users
            })
        }

        // Get submitted data - search by email in profiles or by name in scouting tables
        const { data: profiles } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('email', decodedEmail)
            .single()

        const scoutName = profiles?.full_name

        // Fetch match entries
        let matchQuery = supabase
            .from('match_scouting')
            .select('id, team_number, match_number, event_key')
            .order('match_number', { ascending: false })

        if (scoutName) {
            matchQuery = matchQuery.eq('scout_name', scoutName)
        } else {
            matchQuery = matchQuery.eq('scout_name', decodedEmail)
        }

        const { data: matches } = await matchQuery

        // Fetch pit entries
        let pitQuery = supabase
            .from('pit_scouting')
            .select('id, team_number, event_key, drive_train_type')

        if (scoutName) {
            pitQuery = pitQuery.eq('scout_name', scoutName)
        } else {
            pitQuery = pitQuery.eq('scout_name', decodedEmail)
        }

        const { data: pits } = await pitQuery

        setSubmittedData({
            matches: matches?.length || 0,
            pits: pits?.length || 0,
            matchEntries: matches || [],
            pitEntries: pits || []
        })

        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        const result = await setUserRole(
            currentUser?.id || '',
            decodedEmail,
            role,
            perms
        )
        setSaving(false)
        
        if (result.success) {
            alert('User updated successfully!')
            fetchUserData()
        } else {
            alert('Error: ' + result.error)
        }
    }

    const handleDeleteMatch = async (id: string) => {
        if (!confirm('Delete this match entry?')) return
        const { error } = await supabase.from('match_scouting').delete().eq('id', id)
        if (!error) {
            fetchUserData()
        }
    }

    const handleDeletePit = async (id: string) => {
        if (!confirm('Delete this pit entry?')) return
        const { error } = await supabase.from('pit_scouting').delete().eq('id', id)
        if (!error) {
            fetchUserData()
        }
    }

    const handleRoleChange = (newRole: UserRole) => {
        setRole(newRole)
        setPerms(getDefaultPermissions(newRole))
    }

    if (loading) {
        return (
            <AdminRoute>
                <div className="container px-4 py-8 max-w-4xl mx-auto">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                </div>
            </AdminRoute>
        )
    }

    if (!userData) {
        return (
            <AdminRoute>
                <div className="container px-4 py-8 max-w-4xl mx-auto">
                    <Link href="/admin">
                        <Button variant="outline" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Admin
                        </Button>
                    </Link>
                    <Card className="border-2 border-destructive">
                        <CardContent className="p-6 text-center">
                            <p className="text-destructive font-bold">User not found</p>
                        </CardContent>
                    </Card>
                </div>
            </AdminRoute>
        )
    }

    return (
        <AdminRoute>
            <div className="container px-4 py-8 max-w-4xl mx-auto space-y-6">
                <Link href="/admin">
                    <Button variant="outline" className="mb-2">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Users
                    </Button>
                </Link>

                <Card className="border-2">
                    <CardHeader className="bg-primary/5">
                        <div className="flex items-center gap-4">
                            <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-black ${
                                role === 'admin' ? 'bg-destructive/20 text-destructive' :
                                role === 'scout' ? 'bg-green-500/20 text-green-500' :
                                'bg-muted text-muted-foreground'
                            }`}>
                                {(userName || decodedEmail).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black">{userName || decodedEmail}</CardTitle>
                                <CardDescription className="flex flex-col items-start gap-1 mt-1">
                                    <span>{decodedEmail}</span>
                                    <Badge variant={role === 'admin' ? 'destructive' : role === 'scout' ? 'default' : 'secondary'}>
                                        {role}
                                    </Badge>
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        {/* Permissions Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Permissions
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role</label>
                                    <select
                                        value={role}
                                        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                                        className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="scout">Scout</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Access</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${perms.can_scout ? 'bg-green-500/10 border-green-500' : 'bg-muted/30'}`}>
                                        <span className="font-medium text-sm">Can Scout</span>
                                        {perms.can_scout ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${perms.can_view_analytics ? 'bg-green-500/10 border-green-500' : 'bg-muted/30'}`}>
                                        <span className="font-medium text-sm">View Analytics</span>
                                        {perms.can_view_analytics ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${perms.can_manage_data ? 'bg-green-500/10 border-green-500' : 'bg-muted/30'}`}>
                                        <span className="font-medium text-sm">Manage Data</span>
                                        {perms.can_manage_data ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                    <div className={`flex items-center justify-between p-3 rounded-lg border ${perms.can_manage_users ? 'bg-green-500/10 border-green-500' : 'bg-muted/30'}`}>
                                        <span className="font-medium text-sm">Manage Users</span>
                                        {perms.can_manage_users ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleSave} disabled={saving} className="w-full mt-2">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>

                        {/* Submitted Data Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                Submitted Data
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="border-2 bg-primary/5">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2">
                                            <ClipboardList className="h-4 w-4" />
                                            Match Entries
                                        </CardDescription>
                                        <CardTitle className="text-4xl font-black">{submittedData.matches}</CardTitle>
                                    </CardHeader>
                                </Card>
                                <Card className="border-2 bg-blue-500/5">
                                    <CardHeader className="pb-2">
                                        <CardDescription className="flex items-center gap-2 text-blue-500">
                                            <BarChart3 className="h-4 w-4" />
                                            Pit Profiles
                                        </CardDescription>
                                        <CardTitle className="text-4xl font-black text-blue-500">{submittedData.pits}</CardTitle>
                                    </CardHeader>
                                </Card>
                            </div>

                            {/* Match Entries */}
                            {submittedData.matchEntries.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-muted-foreground">Match Details</h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {submittedData.matchEntries.map(m => (
                                            <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                <div>
                                                    <span className="font-bold">Team {m.team_number}</span>
                                                    <span className="text-muted-foreground text-sm ml-2">Match #{m.match_number}</span>
                                                    <span className="text-muted-foreground text-xs ml-2">{m.event_key}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDeleteMatch(m.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pit Entries */}
                            {submittedData.pitEntries.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-muted-foreground">Pit Details</h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {submittedData.pitEntries.map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                                                <div>
                                                    <span className="font-bold">Team {p.team_number}</span>
                                                    <span className="text-muted-foreground text-sm ml-2">{p.drive_train_type}</span>
                                                    <span className="text-muted-foreground text-xs ml-2">{p.event_key}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDeletePit(p.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {submittedData.matches === 0 && submittedData.pits === 0 && (
                                <div className="text-center py-8 text-muted-foreground italic">
                                    No submitted data found for this user.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminRoute>
    )
}
