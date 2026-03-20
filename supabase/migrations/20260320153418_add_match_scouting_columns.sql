ALTER TABLE public.match_scouting
    ADD COLUMN IF NOT EXISTS teleop_phase TEXT,
    ADD COLUMN IF NOT EXISTS teleop_phase_1_fuel_scored INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS teleop_phase_2_fuel_scored INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS teleop_phase_3_fuel_scored INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS teleop_phase_4_fuel_scored INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS teleop_phase_1_fuel_range TEXT,
    ADD COLUMN IF NOT EXISTS teleop_phase_2_fuel_range TEXT,
    ADD COLUMN IF NOT EXISTS teleop_phase_3_fuel_range TEXT,
    ADD COLUMN IF NOT EXISTS teleop_phase_4_fuel_range TEXT,
    ADD COLUMN IF NOT EXISTS climb_height TEXT,
    ADD COLUMN IF NOT EXISTS climb_time_seconds INTEGER,
    ADD COLUMN IF NOT EXISTS ranking_points_sources TEXT[],
    ADD COLUMN IF NOT EXISTS teleop_order TEXT;
