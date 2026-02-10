import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface CheckInResult {
    success: boolean
    message: string
    person?: {
        full_name: string
        role: string
    }
}

export const useCheckIn = () => {
    const [processing, setProcessing] = useState(false)
    const { user } = useAuth()

    const checkIn = async (qrData: string, eventId: string): Promise<CheckInResult> => {
        if (!eventId) {
            return { success: false, message: 'No active event' }
        }

        setProcessing(true)
        const email = qrData.trim()

        try {
            // 1. Find Person
            const { data: person, error: personError } = await supabase
                .from('persons')
                .select('*')
                .or(`email.eq.${email},full_name.eq.${email}`)
                .single()

            if (personError || !person) {
                return { success: false, message: 'Person not found' }
            }

            // 2. Shift Check (Organizers only)
            if (person.role === 'organizer') {
                const { data: event } = await supabase
                    .from('checkin_events')
                    .select('require_shift_check')
                    .eq('id', eventId)
                    .single()

                if (event?.require_shift_check) {
                    const now = new Date().toISOString()
                    const { data: shift } = await supabase
                        .from('shifts')
                        .select('id')
                        .eq('person_id', person.id)
                        .eq('event_id', eventId)
                        .lte('start_time', now)
                        .gte('end_time', now)
                        .maybeSingle()

                    if (!shift) {
                        return { success: false, message: '⚠️ Organizer Not on Shift' }
                    }
                }
            }

            // 3. Insert Check-in
            const { error: checkinError } = await supabase
                .from('checkins')
                .insert({
                    event_id: eventId,
                    person_id: person.id,
                    scanned_by: user?.id
                })

            if (checkinError) {
                if (checkinError.code === '23505') { // Unique violation
                    return { success: false, message: '⚠️ Already checked in!', person }
                }
                throw checkinError
            }

            return { success: true, message: `Checked in: ${person.full_name}`, person }

        } catch (error: any) {
            console.error('Check-in error:', error)
            return { success: false, message: error.message || 'Check-in failed' }
        } finally {
            setProcessing(false)
        }
    }

    return { checkIn, processing }
}
