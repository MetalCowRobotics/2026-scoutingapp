'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { getTBAData } from '@/lib/tba'
import { AlertModal } from '@/components/ui/AlertModal'
import { useSettings } from '@/contexts/SettingsContext'

function TeamNickname({ teamNumber, onNameFetched }: { teamNumber: string, onNameFetched?: (name: string) => void }) {
    const [nickname, setNickname] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!teamNumber) {
            setNickname(null)
            return
        }
        const fetchTBA = async () => {
            setLoading(true)
            try {
                const data = await getTBAData(`/team/frc${teamNumber}`)
                setNickname(data.nickname)
                if (data.nickname && onNameFetched) {
                    onNameFetched(data.nickname)
                }
            } catch {
                setNickname(null)
            } finally {
                setLoading(false)
            }
        }
        const timer = setTimeout(fetchTBA, 500)
        return () => clearTimeout(timer)
    }, [teamNumber, onNameFetched])

    if (loading) return <Loader2 className="h-3 w-3 animate-spin opacity-40 ml-2" />
    if (!nickname) return null
    return <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 animate-in fade-in slide-in-from-right-1 truncate max-w-[200px]" title={nickname}>{nickname}</span>
}

function TeamNameSearch({ query, eventKey, onSelect }: { query: string, eventKey: string, onSelect: (teamNumber: number, teamName: string) => void }) {
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (query.length < 2) {
            setResults([])
            return
        }

        const searchTeams = async () => {
            setLoading(true)
            try {
                const teams = await getTBAData(`/event/${eventKey}/teams`)
                const matches = teams
                    .filter((t: any) =>
                        t.nickname?.toLowerCase().includes(query.toLowerCase()) ||
                        t.team_number?.toString().includes(query)
                    )
                    .slice(0, 8)
                setResults(matches)
            } catch {
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        const timer = setTimeout(searchTeams, 300)
        return () => clearTimeout(timer)
    }, [query, eventKey])

    if (loading) {
        return (
            <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl shadow-lg p-3 text-center animate-in fade-in zoom-in-95">
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
            </div>
        )
    }

    if (results.length === 0) {
        return (
            <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl shadow-lg p-3 text-center text-xs text-muted-foreground italic animate-in fade-in zoom-in-95">
                No teams found matching "{query}"
            </div>
        )
    }

    return (
        <div className="absolute z-20 w-full mt-1 bg-popover border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-2 bg-muted/50 border-b">
                Select Team
            </div>
            {results.map((team) => (
                <button
                    key={team.key}
                    type="button"
                    onClick={() => onSelect(team.team_number, team.nickname)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-0"
                >
                    <div className="font-bold text-sm">{team.team_number} - {team.nickname}</div>
                    <div className="text-[10px] text-muted-foreground">{team.city}, {team.state_prov}</div>
                </button>
            ))}
        </div>
    )
}

// Define the steps
const STEPS = {
    PREMATCH: 0,
    AUTO: 1,
    TELEOP: 2,
    ENDGAME: 3,
    SUBMIT: 4,
}

function DefenseAccuracySliders({ formData, handleInputChange }: { formData: any, handleInputChange: (field: string, value: any) => void }) {
    return (
        <div className="space-y-3 border border-secondary/10 bg-secondary/5 p-4 rounded-lg text-black">
            <h4 className="text-sm font-bold text-white">Defense and Accuracy</h4>
            <div className="space-y-2">
                <Label className="text-black">Defense Rating</Label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.defense_rating}
                    onChange={(e) => handleInputChange('defense_rating', parseInt(e.target.value))}
                    className="w-full"
                />
                <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Poor</span>
                    <span className="font-bold">{formData.defense_rating}%</span>
                    <span>Excellent</span>
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-black">Accuracy Rating</Label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.accuracy_rating}
                    onChange={(e) => handleInputChange('accuracy_rating', parseInt(e.target.value))}
                    className="w-full"
                />
                <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Poor</span>
                    <span className="font-bold">{formData.accuracy_rating}%</span>
                    <span>Excellent</span>
                </div>
            </div>
        </div>
    )
}

export default function MatchScoutingForm() {
    const searchParams = useSearchParams()
    const teamParam = searchParams.get('team')
    const { settings } = useSettings()

    const [step, setStep] = useState(STEPS.PREMATCH)
    const [loading, setLoading] = useState(false)
    const [increment, setIncrement] = useState(1)
    const [validTeams, setValidTeams] = useState<number[]>([])
    const [teleopPhaseIndex, setTeleopPhaseIndex] = useState(0)
    const supabase = createClient()

    const getTeleopPhaseRole = (index: number) => {
        const order = formData.teleop_order || 'defense_first'
        const isEvenPhase = index % 2 === 0
        if (order === 'defense_first') {
            return isEvenPhase ? 'Defensive' : 'Offensive'
        }
        return isEvenPhase ? 'Offensive' : 'Defensive'
    }

    const getTeleopPhaseLabel = (index: number) => {
        return `Phase ${index + 1}: ${getTeleopPhaseRole(index)}`
    }

    const teleopRangeValue = (range: string) => {
        switch (range) {
            case '20-40': return 30
            case '41-60': return 50
            case '61-80': return 70
            case '81-100': return 90
            default: return 0
        }
    }

    const [formData, setFormData] = useState({
        // Meta
        match_number: '',
        team_number: teamParam || (settings.default_team_number ? settings.default_team_number.toString() : ''),
        team_name: '',
        event_key: settings.event_key,
        alliance: '',
        scout_name: settings.auto_fill_scout_name ? settings.scout_name : '',
        is_practice_match: false,
        robot_on_field: true,

        // Auto
        auto_preloaded: false,
        auto_active: false,
        auto_fuel_scored: 0,
        auto_fuel_pickup_location: 'None',
        auto_climb: false,
        auto_climb_location: 'None',
        start_position: '',

        // Teleop
        teleop_order: 'defense_first',
        teleop_phase: 'Phase 1',
        teleop_phase_1_fuel_scored: 0,
        teleop_phase_2_fuel_scored: 0,
        teleop_phase_3_fuel_scored: 0,
        teleop_phase_4_fuel_scored: 0,
        teleop_phase_1_fuel_range: '',
        teleop_phase_2_fuel_range: '',
        teleop_phase_3_fuel_range: '',
        teleop_phase_4_fuel_range: '',
        teleop_fuel_scored: 0,
        teleop_zone_control: 'Neutral',
        teleop_descended_from_auto: false,
        teleop_pickup_locations: [] as string[],    // TODO: Multi-select implementation

        // Endgame
        defense_rating: 50,
        accuracy_rating: 50,
        ranking_points_contributed: 0,
        ranking_points_sources: [] as string[],
        robot_status: 'Functional',
        climb_height: 'None',
        climb_time_seconds: 0,
        comments: '',
    })

    const [alertConfig, setAlertConfig] = useState<{ open: boolean, title: string, message: string, variant?: 'success' | 'confirm' | 'info' }>({
        open: false,
        title: '',
        message: '',
        variant: 'info',
    })

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const firstName = session?.user?.user_metadata?.first_name
            const fullName = session?.user?.user_metadata?.full_name
            const email = session?.user?.email

            let nameToUse = ''
            if (settings.auto_fill_scout_name && settings.scout_name) {
                nameToUse = settings.scout_name
            } else if (firstName) {
                nameToUse = firstName
            } else if (fullName) {
                nameToUse = fullName
            } else if (email) {
                nameToUse = email.split('@')[0] || email
            }

            if (nameToUse) {
                setFormData(prev => ({ ...prev, scout_name: nameToUse }))
            }
        }
        fetchUser()
    }, [supabase, settings])

    // Sync event key from settings
    useEffect(() => {
        setFormData(prev => ({ ...prev, event_key: settings.event_key }))
    }, [settings.event_key])

    // Auto-calc Teleop total fuel from 4 phases
    useEffect(() => {
        setFormData(prev => {
            const total =
                teleopRangeValue(prev.teleop_phase_1_fuel_range) +
                teleopRangeValue(prev.teleop_phase_2_fuel_range) +
                teleopRangeValue(prev.teleop_phase_3_fuel_range) +
                teleopRangeValue(prev.teleop_phase_4_fuel_range)

            const teleopTotal = Math.min(1000, total)
            if (prev.teleop_fuel_scored === teleopTotal) {
                return prev
            }

            return {
                ...prev,
                teleop_fuel_scored: teleopTotal,
                teleop_phase_1_fuel_scored: teleopRangeValue(prev.teleop_phase_1_fuel_range),
                teleop_phase_2_fuel_scored: teleopRangeValue(prev.teleop_phase_2_fuel_range),
                teleop_phase_3_fuel_scored: teleopRangeValue(prev.teleop_phase_3_fuel_range),
                teleop_phase_4_fuel_scored: teleopRangeValue(prev.teleop_phase_4_fuel_range),
            }
        })
    }, [
        formData.teleop_phase_1_fuel_range,
        formData.teleop_phase_2_fuel_range,
        formData.teleop_phase_3_fuel_range,
        formData.teleop_phase_4_fuel_range,
    ])

    const showAlert = (title: string, message: string, variant: 'success' | 'confirm' | 'info' = 'info') => {
        setAlertConfig({ open: true, title, message, variant })
    }

    // Fetch valid teams for the event
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const teams = await getTBAData(`/event/${formData.event_key}/teams/simple`)
                setValidTeams(teams.map((t: any) => t.team_number).sort((a: number, b: number) => a - b))
                setFormData(prev => ({ ...prev, team_number: '' }))
            } catch (e) {
                console.error('Failed to fetch teams for event:', e)
                setValidTeams([])
            }
        }
        if (formData.event_key) {
            fetchTeams()
        }
    }, [formData.event_key])

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.from('match_scouting').insert([
                {
                    ...formData, // Spread the form data
                    match_number: parseInt(formData.match_number),
                    team_number: parseInt(formData.team_number),
                    // Ensure other fields are parsed if necessary or matches schema types
                },
            ])

            if (error) {
                console.error('Error submitting match data:', error)
                showAlert('Submission Error', 'Error submitting data: ' + error.message)
            } else {
                showAlert('Success!', 'Match data submitted successfully!', 'success')
                // Reset form or redirect
                setStep(STEPS.PREMATCH)
                setFormData({
                    match_number: '',
                    team_number: settings.default_team_number ? settings.default_team_number.toString() : '',
                    team_name: '',
                    event_key: settings.event_key,
                    alliance: '',
                    scout_name: settings.auto_fill_scout_name ? settings.scout_name : '',
                    is_practice_match: false,
                    robot_on_field: true,
                    auto_preloaded: false,
                    auto_active: false,
                    auto_fuel_scored: 0,
                    auto_fuel_pickup_location: 'None',
                    auto_climb: false,
                    auto_climb_location: 'None',
                    start_position: '',
                    teleop_order: 'defense_first',
                    teleop_phase: 'Phase 1',
                    teleop_phase_1_fuel_scored: 0,
                    teleop_phase_2_fuel_scored: 0,
                    teleop_phase_3_fuel_scored: 0,
                    teleop_phase_4_fuel_scored: 0,
                    teleop_phase_1_fuel_range: '',
                    teleop_phase_2_fuel_range: '',
                    teleop_phase_3_fuel_range: '',
                    teleop_phase_4_fuel_range: '',
                    teleop_fuel_scored: 0,
                    teleop_zone_control: 'Neutral',
                    teleop_descended_from_auto: false,
                    teleop_pickup_locations: [],
                    defense_rating: 50,
                    accuracy_rating: 50,
                    ranking_points_contributed: 0,
                    ranking_points_sources: [],
                    robot_status: 'Functional',
                    climb_height: 'None',
                    climb_time_seconds: 0,
                    comments: '',
                })
            }
        } catch (err) {
            console.error('Unexpected error:', err)
            showAlert('System Error', 'Unexpected error occurred during submission.')
        } finally {
            setLoading(false)
        }
    }

    // Auto-detect current event by location and time
    useEffect(() => {
        const detectEvent = async (lat: number, lon: number) => {
            try {
                const year = 2026 // Using the user's requested season
                const events = await getTBAData(`/events/${year}`)
                const now = new Date()

                // Find events happening now (within start/end dates)
                const activeEvents = events.filter((e: any) => {
                    const start = new Date(e.start_date)
                    const end = new Date(e.end_date)
                    // Extend end date by 1 day for travel/cleanup
                    end.setDate(end.getDate() + 1)
                    return now >= start && now <= end
                })

                if (activeEvents.length > 0) {
                    // Find the closest one if multiple are active
                    let closest = activeEvents[0]
                    let minDistance = Infinity

                    activeEvents.forEach((e: any) => {
                        if (e.lat && e.lng) {
                            const d = Math.sqrt(Math.pow(e.lat - lat, 2) + Math.pow(e.lng - lon, 2))
                            if (d < minDistance) {
                                minDistance = d
                                closest = e
                            }
                        }
                    })

                    // If it's reasonably close (within ~1 degree), auto-set it
                    if (minDistance < 2) {
                        handleInputChange('event_key', closest.key)
                    }
                }
            } catch (e) {
                console.error('Failed to auto-detect event:', e)
            }
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => detectEvent(pos.coords.latitude, pos.coords.longitude),
                (err) => console.log('Geolocation declined or failed:', err.message)
            )
        }
    }, [])

    const validateStep = () => {
        if (step === STEPS.PREMATCH) {
            const isValidTeam = validTeams.includes(parseInt(formData.team_number));
            if (!formData.match_number || !formData.team_number || !formData.alliance || !formData.scout_name) {
                showAlert('Missing Information', 'Please fill out all fields (Match #, Team #, Alliance, Scout Name) before moving forward.');
                return false;
            }
            if (validTeams.length > 0 && !isValidTeam) {
                showAlert('Invalid Team', `Team ${formData.team_number} is not registered for the selected event. Please check the competition roster.`);
                return false;
            }
        }
        if (step === STEPS.AUTO) {
            if (!formData.start_position) {
                showAlert('Position Required', 'You must select a starting position for the robot before entering the Teleop phase.');
                return false;
            }
            if (formData.auto_fuel_scored < 0 || formData.auto_fuel_scored > 500) {
                showAlert('Implausible Value', 'Auto fuel scored must be between 0 and 500.');
                return false;
            }
        }
        if (step === STEPS.TELEOP) {
            if (!formData.teleop_order) {
                showAlert('Order Required', 'Please select teleop order in autonomous phase.');
                return false;
            }

            const phaseRole = getTeleopPhaseRole(teleopPhaseIndex)
            if (phaseRole === 'Offensive') {
                const rangeFieldKey = `teleop_phase_${teleopPhaseIndex + 1}_fuel_range`
                const rangeValue = (formData as any)[rangeFieldKey] as string
                if (!rangeValue) {
                    showAlert('Required Field', `Please choose a fuel range for ${getTeleopPhaseLabel(teleopPhaseIndex)}.`)
                    return false
                }

                if (!formData.teleop_zone_control) {
                    showAlert('Required Field', 'Please select zone control for offensive teleop phase.')
                    return false
                }

                const fuelValue = teleopRangeValue(rangeValue)
                if (fuelValue < 0 || fuelValue > 100) {
                    showAlert('Implausible Value', `Teleop fuel range selected for ${getTeleopPhaseLabel(teleopPhaseIndex)} is invalid.`)
                    return false
                }
            } else {
                if (formData.defense_rating < 0 || formData.defense_rating > 100) {
                    showAlert('Defensive Value', 'Defense rating must be between 0 and 100.')
                    return false
                }
                if (!formData.robot_status) {
                    showAlert('Required Field', 'Please select robot status for defensive teleop phase.')
                    return false
                }
            }

            if (formData.teleop_fuel_scored > 1000) {
                showAlert('Implausible Total', 'Total teleop fuel scored across all phases must not exceed 1000.')
                return false
            }
        }
        if (step === STEPS.ENDGAME) {
            if (!formData.climb_height || formData.climb_height === 'None') {
                showAlert('Climb Height Required', 'Please select how high the robot climbed in endgame.')
                return false
            }
            if (formData.climb_time_seconds <= 0 || formData.climb_time_seconds > 120) {
                showAlert('Climb Time Required', 'Please enter a valid climb time between 1 and 120 seconds.')
                return false
            }
            if (formData.ranking_points_contributed < 0 || formData.ranking_points_contributed > 10) {
                showAlert('Ranking Points Required', 'Please enter ranking points from 0 to 10.')
                return false
            }
            if (formData.ranking_points_contributed > 0 && (!formData.ranking_points_sources || formData.ranking_points_sources.length === 0)) {
                showAlert('Ranking Points Sources Required', 'Please select which ranking points were earned.')
                return false
            }
        }
        return true;
    };

    const nextStep = () => {
        if (step === STEPS.TELEOP) {
            if (!validateStep()) return
            if (teleopPhaseIndex < 3) {
                setTeleopPhaseIndex((prev) => prev + 1) 
            } else {
                setStep(STEPS.ENDGAME)
            }
            return
        }

        if (!validateStep()) return

        setStep((prev) => Math.min(prev + 1, STEPS.SUBMIT))
        if (step === STEPS.AUTO) {
            setTeleopPhaseIndex(0)
        }
    }

    const prevStep = () => {
        if (step === STEPS.TELEOP) {
            if (teleopPhaseIndex > 0) {
                setTeleopPhaseIndex((prev) => prev - 1)
            } else {
                setStep(STEPS.AUTO)
            }
            return
        }
        setStep((prev) => Math.max(prev - 1, STEPS.PREMATCH))
    }

    const filteredTeams = validTeams
        .filter(num => num.toString().startsWith(formData.team_number))
        .slice(0, 5); // Show top 5 matches

    return (
        <div className="max-w-md md:max-w-2xl mx-auto p-4">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Match Scouting</CardTitle>
                    <CardDescription>Step {step + 1} of 4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {step === STEPS.PREMATCH && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-white">Pre-Match Info</h3>

                            <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-dashed">
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Competition Setup</h4>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-primary tracking-widest leading-none mb-1">Active Competition</div>
                                        <div className="text-sm font-bold">Event Key: {settings.event_key}</div>
                                    </div>
                                    <Link href="/settings" className="text-xs text-primary hover:underline font-bold">
                                        Change
                                    </Link>
                                </div>
                            </div>

                            <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="match_number">Match #</Label>
                                    <Input
                                        id="match_number"
                                        type="number"
                                        min="1"
                                        max="300"
                                        value={formData.match_number}
                                        onChange={(e) => handleInputChange('match_number', e.target.value)}
                                        placeholder="1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center gap-2">
                                        <Label htmlFor="team_number">Team # or Name</Label>
                                        {formData.team_number && (
                                            <TeamNickname
                                                teamNumber={formData.team_number}
                                                onNameFetched={(name) => {
                                                    if (!formData.team_name) {
                                                        handleInputChange('team_name', name)
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <Input
                                            id="team_number"
                                            type="text"
                                            value={formData.team_number}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                // If it's a pure number, use it directly
                                                if (/^\d+$/.test(value) || value === '') {
                                                    handleInputChange('team_number', value)
                                                } else {
                                                    // Allow text input for team name search
                                                    handleInputChange('team_number', value)
                                                }
                                            }}
                                            placeholder="254 or 'Cheesy Poofs'"
                                            className={cn(
                                                validTeams.length > 0 && formData.team_number && /^\d+$/.test(formData.team_number) && !validTeams.includes(parseInt(formData.team_number)) ? "border-destructive focus-visible:ring-destructive" : ""
                                            )}
                                        />

                                        {/* Team name search results */}
                                        {formData.team_number && !/^\d+$/.test(formData.team_number) && (
                                            <TeamNameSearch
                                                query={formData.team_number}
                                                eventKey={formData.event_key}
                                                onSelect={(teamNumber, teamName) => {
                                                    handleInputChange('team_number', teamNumber.toString())
                                                    handleInputChange('team_name', teamName)
                                                }}
                                            />
                                        )}

                                        {/* Smart Search Results */}
                                        {validTeams.length > 0 && formData.team_number && /^\d+$/.test(formData.team_number) && !validTeams.includes(parseInt(formData.team_number)) && filteredTeams.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-popover border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95">
                                                <div className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-2 bg-muted/50 border-b">Suggested Teams</div>
                                                {filteredTeams.map(num => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => handleInputChange('team_number', num.toString())}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                                                    >
                                                        Team {num}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {validTeams.length > 0 && formData.team_number && /^\d+$/.test(formData.team_number) && !validTeams.includes(parseInt(formData.team_number)) && (
                                        <p className="text-[10px] text-destructive mt-1 font-medium">This team isn't registered for this event.</p>
                                    )}
                                </div>
                            </div>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                                <div className="space-y-2">
                                    <Label>Alliance</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={formData.alliance === 'Red' ? 'destructive' : 'outline'}
                                            className="w-1/2"
                                            onClick={() => handleInputChange('alliance', 'Red')}
                                        >Red</Button>
                                        <Button
                                            type="button"
                                            variant={formData.alliance === 'Blue' ? 'default' : 'outline'}
                                            className={`w-1/2 ${formData.alliance === 'Blue' ? 'bg-blue-600 text-blue-800 hover:bg-blue-700 ' : ''}`}
                                            onClick={() => handleInputChange('alliance', 'Blue')}
                                        >Blue</Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scout_name">Scout Name</Label>
                                    <Input
                                        id="scout_name"
                                        value={formData.scout_name}
                                        onChange={(e) => handleInputChange('scout_name', e.target.value)}
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="practice"
                                    checked={formData.is_practice_match}
                                    onChange={(e) => handleInputChange('is_practice_match', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="practice" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Practice Match?
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="robot_on_field"
                                    checked={formData.robot_on_field}
                                    onChange={(e) => handleInputChange('robot_on_field', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="robot_on_field" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Robot on Field?
                                </Label>
                            </div>

                            <DefenseAccuracySliders formData={formData} handleInputChange={handleInputChange} />

                        </div>
                    )}

                    {step === STEPS.AUTO && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-white">Autonomous Phase</h3>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                                <div className="flex items-center justify-between border p-3 rounded-lg">
                                    <Label>Preloaded?</Label>
                                    <input
                                        type="checkbox"
                                        checked={formData.auto_preloaded}
                                        onChange={(e) => handleInputChange('auto_preloaded', e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                </div>

                                <div className="flex items-center justify-between border p-3 rounded-lg">
                                    <Label>Robot Active?</Label>
                                    <input
                                        type="checkbox"
                                        checked={formData.auto_active}
                                        onChange={(e) => handleInputChange('auto_active', e.target.checked)}
                                        className="h-5 w-5"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Increment Step</Label>
                                <div className="flex bg-background rounded-md p-1 border">
                                    {[1, 5, 10].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setIncrement(val)}
                                            className={`px-3 py-1 text-xs font-bold rounded ${increment === val ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
                                <div className="space-y-2">
                                    <Label>Fuel Scored</Label>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('auto_fuel_scored', Math.max(0, formData.auto_fuel_scored - increment))}>-</Button>
                                        <Input
                                            type="number"
                                            className="text-center font-bold text-lg"
                                            min="0"
                                            max="500"
                                            value={formData.auto_fuel_scored}
                                            onChange={(e) => handleInputChange('auto_fuel_scored', Math.min(500, Math.max(0, parseInt(e.target.value) || 0)))}
                                        />
                                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('auto_fuel_scored', Math.min(500, formData.auto_fuel_scored + increment))}>+</Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Teleop Order</Label>
                                    <Select onValueChange={(val) => handleInputChange('teleop_order', val || 'defense_first')} value={formData.teleop_order || 'defense_first'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Teleop Order" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="defense_first">Defense → Offense → Defense → Offense</SelectItem>
                                            <SelectItem value="offense_first">Offense → Defense → Offense → Defense</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Start Position - Click on the field to select</Label>
                                    <div className="relative w-full">
                                        <div className="relative rounded-xl overflow-hidden border-2">
                                            <img
                                                src={formData.alliance === 'Red'
                                                    ? '/2026-field-images/red-alliance-wall2.jpg'
                                                    : '/2026-field-images/blue-alliance-wall.jpg'}
                                                alt="Field Map"
                                                className="w-full h-auto"
                                            />
                                            {[
                                                { id: 'Left', label: 'Left', top: '75%', left: '17%' },
                                                { id: 'Center', label: 'Center', top: '75%', left: '50%' },
                                                { id: 'Right', label: 'Right', top: '75%', left: '83%' },
                                            ].map((pos) => (
                                                <button
                                                    key={pos.id}
                                                    type="button"
                                                    onClick={() => handleInputChange('start_position', pos.id)}
                                                    className={`absolute px-4 py-3 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 font-black text-sm transition-all transform hover:scale-110 shadow-lg ${formData.start_position === pos.id
                                                        ? (formData.alliance === 'Red' ? 'bg-red-600 border-red-400 text-white shadow-red-600/50 scale-110' : 'bg-blue-600 border-blue-400 text-white shadow-blue-600/50 scale-110')
                                                        : 'bg-background/90 border-muted-foreground text-muted-foreground hover:border-primary hover:bg-primary/10'
                                                        }`}
                                                    style={{ top: pos.top, left: pos.left }}
                                                >
                                                    {pos.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex justify-center gap-8 text-xs text-muted-foreground">
                                            <span className={formData.start_position === 'Left' ? (formData.alliance === 'Blue' ? 'text-blue-600' : 'text-red-600') + ' font-bold' : ''}>Left</span>
                                            <span className={formData.start_position === 'Center' ? 'text-primary font-bold' : ''}>Center</span>
                                            <span className={formData.start_position === 'Right' ? (formData.alliance === 'Blue' ? 'text-blue-600' : 'text-red-600') + ' font-bold' : ''}>Right</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Auto Climb?</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={formData.auto_climb ? 'default' : 'outline'}
                                        onClick={() => handleInputChange('auto_climb', !formData.auto_climb)}
                                        className="w-full"
                                    >
                                        {formData.auto_climb ? 'Yes' : 'No'}
                                    </Button>
                                </div>
                            </div>

                            <DefenseAccuracySliders formData={formData} handleInputChange={handleInputChange} />
                        </div>
                    )}

                    {step === STEPS.TELEOP && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-white">Teleop Phase</h3>

                            <div className="bg-muted/20 p-3 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold">Current Phase</p>
                                    <p className="text-xs text-muted-foreground">{getTeleopPhaseLabel(teleopPhaseIndex)}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Teleop order: {formData.teleop_order === 'offense_first' ? 'Offense first' : 'Defense first'}.
                                    Press Next in the footer to step through all 4 teleop phases in alternating order.
                                </p>
                            </div>

                            <div className="border-l-4 border-orange-400 bg-transparent p-3 rounded-lg text-white">
                                <h4 className="text-sm font-bold text-white">2026 Teleop Segment</h4>
                                <p className="text-xs text-white mb-2">This panel is either defensive (no scoring) or offensive (scoring) based on the phase sequence.</p>

                                {getTeleopPhaseRole(teleopPhaseIndex) === 'Defensive' ? (
                                    <div className="space-y-4 text-white">
                                        <div className="space-y-2">
                                            <Label className="text-white">Defensive Rating</Label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={formData.defense_rating}
                                                onChange={(e) => handleInputChange('defense_rating', parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Poor</span>
                                                <span className="font-bold">{formData.defense_rating}%</span>
                                                <span>Excellent</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white">Robot Status</Label>
                                            <Select onValueChange={(val) => handleInputChange('robot_status', val || '')} value={formData.robot_status || ''}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Functional">Functional</SelectItem>
                                                    <SelectItem value="Partially Functional">Partially Functional</SelectItem>
                                                    <SelectItem value="Broken">Broken</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-white">{`Phase ${teleopPhaseIndex + 1} Fuel Range`}</Label>
                                            <Select
                                                value={(formData as any)[`teleop_phase_${teleopPhaseIndex + 1}_fuel_range`] || ''}
                                                onValueChange={(val) => handleInputChange(`teleop_phase_${teleopPhaseIndex + 1}_fuel_range`, val || '')}
                                            >
                                                <SelectTrigger className="text-white">
                                                    <SelectValue placeholder="Select range" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="20-40">20-40</SelectItem>
                                                    <SelectItem value="41-60">41-60</SelectItem>
                                                    <SelectItem value="61-80">61-80</SelectItem>
                                                    <SelectItem value="81-100">81-100</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white">Zone Control (offense)</Label>
                                            <Select onValueChange={(val) => handleInputChange('teleop_zone_control', val || '')} value={formData.teleop_zone_control || ''}>
                                                <SelectTrigger className="text-white">
                                                    <SelectValue placeholder="Select Zone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Alliance">Alliance</SelectItem>
                                                    <SelectItem value="Neutral">Neutral</SelectItem>
                                                    <SelectItem value="Opposing">Opposing</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white">Offensive Accuracy</Label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={formData.accuracy_rating}
                                                onChange={(e) => handleInputChange('accuracy_rating', parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                            <div className="flex justify-between text-xs text-white">
                                                <span>Poor</span>
                                                <span className="font-bold">{formData.accuracy_rating}%</span>
                                                <span>Excellent</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-2 space-y-2">
                                <Label className="text-white">Total Teleop Fuel (auto-sum)</Label>
                                <Input type="number" className="text-center font-bold text-lg" value={formData.teleop_fuel_scored} readOnly />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white">Pickup Locations</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['Floor', 'Depot', 'Outpost'].map((loc) => (
                                        <Button
                                            key={loc}
                                            type="button"
                                            variant={formData.teleop_pickup_locations.includes(loc) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                const current = formData.teleop_pickup_locations as string[];
                                                const newLocs = current.includes(loc)
                                                    ? current.filter(l => l !== loc)
                                                    : [...current, loc];
                                                handleInputChange('teleop_pickup_locations', newLocs);
                                            }}
                                        >
                                            {loc}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === STEPS.ENDGAME && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in-0 duration-300">
                            <h3 className="text-lg font-semibold text-white">Endgame & Post-Match</h3>

                            <DefenseAccuracySliders formData={formData} handleInputChange={handleInputChange} />

                            <div className="space-y-2">
                                <Label>Climb Height</Label>
                                <Select onValueChange={(val) => handleInputChange('climb_height', val || 'None')} value={formData.climb_height || 'None'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select height" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="None">None</SelectItem>
                                        <SelectItem value="Level 1">Level 1</SelectItem>
                                        <SelectItem value="Level 2">Level 2</SelectItem>
                                        <SelectItem value="Level 3">Level 3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Climb Time (sec)</Label>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('climb_time_seconds', Math.max(0, formData.climb_time_seconds - 1))}>-</Button>
                                    <Input
                                        type="number"
                                        className="text-center font-bold text-lg"
                                        min="0"
                                        max="120"
                                        value={formData.climb_time_seconds}
                                        onChange={(e) => handleInputChange('climb_time_seconds', Math.min(120, Math.max(0, parseInt(e.target.value) || 0)))}
                                    />
                                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('climb_time_seconds', Math.min(120, formData.climb_time_seconds + 1))}>+</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Ranking Points Contributed</Label>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('ranking_points_contributed', Math.max(0, formData.ranking_points_contributed - 1))}>-</Button>
                                    <Input
                                        type="number"
                                        className="text-center font-bold text-lg"
                                        min="0"
                                        max="10"
                                        value={formData.ranking_points_contributed}
                                        onChange={(e) => handleInputChange('ranking_points_contributed', Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                                    />
                                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => handleInputChange('ranking_points_contributed', Math.min(10, formData.ranking_points_contributed + 1))}>+</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Ranking Points Earned</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['Win RP', 'Tie RP', 'Auto RP', 'Endgame RP', 'Supercharged RP'].map((rp) => (
                                        <Button
                                            key={rp}
                                            type="button"
                                            variant={formData.ranking_points_sources.includes(rp) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                const current = formData.ranking_points_sources as string[]
                                                const changed = current.includes(rp)
                                                    ? current.filter((s) => s !== rp)
                                                    : [...current, rp]
                                                handleInputChange('ranking_points_sources', changed)
                                            }}
                                        >
                                            {rp}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Robot Status</Label>
                                <Select onValueChange={(val) => handleInputChange('robot_status', val || '')} value={formData.robot_status || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Functional">Functional</SelectItem>
                                        <SelectItem value="Partially Functional">Partially Functional</SelectItem>
                                        <SelectItem value="Broken">Broken</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Comments</Label>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider",
                                        formData.comments.length >= 180 ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                        {formData.comments.length}/200
                                    </span>
                                </div>
                                <Textarea
                                    placeholder="Any observations..."
                                    value={formData.comments}
                                    onChange={(e) => handleInputChange('comments', e.target.value)}
                                    maxLength={200}
                                    className="resize-none h-24"
                                />
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={step === STEPS.PREMATCH}
                    >
                        Back
                    </Button>

                    {step < STEPS.ENDGAME ? (
                        <Button onClick={nextStep}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Match
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Simple Step Indicator */}
            <div className="flex justify-center mt-4 gap-2">
                {Object.values(STEPS).filter(s => typeof s === 'number' && s < 4).map((s) => (
                    <div
                        key={s}
                        className={`h-2 w-2 rounded-full transition-colors duration-150 ${s === step ? 'bg-primary ring-1 ring-primary/30' : 'bg-muted-foreground/40 dark:bg-muted-foreground/30 border border-muted-foreground/15'}`}
                        aria-hidden
                    />
                ))}
            </div>

            <AlertModal
                isOpen={alertConfig.open}
                onClose={() => setAlertConfig(prev => ({ ...prev, open: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />
        </div>
    )
}
