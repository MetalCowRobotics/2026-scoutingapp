/**
 * TypeScript interfaces for Supabase database tables.
 * Matches the schema defined in supabase/master_schema.sql
 */

export interface MatchScoutingRow {
    id?: string
    created_at?: string
    match_number: number
    team_number: number
    event_key: string
    alliance: 'Red' | 'Blue' | null
    scout_name: string
    team_name?: string | null
    is_practice_match?: boolean
    robot_on_field?: boolean

    // Autonomous
    start_position?: string | null
    auto_preloaded?: boolean
    auto_active?: boolean
    auto_fuel_scored?: number
    auto_fuel_pickup_location?: string
    auto_climb?: boolean
    auto_climb_location?: string

    // Teleop
    teleop_fuel_scored?: number
    teleop_zone_control?: 'Alliance' | 'Neutral' | 'Opposing'
    teleop_descended_from_auto?: boolean
    teleop_pickup_locations?: string[]
    teleop_order?: string | null
    teleop_phase?: string | null
    teleop_phase_1_fuel_scored?: number
    teleop_phase_2_fuel_scored?: number
    teleop_phase_3_fuel_scored?: number
    teleop_phase_4_fuel_scored?: number
    teleop_phase_1_fuel_range?: string | null
    teleop_phase_2_fuel_range?: string | null
    teleop_phase_3_fuel_range?: string | null
    teleop_phase_4_fuel_range?: string | null

    // Endgame
    defense_rating?: number | null
    accuracy_rating?: number | null
    ranking_points_contributed?: number
    ranking_points_sources?: string[]
    robot_status?: 'Functional' | 'Partially Functional' | 'Broken'
    climb_height?: string | null
    climb_time_seconds?: number | null
    comments?: string | null
}

export interface PitScoutingRow {
    id?: string
    created_at?: string
    team_number: number
    event_key: string
    scout_name: string
    team_name?: string | null

    // Physical
    robot_weight?: number | null
    drive_train_type?: string | null
    top_speed?: number | null
    fuel_capacity?: number | null
    fuel_per_second?: number | null

    // Strategic
    climb_level?: number | null
    climbs_in_auto?: boolean
    obstacle_handling?: 'Trench' | 'Bump' | 'Both' | 'None' | null
    primary_role?: string | null

    // Confidence (0-100)
    confidence_drive?: number | null
    confidence_shooter?: number | null
    confidence_overall?: number | null

    comments?: string | null
}
