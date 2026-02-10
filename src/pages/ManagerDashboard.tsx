import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { PartyPopper, Search, QrCode, CheckCircle, Users, ShieldCheck } from 'lucide-react';
import ScannerOverlay from '../components/ScannerOverlay';
import { useDebounce } from '../hooks/useDebounce';

interface RoleStats {
    count: number;
    total: number;
}

interface EventStats {
    total_guests: number;
    checked_in_count: number;
    organizers: RoleStats;
    participants: RoleStats;
}

interface SearchResult {
    id: string;
    name: string;
    email: string;
    status: 'checked_in' | 'pending';
    check_in_time?: string;
    role: string;
}

export default function ManagerDashboard() {
    const [loading, setLoading] = useState(true);
    const [activeEvent, setActiveEvent] = useState<any>(null);
    const [stats, setStats] = useState<EventStats>({
        total_guests: 0,
        checked_in_count: 0,
        organizers: { count: 0, total: 0 },
        participants: { count: 0, total: 0 }
    });
    const [showScanner, setShowScanner] = useState(false);
    const [manualSearchQuery, setManualSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const debouncedQuery = useDebounce(manualSearchQuery, 500);

    useEffect(() => {
        fetchActiveEvent();
    }, []);

    useEffect(() => {
        if (activeEvent) {
            fetchStats();
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [activeEvent]);

    // Live search effect
    useEffect(() => {
        if (debouncedQuery.trim().length >= 2) {
            handleManualSearch(debouncedQuery);
        } else {
            setSearchResults([]);
        }
    }, [debouncedQuery]);

    const fetchActiveEvent = async () => {
        try {
            const { data, error } = await supabase
                .from('checkin_events')
                .select('*')
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
            setActiveEvent(data);
        } catch (error) {
            console.error('Error fetching active event:', error);
            toast.error('Error refreshing active event');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!activeEvent) return;

        try {
            // Count total people and filter by role
            const { data: persons, error: personsError } = await supabase
                .from('persons')
                .select('id, role');

            if (personsError) throw personsError;

            // Count actual checkins for this event
            const { data: checkins, error: checkinsError } = await supabase
                .from('checkins')
                .select('person_id')
                .eq('event_id', activeEvent.id);

            if (checkinsError) throw checkinsError;

            const checkedInIds = new Set(checkins?.map(c => c.person_id) || []);

            const organizers = persons?.filter(p => p.role === 'organizer') || [];
            const participants = persons?.filter(p => p.role === 'participant') || [];

            const checkedInOrganizers = organizers.filter(p => checkedInIds.has(p.id)).length;
            const checkedInParticipants = participants.filter(p => checkedInIds.has(p.id)).length;

            setStats({
                total_guests: persons?.length || 0,
                checked_in_count: checkedInIds.size,
                organizers: { count: checkedInOrganizers, total: organizers.length },
                participants: { count: checkedInParticipants, total: participants.length }
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleManualSearch = async (query: string) => {
        if (!activeEvent || !query.trim()) return;

        try {
            // 1. Search Persons using full_name and email
            const { data: persons, error } = await supabase
                .from('persons')
                .select('id, full_name, email, role')
                .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
                .limit(5);

            if (error) throw error;

            // 2. Check check-in status for these persons for the ACTIVE event
            const formattedResults = await Promise.all((persons || []).map(async (person: any) => {
                const { data: checkin } = await supabase
                    .from('checkins')
                    .select('id, created_at')
                    .eq('event_id', activeEvent.id)
                    .eq('person_id', person.id)
                    .maybeSingle();

                return {
                    id: person.id,
                    name: person.full_name,
                    email: person.email,
                    role: person.role,
                    status: checkin ? 'checked_in' : 'pending',
                    check_in_time: checkin?.created_at
                };
            }));

            setSearchResults(formattedResults as SearchResult[]);
        } catch (error) {
            console.error('Error searching guests:', error);
            toast.error('Search failed');
        }
    };

    const handleCheckIn = async (personId: string) => {
        try {
            const { error } = await supabase
                .from('checkins')
                .insert({
                    event_id: activeEvent.id,
                    person_id: personId,
                });

            if (error) throw error;

            toast.success('Guest checked in successfully');
            setManualSearchQuery('');
            setSearchResults([]);
            fetchStats();
        } catch (error) {
            console.error('Error checking in guest:', error);
            toast.error('Failed to check in guest');
        }
    };

    const handleScan = async (result: string) => {
        setShowScanner(false);
        toast.success('Scan detected: ' + result);
        handleManualSearch(result);
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center font-['Futura']">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!activeEvent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-['Futura']">
                <div className="bg-[#121212] p-8 rounded-2xl border border-[#2A2A2A] max-w-md w-full shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <PartyPopper className="w-32 h-32 text-gray-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#2A2A2A]">
                            <Search className="w-8 h-8 text-gray-500" />
                        </div>
                        <h2 className="text-xl font-medium text-white mb-3">No Active Event Selected</h2>
                        <p className="text-gray-400 mb-8 font-light text-sm leading-relaxed">
                            There is currently no event marked as "Active" in the system.
                            As a result, check-ins cannot be processed.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-primary-900/20"
                        >
                            Refresh Status
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-['Futura'] animate-in fade-in duration-500">

            {/* Active Event Card */}
            <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 relative overflow-hidden group shadow-lg">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all duration-500">
                    <PartyPopper className="w-24 h-24 text-primary-500 rotate-12" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-gray-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                        Active Event
                    </h2>
                    <h3 className="text-3xl text-white font-bold tracking-tight">
                        {activeEvent?.name || 'Unknown Event'}
                    </h3>
                    <p className="text-gray-500 mt-2 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {activeEvent?.created_at ? new Date(activeEvent.created_at).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) : '---'}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#121212] p-6 rounded-2xl border border-[#2A2A2A] shadow-md group hover:border-[#3A3A3A] transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Total Guests</p>
                        <Users className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-4xl font-bold text-white tracking-tighter">
                        {stats.total_guests}
                    </p>
                    <div className="mt-4 w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(stats.checked_in_count / (stats.total_guests || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-[#121212] p-6 rounded-2xl border border-[#2A2A2A] shadow-md group hover:border-[#3A3A3A] transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Organizers</p>
                        <ShieldCheck className="w-4 h-4 text-primary-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold text-white tracking-tighter">
                            {stats.organizers.count}
                        </p>
                        <p className="text-xl font-medium text-gray-500">/ {stats.organizers.total}</p>
                    </div>
                    <div className="mt-4 w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(stats.organizers.count / (stats.organizers.total || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-[#121212] p-6 rounded-2xl border border-[#2A2A2A] shadow-md group hover:border-[#3A3A3A] transition-all">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Participants</p>
                        <Users className="w-4 h-4 text-secondary-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold text-white tracking-tighter">
                            {stats.participants.count}
                        </p>
                        <p className="text-xl font-medium text-gray-500">/ {stats.participants.total}</p>
                    </div>
                    <div className="mt-4 w-full bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-secondary-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(stats.participants.count / (stats.participants.total || 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Scanner Action */}
                <button
                    onClick={() => setShowScanner(true)}
                    className="flex items-center justify-between p-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl hover:brightness-110 transition-all group text-left w-full shadow-xl shadow-primary-900/20 active:scale-[0.98]"
                >
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Open Scanner</h3>
                        <p className="text-white/80 text-sm font-medium">Scan QR codes to check in guests</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 group-hover:bg-white/20 transition-all">
                        <QrCode className="w-10 h-10 text-white" />
                    </div>
                </button>

                {/* Manual Search */}
                <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-8 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-6">Manual Search</h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={manualSearchQuery}
                            onChange={(e) => setManualSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-[#080808] border border-[#2A2A2A] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                            autoComplete="off"
                        />
                    </div>

                    {/* Live Search Results */}
                    {manualSearchQuery.length >= 2 && (
                        <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {searchResults.length > 0 ? (
                                searchResults.map((guest) => (
                                    <div
                                        key={guest.id}
                                        className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl hover:border-primary-500/50 hover:bg-[#222222] transition-all group"
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-full bg-[#080808] border border-[#2A2A2A] flex items-center justify-center font-bold text-primary-400 text-xs">
                                                {guest.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-primary-400 transition-colors">{guest.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-gray-500">{guest.email}</p>
                                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                    <p className="text-xs text-primary-400 uppercase font-bold tracking-tighter">{guest.role}</p>
                                                </div>
                                            </div>
                                        </div>
                                        {guest.status === 'checked_in' ? (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
                                                <CheckCircle className="w-4 h-4" />
                                                IN
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleCheckIn(guest.id)}
                                                className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-primary-900/20 active:scale-95"
                                            >
                                                CHECK IN
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 text-sm py-8 font-medium italic">
                                    No guests found matching "{manualSearchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showScanner && (
                <ScannerOverlay
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
