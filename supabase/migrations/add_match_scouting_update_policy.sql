-- Add UPDATE policy for match_scouting to enable upsert operations
-- This allows scouts to correct/update a previously submitted match row
DROP POLICY IF EXISTS "Scouters can update matches" ON public.match_scouting;
CREATE POLICY "Scouters can update matches" ON public.match_scouting
FOR UPDATE USING (auth.role() = 'authenticated');
