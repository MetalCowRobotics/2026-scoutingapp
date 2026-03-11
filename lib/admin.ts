import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        throw new Error('Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }

    supabaseInstance = createClient(url, key)
    return supabaseInstance
}

export type UserRole = 'admin' | 'scout' | 'viewer'

export interface UserPermissions {
    role: UserRole
    can_scout: boolean
    can_view_analytics: boolean
    can_manage_data: boolean
    can_manage_users: boolean
}

export const isAdmin = async (userId?: string): Promise<boolean> => {
    if (!userId) return false

    const { data, error } = await getSupabase()
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .eq('role', 'admin')
        .single()

    if (error) return false
    return !!data
}

export const getUserRole = async (userId: string): Promise<UserPermissions | null> => {
    const { data: user } = await getSupabase()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (user) {
        const role = user.role || 'viewer'
        return {
            role: role,
            can_scout: role === 'scout' || role === 'admin',
            can_view_analytics: role === 'scout' || role === 'admin',
            can_manage_data: role === 'admin',
            can_manage_users: role === 'admin'
        }
    }

    return null
}

export const getUserPermissions = async (email: string | undefined, userId?: string): Promise<UserPermissions> => {
    const defaultPermissions: UserPermissions = {
        role: 'viewer',
        can_scout: false,
        can_view_analytics: false,
        can_manage_data: false,
        can_manage_users: false
    }

    if (!email) return defaultPermissions

    if (userId) {
        const permissions = await getUserRole(userId)
        if (permissions) return permissions
    }

    return defaultPermissions
}

export const getDefaultPermissions = (role: UserRole): UserPermissions => {
    switch (role) {
        case 'admin':
            return { role: 'admin', can_scout: true, can_view_analytics: true, can_manage_data: true, can_manage_users: true }
        case 'scout':
            return { role: 'scout', can_scout: true, can_view_analytics: true, can_manage_data: false, can_manage_users: false }
        case 'viewer':
        default:
            return { role: 'viewer', can_scout: false, can_view_analytics: true, can_manage_data: false, can_manage_users: false }
    }
}

export const setUserRole = async (
    adminUserId: string,
    targetEmail: string,
    role: UserRole,
    permissions: Omit<UserPermissions, 'role'>
): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch('/api/admin/set-user-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetEmail, role, permissions })
        })

        const result = await response.json()

        if (!result.success) {
            return { success: false, error: result.error }
        }

        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

export const removeUserRole = async (adminUserId: string, targetEmail: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await getSupabase()
        .from('profiles')
        .update({
            role: 'viewer',
            can_scout: false,
            can_view_analytics: false,
            can_manage_data: false,
            can_manage_users: false,
            role_updated_at: new Date().toISOString()
        })
        .eq('email', targetEmail)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export const getAllUserRoles = async (): Promise<Array<UserPermissions & { email: string; full_name?: string }>> => {
    const { data, error } = await getSupabase()
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return []

    return (data || []).map((p: any) => ({
        email: p.email,
        full_name: p.full_name || null,
        role: p.role || 'viewer',
        can_scout: p.can_scout || false,
        can_view_analytics: p.can_view_analytics || false,
        can_manage_data: p.can_manage_data || false,
        can_manage_users: p.can_manage_users || false
    }))
}
