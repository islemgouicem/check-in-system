import { useState, useEffect } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { useCheckIn } from '../hooks/useCheckIn'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Plus, Search, Trash2, CheckCircle, ShieldCheck, Users, Pencil, Check, X as CloseIcon } from 'lucide-react'

const AdminDashboard = () => {
    const [events, setEvents] = useState<any[]>([])
    const [newEventName, setNewEventName] = useState('')
    const [manualQuery, setManualQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [activeEvent, setActiveEvent] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [editingEventId, setEditingEventId] = useState<string | null>(null)
    const [editingEventName, setEditingEventName] = useState('')
    const debouncedQuery = useDebounce(manualQuery, 500)

    useEffect(() => {
        fetchEvents()
    }, [])

    useEffect(() => {
        if (debouncedQuery) {
            handleManualSearch(debouncedQuery)
        } else {
            setSearchResults([])
        }
    }, [debouncedQuery, activeEvent])

    const fetchEvents = async () => {
        const { data } = await supabase.from('checkin_events').select('*').order('created_at', { ascending: false })
        if (data) {
            setEvents(data)
            const active = data.find((e: any) => e.is_active)
            setActiveEvent(active)
        }
    }

    const createEvent = async () => {
        if (!newEventName) return
        const { error } = await supabase.from('checkin_events').insert({ name: newEventName })
        if (error) toast.error(error.message)
        else {
            toast.success('Event created')
            setNewEventName('')
            fetchEvents()
        }
    }

    const startEditing = (event: any) => {
        setEditingEventId(event.id)
        setEditingEventName(event.name)
    }

    const cancelEditing = () => {
        setEditingEventId(null)
        setEditingEventName('')
    }

    const updateEventName = async (id: string) => {
        if (!editingEventName.trim()) return

        const { error } = await supabase
            .from('checkin_events')
            .update({ name: editingEventName })
            .eq('id', id)

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Event renamed')
            setEditingEventId(null)
            setEditingEventName('')
            fetchEvents()
        }
    }

    const toggleEventStatus = async (id: string, currentStatus: boolean, eventName: string) => {
        // If activating, deactivate others first
        if (!currentStatus) {
            await supabase.from('checkin_events').update({ is_active: false }).neq('id', id)
        }

        const { error } = await supabase.from('checkin_events').update({ is_active: !currentStatus }).eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success(`Updated ${eventName}`)
            fetchEvents()
        }
    }

    const toggleShiftCheck = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase.from('checkin_events').update({ require_shift_check: !currentStatus }).eq('id', id)
        if (error) toast.error(error.message)
        else {
            toast.success('Shift check policy updated')
            fetchEvents()
        }
    }

    const setActiveEventId = async (id: string) => {
        if (!id) return
        await supabase.from('checkin_events').update({ is_active: false }).neq('id', id)
        const { error } = await supabase.from('checkin_events').update({ is_active: true }).eq('id', id)

        if (error) toast.error(error.message)
        else {
            toast.success('Active event updated')
            fetchEvents()
        }
    }

    const handleManualSearch = async (query = manualQuery) => {
        if (!query) return
        setLoading(true)

        try {
            const { data: persons, error } = await supabase
                .from('persons')
                .select('*')
                .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
                .limit(10)

            if (error) throw error

            if (activeEvent && persons) {
                // Enrich with checkin status
                const enriched = await Promise.all(persons.map(async (p: any) => {
                    const { data: checkin } = await supabase
                        .from('checkins')
                        .select('*')
                        .eq('event_id', activeEvent.id)
                        .eq('person_id', p.id)
                        .maybeSingle()

                    return { ...p, checkin }
                }))
                setSearchResults(enriched)
            } else {
                setSearchResults(persons || [])
            }

        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const { checkIn } = useCheckIn()

    const manualCheckIn = async (personId: string, fullName: string) => {
        if (!activeEvent) return toast.error('No active event')

        setLoading(true)
        // We use the full name for the hook as it's designed for QR/Name matching
        const result = await checkIn(fullName, activeEvent.id)

        if (result.success) {
            toast.success(result.message)
            handleManualSearch()
        } else {
            toast.error(result.message)
        }
        setLoading(false)
    }

    const manualUncheck = async (checkinId: string) => {
        if (!confirm('Are you sure you want to uncheck this person?')) return

        const { error } = await supabase.from('checkins').delete().eq('id', checkinId)
        if (error) toast.error(error.message)
        else {
            toast.success('Unchecked successfully')
            handleManualSearch() // Refresh state
        }
    }

    return (
        <div className="space-y-8 pb-20 font-['Futura'] animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Control</h1>
            </div>

            {/* Event Management */}
            <div className="bg-secondary-800 p-8 rounded-2xl border border-secondary-600/30 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary-500/10 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-primary-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Event Management</h2>
                </div>

                <div className="flex gap-4 mb-8">
                    <input
                        className="flex-1 bg-secondary-900 border border-secondary-600/30 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                        placeholder="New Event Name (e.g. Lunch Day 1)"
                        value={newEventName}
                        onChange={e => setNewEventName(e.target.value)}
                    />
                    <button
                        onClick={createEvent}
                        className="bg-primary-500 hover:bg-primary-400 text-white px-8 py-2 rounded-xl flex items-center font-bold transition-all shadow-lg shadow-primary-900/20 active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" /> CREATE
                    </button>
                </div>

                <div className="mb-8">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Active Check-in Target</label>
                    <select
                        className="w-full bg-secondary-900 border border-secondary-600/30 p-4 rounded-xl text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium appearance-none cursor-pointer"
                        value={activeEvent?.id || ''}
                        onChange={(e) => setActiveEventId(e.target.value)}
                    >
                        <option value="" disabled>Select an event to activate...</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>
                                {event.name} {event.is_active ? '✓' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    {events.length === 0 && (
                        <div className="text-gray-500 text-center py-10 border border-dashed border-[#2A2A2A] rounded-2xl">
                            No events created yet.
                        </div>
                    )}

                    {events.map(event => (
                        <div key={event.id} className="flex justify-between items-center p-4 border border-secondary-600/30 rounded-2xl hover:border-primary-500/30 bg-secondary-900/50 transition-all group">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-2 h-2 rounded-full ${event.is_active ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-700'}`}></div>

                                {editingEventId === event.id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            autoFocus
                                            className="flex-1 bg-[#1A1A1A] border border-primary-500/50 p-2 rounded-lg text-white font-medium focus:outline-none"
                                            value={editingEventName}
                                            onChange={e => setEditingEventName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') updateEventName(event.id)
                                                if (e.key === 'Escape') cancelEditing()
                                            }}
                                        />
                                        <button onClick={() => updateEventName(event.id)} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={cancelEditing} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/name">
                                        <span className="font-bold text-white group-hover:text-primary-400 transition-colors">{event.name}</span>
                                        <button
                                            onClick={() => startEditing(event)}
                                            className="p-1.5 text-gray-600 hover:text-primary-400 opacity-0 group-hover/name:opacity-100 transition-all"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => toggleShiftCheck(event.id, event.require_shift_check)}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${event.require_shift_check
                                        ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                                        : 'bg-gray-800/50 text-gray-500 border-gray-700/50'
                                        }`}
                                    title="Toggle Shift Check for Organizers"
                                >
                                    <ShieldCheck className="w-3 h-3" />
                                    {event.require_shift_check ? 'SHIFT CHECK: ON' : 'SHIFT CHECK: OFF'}
                                </button>
                                <span className={`px-3 py-1 text-[10px] font-bold rounded-full tracking-tighter border ${event.is_active
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-gray-800/50 text-gray-500 border-gray-700/50'
                                    }`}>
                                    {event.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                                <button
                                    onClick={() => toggleEventStatus(event.id, event.is_active, event.name)}
                                    className={`text-xs font-bold transition-all px-4 py-1.5 rounded-lg ${event.is_active
                                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                        : 'text-primary-400 hover:text-primary-300 hover:bg-primary-500/5'
                                        }`}
                                >
                                    {event.is_active ? 'Deactivate' : 'Set Active'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Manual Operations */}
            <div className="bg-secondary-800 p-8 rounded-2xl border border-secondary-600/30 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-secondary-500/10 rounded-lg">
                        <Users className="w-5 h-5 text-secondary-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Manual Control</h2>
                </div>

                <div className="flex gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            className="w-full bg-secondary-900 border border-secondary-600/30 pl-12 p-4 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                            placeholder="Search by name or email..."
                            value={manualQuery}
                            onChange={e => setManualQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                        />
                    </div>
                    <button
                        onClick={() => handleManualSearch()}
                        disabled={loading}
                        className="bg-secondary-900 hover:bg-secondary-700 text-white border border-secondary-600/30 px-8 py-2 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? 'SEARCHING...' : 'SEARCH'}
                    </button>
                </div>

                {/* Results */}
                <div className="space-y-3">
                    {searchResults.length > 0 && activeEvent && (
                        <div className="text-[10px] font-bold text-gray-500 mb-4 px-1 uppercase tracking-widest">
                            Targeting: <span className="text-primary-400">{activeEvent.name}</span>
                        </div>
                    )}

                    {searchResults.map(person => (
                        <div key={person.id} className="p-5 border border-secondary-600/30 rounded-2xl flex justify-between items-center bg-secondary-900/50 hover:border-primary-500/30 transition-all group">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full bg-secondary-800 border border-secondary-600/30 flex items-center justify-center font-bold text-secondary-400">
                                    {person.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white group-hover:text-primary-400 transition-colors leading-tight">{person.full_name}</div>
                                    <div className="text-xs text-gray-500 mb-1">{person.email}</div>
                                    <div className="text-[10px] font-bold bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-0.5 rounded-full text-gray-400 uppercase tracking-tighter inline-block">{person.role}</div>
                                </div>
                            </div>

                            <div>
                                {person.checkin ? (
                                    <div className="flex items-center gap-4">
                                        <div className="text-green-400 flex items-center text-xs font-bold bg-green-400/10 px-4 py-2 rounded-full border border-green-400/20">
                                            <CheckCircle className="w-4 h-4 mr-2" /> CHECKED IN
                                        </div>
                                        <button
                                            onClick={() => manualUncheck(person.checkin.id)}
                                            className="text-gray-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-400/5 transition-all"
                                            title="Uncheck (Delete Record)"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => manualCheckIn(person.id, person.full_name)}
                                        disabled={!activeEvent || loading}
                                        className="bg-primary-500 hover:bg-primary-400 text-white px-6 py-2.5 rounded-xl text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-900/10 active:scale-95"
                                    >
                                        {loading ? '...' : 'CHECK IN'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {manualQuery && searchResults.length === 0 && !loading && (
                        <div className="text-center text-gray-500 py-12 border border-dashed border-[#2A2A2A] rounded-2xl italic">
                            No matching profiles found for "{manualQuery}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
