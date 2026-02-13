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
        const scanValue = qrData.trim()

        try {
            // 1. Find Person by Name (case-insensitive)
            const { data: person, error: personError } = await supabase
                .from('persons')
                .select('*')
                .ilike('full_name', scanValue)
                .single()

            if (personError || !person) {
                return { success: false, message: 'Person not found' }
            }

            // 2. Shift Check (Organizers only)
            if (person.role === 'organizer') {
                const { data: event, error: eventError } = await supabase
                    .from('checkin_events')
                    .select('require_shift_check')
                    .eq('id', eventId)
                    .single()

                if (eventError) {
                    console.error('Event fetch error:', eventError)
                    throw new Error('Could not verify event settings')
                }

                if (event?.require_shift_check) {
                    // Check if they have ANY shifts assigned at all
                    const { data: hasShifts, error: shiftsExistError } = await supabase
                        .from('shifts')
                        .select('id')
                        .eq('person_id', person.id)
                        .limit(1)

                    if (shiftsExistError) {
                        console.error('Shifts existence check error:', shiftsExistError)
                        throw new Error('Could not verify shift assignment')
                    }

                    // Only enforce if they have at least one shift assigned
                    if (hasShifts && hasShifts.length > 0) {
                        const now = new Date().toISOString()
                        console.log('[CheckIn] Validating shift at:', now)
                        const { data: shift, error: shiftError } = await supabase
                            .from('shifts')
                            .select('id')
                            .eq('person_id', person.id)
                            .lte('start_time', now)
                            .gte('end_time', now)
                            .maybeSingle()

                        if (shiftError) {
                            console.error('Shift query error:', shiftError)
                            throw new Error('Shift data lookup error')
                        }

                        console.log('[CheckIn] Shift found:', shift)
                        if (!shift) {
                            return { success: false, message: '⚠️ Organizer Not on Shift' }
                        }
                    } else {
                        console.log('[CheckIn] Organizer has no assigned shifts - allowing access.')
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
