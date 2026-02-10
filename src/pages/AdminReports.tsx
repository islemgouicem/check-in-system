import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    ShieldCheck,
    Check,
    X,
    Calendar,
    Search,
    FileText,
    Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Event {
    id: string;
    name: string;
    created_at: string;
}

interface Person {
    id: string;
    full_name: string;
    email: string;
    role: 'participant' | 'organizer';
    team?: string;
}

interface CheckIn {
    person_id: string;
    event_id: string;
}

export default function AdminReports() {
    const [activeTab, setActiveTab] = useState<'participants' | 'organizers'>('participants');
    const [events, setEvents] = useState<Event[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [checkins, setCheckins] = useState<CheckIn[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            // Fetch everything in parallel for speed
            const [eventsRes, peopleRes, checkinsRes] = await Promise.all([
                supabase.from('checkin_events').select('*').order('created_at', { ascending: true }),
                supabase.from('persons').select('*').order('full_name', { ascending: true }),
                supabase.from('checkins').select('person_id, event_id')
            ]);

            if (eventsRes.error) throw eventsRes.error;
            if (peopleRes.error) throw peopleRes.error;
            if (checkinsRes.error) throw checkinsRes.error;

            setEvents(eventsRes.data || []);
            setPeople(peopleRes.data || []);
            setCheckins(checkinsRes.data || []);


        } catch (error) {
            console.error('Error loading report data:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }


    const isCheckedIn = (personId: string, eventId: string) => {
        return checkins.some(c => c.person_id === personId && c.event_id === eventId);
    };

    const filteredPeople = people.filter(p =>
        (p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.team || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        p.role === (activeTab === 'participants' ? 'participant' : 'organizer')
    );

    // Grouping for participants
    const groupedParticipants: Record<string, Person[]> = {};
    if (activeTab === 'participants') {
        filteredPeople.forEach(p => {
            const team = p.team || 'Unassigned';
            if (!groupedParticipants[team]) groupedParticipants[team] = [];
            groupedParticipants[team].push(p);
        });
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20 font-['Futura'] animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary-500" />
                        Management Reports
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Tracking attendance across {events.length} events</p>
                </div>

                <div className="flex bg-secondary-800 p-1 rounded-2xl border border-secondary-600/30 w-fit">
                    <button
                        onClick={() => setActiveTab('participants')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'participants'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-900/20'
                            : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        PARTICIPANTS
                    </button>
                    <button
                        onClick={() => setActiveTab('organizers')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'organizers'
                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-900/20'
                            : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        ORGANIZERS
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-secondary-800 p-4 rounded-2xl border border-secondary-600/30 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Filter by name, email, or team..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-secondary-900 border border-secondary-600/30 pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-all"
                    />
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-secondary-700 hover:bg-secondary-600 text-white px-6 py-3 rounded-xl text-xs font-bold border border-secondary-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    EXPORT / PRINT
                </button>
            </div>

            {/* Reports Table Wrapper */}
            <div className="bg-secondary-800 border border-secondary-600/30 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-secondary-900 border-b border-secondary-600/30">
                                {activeTab === 'participants' && (
                                    <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[150px]">Team</th>
                                )}
                                <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[200px]">Guest Details</th>
                                {events.map(event => (
                                    <th key={event.id} className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center min-w-[120px]">
                                        <div className="truncate max-w-[100px] mx-auto" title={event.name}>
                                            {event.name}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-700/50">
                            {activeTab === 'participants' ? (
                                Object.keys(groupedParticipants).map((team) => (
                                    <React.Fragment key={team}>
                                        {groupedParticipants[team].map((person, personIdx) => (
                                            <tr key={person.id} className="group hover:bg-white/[0.02] transition-colors">
                                                {personIdx === 0 && (
                                                    <td
                                                        rowSpan={groupedParticipants[team].length}
                                                        className="px-6 py-4 align-top border-r border-secondary-700/50 bg-secondary-900/50"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-10 rounded-full bg-primary-500/50"></div>
                                                            <div>
                                                                <p className="text-white font-bold text-sm tracking-tight">{team}</p>
                                                                <p className="text-[10px] text-gray-600 font-bold uppercase">{groupedParticipants[team].length} MEMBERS</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <p className="text-white font-medium text-sm group-hover:text-primary-400 transition-colors uppercase">{person.full_name}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium lowercase tracking-tight">{person.email}</p>
                                                </td>
                                                {events.map(event => {
                                                    const checked = isCheckedIn(person.id, event.id);
                                                    return (
                                                        <td key={event.id} className="px-6 py-4 text-center">
                                                            <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-all ${checked
                                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                : 'bg-red-500/10 text-red-500/40 border border-red-500/10'
                                                                }`}>
                                                                {checked ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                filteredPeople.map((person) => (
                                    <tr key={person.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center font-bold text-primary-400 text-xs">
                                                    {person.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm group-hover:text-primary-400 transition-colors uppercase">{person.full_name}</p>
                                                    <p className="text-[11px] text-gray-500 font-medium lowercase tracking-tight">{person.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {events.map(event => {
                                            const checked = isCheckedIn(person.id, event.id);
                                            return (
                                                <td key={event.id} className="px-6 py-4 text-center">
                                                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-all ${checked
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                        : 'bg-red-500/10 text-red-500/40 border border-red-500/10'
                                                        }`}>
                                                        {checked ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredPeople.length === 0 && (
                    <div className="text-center py-20 bg-secondary-900/50">
                        <Users className="w-12 h-12 text-gray-700 mx-auto mb-4 opacity-20" />
                        <p className="text-gray-500 italic font-medium">No results match your current search/filters.</p>
                    </div>
                )}
            </div>

            {/* Summary Banner */}
            <div className="bg-gradient-to-r from-primary-600/10 to-transparent p-6 rounded-2xl border border-primary-500/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-500/20 rounded-xl">
                            <Calendar className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Attendance Insights</h4>
                            <p className="text-gray-500 text-xs mt-1">Total database of {people.length} registered guests across {events.length} target events.</p>
                        </div>
                    </div>
                    <div className="text-center md:text-right">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Check-ins Processed</p>
                        <p className="text-2xl font-bold text-white tracking-tighter">{checkins.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
