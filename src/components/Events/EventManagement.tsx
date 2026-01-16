// EventManagement.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
  MapPin,
  Filter,
  Search,
  Eye,
  MoreVertical,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  ArrowLeft,
  Clock
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { eventService } from "../../firebase/firestore";
import { Event } from "../../types";
import { injectDummyData, USE_DUMMY_DATA } from "../../utils/dummyData";


/* ---------- Helpers ---------- */
const categoryBadge = (category: Event["category"]) => {
  switch (category) {
    case "Academic":
      return "bg-purple-100 text-purple-800";
    case "Cultural":
      return "bg-pink-100 text-pink-800";
    case "Sports":
      return "bg-orange-100 text-orange-800";
    case "Technical":
      return "bg-blue-100 text-blue-800";
    case "Social":
      return "bg-green-100 text-green-800";
    case "Other":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const statusBadge = (status: Event["status"]) => {
  switch (status) {
    case "upcoming":
      return "bg-blue-50 text-blue-700";
    case "ongoing":
      return "bg-green-50 text-green-700";
    case "completed":
      return "bg-gray-50 text-gray-700";
    case "cancelled":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
};


/* ---------- Component ---------- */
const EventManagement: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Detail page state
  const [showDetail, setShowDetail] = useState(false);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);

  // filters + search
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // action menu on card (mobile)
  const [openActionFor, setOpenActionFor] = useState<string | null>(null);
  const actionRef = useRef<HTMLDivElement | null>(null);

  // Load events from Firestore
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      let eventsData: Event[] = [];
      if (USE_DUMMY_DATA) {
        eventsData = injectDummyData.events([]);
      } else {
        eventsData = await eventService.getAllEvents();
      }
      eventsData = injectDummyData.events(eventsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenActionFor(null);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  /* ---------- Form state (Add/Edit) ---------- */
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    category: "Academic",
    maxParticipants: "",
    registrationRequired: false,
    department: "",
    contactEmail: "",
    contactPhone: "",
    registrationStartDate: "",
    registrationStartTime: "",
    registrationDeadline: "",
    registrationDeadlineTime: "",
    requirements: "",
  });

  const resetForm = () =>
    setForm({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      organizer: "",
      category: "Academic",
      maxParticipants: "",
      registrationRequired: false,
      department: "",
      contactEmail: "",
      contactPhone: "",
      registrationStartDate: "",
      registrationStartTime: "",
      registrationDeadline: "",
      registrationDeadlineTime: "",
      requirements: "",
    });

  // Helper function to check if registration is currently open
  const getRegistrationStatus = (event: Event): { isOpen: boolean; status: 'not_started' | 'open' | 'closed' | 'full'; message: string } => {
    const now = new Date();

    // Check if registration is required
    if (!event.registrationRequired) {
      return { isOpen: true, status: 'open', message: 'No registration required - Open entry' };
    }

    // Check if event is cancelled or completed
    if (event.status === 'cancelled') {
      return { isOpen: false, status: 'closed', message: 'Event cancelled' };
    }
    if (event.status === 'completed') {
      return { isOpen: false, status: 'closed', message: 'Event completed' };
    }

    // Check if registration is full
    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      return { isOpen: false, status: 'full', message: 'Registration full' };
    }

    // Check registration start date/time
    if (event.registrationStartDate) {
      const startDateTime = new Date(`${event.registrationStartDate}T${event.registrationStartTime || '00:00'}`);
      if (now < startDateTime) {
        const formattedDate = startDateTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const formattedTime = event.registrationStartTime || '12:00 AM';
        return {
          isOpen: false,
          status: 'not_started',
          message: `Registration opens on ${formattedDate} at ${formattedTime}`
        };
      }
    }

    // Check registration deadline
    if (event.registrationDeadline) {
      const deadlineDateTime = new Date(`${event.registrationDeadline}T${event.registrationDeadlineTime || '23:59'}`);
      if (now > deadlineDateTime) {
        return { isOpen: false, status: 'closed', message: 'Registration closed' };
      }
    }

    // Registration is open
    return { isOpen: true, status: 'open', message: 'Registration open' };
  };

  const openCreateForm = () => {
    resetForm();
    setEditingEvent(null);
    setShowForm(true);
  };

  const openEditForm = (ev: Event) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      organizer: ev.organizer,
      category: ev.category,
      maxParticipants: ev.maxParticipants ? String(ev.maxParticipants) : "",
      registrationRequired: ev.registrationRequired,
      department: ev.department || "",
      contactEmail: ev.contactEmail || "",
      contactPhone: ev.contactPhone || "",
      registrationStartDate: ev.registrationStartDate || "",
      registrationStartTime: ev.registrationStartTime || "",
      registrationDeadline: ev.registrationDeadline || "",
      registrationDeadlineTime: ev.registrationDeadlineTime || "",
      requirements: ev.requirements || "",
    });
    setShowForm(true);
    // close detail page if open
    setShowDetail(false);
    setDetailEvent(null);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time || !form.organizer.trim()) {
      alert("Please fill Title, Date, Time and Organizer.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const eventData = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim() || "TBA",
        organizer: form.organizer.trim(),
        category: form.category as Event["category"],
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
        currentParticipants: editingEvent?.currentParticipants || 0,
        status: (editingEvent?.status || "upcoming") as Event["status"],
        registrationRequired: form.registrationRequired,
        department: form.department.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        registrationStartDate: form.registrationStartDate || undefined,
        registrationStartTime: form.registrationStartTime || undefined,
        registrationDeadline: form.registrationDeadline || undefined,
        registrationDeadlineTime: form.registrationDeadlineTime || undefined,
        requirements: form.requirements.trim() || undefined,
      };

      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, eventData);
      } else {
        await eventService.createEvent(eventData);
      }

      await loadData(); // Reload data from Firestore
      setShowForm(false);
      setEditingEvent(null);
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;

    try {
      setSaving(true);
      setError(null);
      await eventService.deleteEvent(id);
      await loadData(); // Reload data from Firestore

      // if the deleted event is open in detail, close it
      if (detailEvent?.id === id) {
        setShowDetail(false);
        setDetailEvent(null);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string, newStatus: Event["status"]) => {
    try {
      setSaving(true);
      setError(null);
      await eventService.updateEventStatus(id, newStatus);
      await loadData(); // Reload data from Firestore

      // update detailEvent too
      if (detailEvent?.id === id) {
        setDetailEvent({ ...detailEvent, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      setError('Failed to update event status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const registerForEvent = async (id: string) => {
    try {
      setSaving(true);
      setError(null);
      await eventService.registerForEvent(id);
      await loadData(); // Reload data from Firestore
    } catch (error) {
      console.error('Error registering for event:', error);
      if (error instanceof Error && error.message.includes('full')) {
        alert("Registration full for this event.");
      } else {
        setError('Failed to register for event. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Filters ---------- */
  const filteredEvents = events.filter((ev) => {
    const text = `${ev.title} ${ev.description}`.toLowerCase();
    const matchesSearch = search.trim() === "" || text.includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || ev.category === filterCategory;
    const matchesStatus = filterStatus === "all" || ev.status === filterStatus;
    const matchesDepartment = filterDepartment === "all" || ev.organizer.toLowerCase().includes(filterDepartment.toLowerCase());
    return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
  });

  /* ---------- Popup keyboard handling ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDetail) {
          setShowDetail(false);
          setDetailEvent(null);
        } else if (showForm) {
          setShowForm(false);
          setEditingEvent(null);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showDetail, showForm, detailEvent]);

  /* ---------- Event Card (clickable) ---------- */
  const EventCard: React.FC<{ ev: Event }> = ({ ev }) => {
    const pct =
      ev.maxParticipants && ev.maxParticipants > 0
        ? Math.round((ev.currentParticipants / ev.maxParticipants) * 100)
        : 0;

    return (
      <article
        className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
        onClick={() => {
          setDetailEvent(ev);
          setShowDetail(true);
        }}
        role="button"
        aria-label={`Open details for ${ev.title}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{ev.title}</h3>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ev.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className={`text-xs px-2 py-1 rounded-full ${categoryBadge(ev.category)}`}>{ev.category}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(ev.status)}`}>{ev.status}</span>
              {ev.registrationRequired && <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-800">Registration</span>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">{new Date(ev.date).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">{ev.time}</div>
            </div>

            {/* action: simple More menu for small screens */}
            <div className="flex items-center gap-2">
              <button
                title="View"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailEvent(ev);
                  setShowDetail(true);
                }}
                className="p-2 rounded-md hover:bg-gray-50 text-gray-600"
              >
                <Eye className="w-4 h-4" />
              </button>

              {user?.role !== "student" && user?.role !== 'visitor' && (
                <div ref={actionRef} className="relative">
                  <button
                    aria-haspopup="true"
                    aria-expanded={openActionFor === ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionFor((cur) => (cur === ev.id ? null : ev.id));
                    }}
                    className="p-2 rounded-md hover:bg-gray-50 text-gray-600"
                    title="More"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openActionFor === ev.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(ev);
                          setOpenActionFor(null);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(ev.id, ev.status === "ongoing" ? "upcoming" : "ongoing");
                          setOpenActionFor(null);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Toggle Ongoing
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(ev.id);
                          setOpenActionFor(null);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{ev.location}</span>
            <Users className="w-4 h-4 ml-3" />
            <span className="truncate">{ev.organizer}</span>
          </div>

          {ev.maxParticipants && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Participants</span>
                <span>{ev.currentParticipants}/{ev.maxParticipants}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <div>Created: {new Date(ev.createdAt).toLocaleDateString()}</div>
          {ev.registrationRequired ? (
            <div className={`px-2 py-1 rounded-full font-medium ${(() => {
              const status = getRegistrationStatus(ev);
              if (status.status === 'open') return 'bg-green-100 text-green-700';
              if (status.status === 'not_started') return 'bg-amber-100 text-amber-700';
              if (status.status === 'full') return 'bg-slate-100 text-slate-700';
              return 'bg-red-100 text-red-700';
            })()
              }`}>
              {(() => {
                const status = getRegistrationStatus(ev);
                if (status.status === 'open') return '● Registration Open';
                if (status.status === 'not_started') return '○ Not Yet Open';
                if (status.status === 'full') return '● Registration Full';
                return '● Closed';
              })()}
            </div>
          ) : (
            <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Open Entry</div>
          )}
        </div>
      </article>
    );
  };

  /* ---------- Event Detail Page ---------- */
  const EventDetailPage: React.FC<{ ev: Event }> = ({ ev }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'participants'>('details');
    const [participantSearch, setParticipantSearch] = useState('');

    const pct =
      ev.maxParticipants && ev.maxParticipants > 0
        ? Math.round((ev.currentParticipants / ev.maxParticipants) * 100)
        : 0;

    // Generate demo participants for display
    const getDemoParticipants = () => {
      // Define a unified participant type with optional fields
      type DemoParticipant = {
        id: string;
        name: string;
        email: string;
        rollNumber?: string;
        department?: string;
        year?: string;
        div?: string;
        isExternal: boolean;
        collegeName?: string;
        collegeCity?: string;
        status: 'registered' | 'attended' | 'cancelled';
        registeredAt: string;
      };

      const collegeParticipants: DemoParticipant[] = [
        { id: 'p1', name: 'Rajesh Kumar', email: 'rajesh@dypsn.edu', rollNumber: 'CS2024001', department: 'Computer Science', year: '2nd', div: 'A', isExternal: false, status: 'registered', registeredAt: new Date().toISOString() },
        { id: 'p2', name: 'Priya Sharma', email: 'priya@dypsn.edu', rollNumber: 'CS2024002', department: 'Computer Science', year: '2nd', div: 'A', isExternal: false, status: 'registered', registeredAt: new Date().toISOString() },
        { id: 'p3', name: 'Amit Patel', email: 'amit@dypsn.edu', rollNumber: 'IT2024001', department: 'Information Technology', year: '3rd', div: 'B', isExternal: false, status: 'attended', registeredAt: new Date().toISOString() },
        { id: 'p4', name: 'Sneha Desai', email: 'sneha@dypsn.edu', rollNumber: 'EC2024001', department: 'Electronics', year: '2nd', div: 'A', isExternal: false, status: 'registered', registeredAt: new Date().toISOString() },
        { id: 'p5', name: 'Vikram Singh', email: 'vikram@dypsn.edu', rollNumber: 'ME2024001', department: 'Mechanical', year: '4th', div: 'C', isExternal: false, status: 'registered', registeredAt: new Date().toISOString() },
      ];

      const externalParticipants: DemoParticipant[] = ev.allowExternalParticipants ? [
        { id: 'e1', name: 'Ankit Verma', email: 'ankit@vjti.ac.in', collegeName: 'VJTI Mumbai', collegeCity: 'Mumbai', isExternal: true, status: 'registered', registeredAt: new Date().toISOString() },
        { id: 'e2', name: 'Kavya Reddy', email: 'kavya@coep.ac.in', collegeName: 'COEP Pune', collegeCity: 'Pune', isExternal: true, status: 'registered', registeredAt: new Date().toISOString() },
        { id: 'e3', name: 'Rohan Mehta', email: 'rohan@ict.ac.in', collegeName: 'ICT Mumbai', collegeCity: 'Mumbai', isExternal: true, status: 'attended', registeredAt: new Date().toISOString() },
      ] : [];

      return { collegeParticipants, externalParticipants };
    };

    const { collegeParticipants, externalParticipants } = getDemoParticipants();
    const allParticipants = [...collegeParticipants, ...externalParticipants];

    const filteredParticipants = allParticipants.filter(p =>
      p.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
      (p.rollNumber && p.rollNumber.toLowerCase().includes(participantSearch.toLowerCase())) ||
      (p.collegeName && p.collegeName.toLowerCase().includes(participantSearch.toLowerCase()))
    );

    // Export to Excel function
    const exportToExcel = () => {
      // Create CSV content
      const headers = ['Sr.No', 'Name', 'Email', 'Roll Number', 'Department', 'Year', 'Division', 'College', 'City', 'Status', 'Registration Date'];
      const rows = allParticipants.map((p, idx) => [
        idx + 1,
        p.name,
        p.email,
        p.rollNumber || 'N/A',
        p.department || 'N/A',
        p.year || 'N/A',
        p.div || 'N/A',
        p.isExternal ? p.collegeName : 'DYPSN (Our College)',
        p.isExternal ? p.collegeCity : 'Navi Mumbai',
        p.status,
        new Date(p.registeredAt).toLocaleDateString()
      ]);

      const csvContent = [
        // Event Info Header
        [`Event Report: ${ev.title}`],
        [`Date: ${new Date(ev.date).toLocaleDateString()} | Time: ${ev.time}`],
        [`Location: ${ev.location} | Organizer: ${ev.organizer}`],
        [`Category: ${ev.category} | Status: ${ev.status}`],
        [`Total Registrations: ${allParticipants.length}`],
        [`College Participants: ${collegeParticipants.length} | External Participants: ${externalParticipants.length}`],
        [],
        headers,
        ...rows
      ].map(row => row.join(',')).join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${ev.title.replace(/\s+/g, '_')}_Participants_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Check if user can register (only students and visitors)
    const canRegister = user?.role === 'student' || user?.role === 'visitor';
    // Check if user can perform CRUD operations
    const canManage = user?.role !== 'student' && user?.role !== 'visitor';

    // Full page detail view instead of popup
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => {
            setShowDetail(false);
            setDetailEvent(null);
          }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Events</span>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-6 border border-sky-100">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{ev.title}</h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(ev.status)}`}>{ev.status}</span>
              </div>
              <p className="text-slate-600 mt-3">{ev.description}</p>

              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryBadge(ev.category)}`}>{ev.category}</span>
                {ev.registrationRequired && <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">Registration Required</span>}
                {ev.isCollegeWide ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-medium">College-Wide Event</span>
                ) : ev.department && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">{ev.department}</span>
                )}
                {ev.allowExternalParticipants && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-medium">Open for External Colleges</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 px-6">
            <div className="flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                  ? 'text-sky-600 border-sky-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
              >
                Event Details
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'participants'
                  ? 'text-sky-600 border-sky-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
              >
                Participants ({allParticipants.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'details' ? (
              <div className="space-y-6">
                {/* Event Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-sky-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Date & Time</p>
                        <p className="font-medium text-slate-900">{new Date(ev.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-sm text-slate-600">{ev.time}{ev.endTime ? ` - ${ev.endTime}` : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Venue</p>
                        <p className="font-medium text-slate-900">{ev.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Organized By</p>
                        <p className="font-medium text-slate-900">{ev.organizer}</p>
                        {ev.isCollegeWide && <p className="text-xs text-purple-600">Full Campus Event</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participation Stats */}
                {ev.maxParticipants && (
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-600" />
                        Registration Progress
                      </h3>
                      <span className="text-lg font-bold text-slate-800">
                        {allParticipants.length}/{ev.maxParticipants} <span className="text-sm font-normal text-slate-500">Students</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${(allParticipants.length / ev.maxParticipants * 100) >= 90 ? 'bg-red-500' :
                            (allParticipants.length / ev.maxParticipants * 100) >= 70 ? 'bg-amber-500' : 'bg-sky-500'
                          }`}
                        style={{ width: `${Math.min(100, (allParticipants.length / ev.maxParticipants * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>{Math.round(allParticipants.length / ev.maxParticipants * 100)}% filled</span>
                      <span className="text-green-600 font-medium">{ev.maxParticipants - allParticipants.length} spots available</span>
                    </div>
                  </div>
                )}
                {/* Registration Timing Status */}
                {ev.registrationRequired && (ev.registrationStartDate || ev.registrationDeadline) && (
                  <div className={`p-4 rounded-xl border ${getRegistrationStatus(ev).status === 'open'
                    ? 'bg-green-50 border-green-200'
                    : getRegistrationStatus(ev).status === 'not_started'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className={`w-5 h-5 ${getRegistrationStatus(ev).status === 'open'
                        ? 'text-green-600'
                        : getRegistrationStatus(ev).status === 'not_started'
                          ? 'text-amber-600'
                          : 'text-red-600'
                        }`} />
                      <h3 className={`font-medium ${getRegistrationStatus(ev).status === 'open'
                        ? 'text-green-900'
                        : getRegistrationStatus(ev).status === 'not_started'
                          ? 'text-amber-900'
                          : 'text-red-900'
                        }`}>
                        {getRegistrationStatus(ev).message}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {ev.registrationStartDate && (
                        <div>
                          <p className="text-slate-500 text-xs">Opens</p>
                          <p className="font-medium text-slate-900">
                            {new Date(ev.registrationStartDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {ev.registrationStartTime && ` at ${ev.registrationStartTime}`}
                          </p>
                        </div>
                      )}
                      {ev.registrationDeadline && (
                        <div>
                          <p className="text-slate-500 text-xs">Closes</p>
                          <p className="font-medium text-slate-900">
                            {new Date(ev.registrationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {ev.registrationDeadlineTime && ` at ${ev.registrationDeadlineTime}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ev.contactEmail && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500 mb-1">Contact Email</p>
                      <p className="font-medium text-slate-900">{ev.contactEmail}</p>
                    </div>
                  )}
                  {ev.contactPhone && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500 mb-1">Contact Phone</p>
                      <p className="font-medium text-slate-900">{ev.contactPhone}</p>
                    </div>
                  )}
                  {ev.entryFee !== undefined && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500 mb-1">Entry Fee</p>
                      <p className="font-medium text-slate-900">{ev.entryFee === 0 ? 'Free Entry' : `₹${ev.entryFee}`}</p>
                    </div>
                  )}
                </div>

                {/* Requirements */}
                {ev.requirements && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <h3 className="font-medium text-amber-900 mb-2">Requirements & Prerequisites</h3>
                    <p className="text-sm text-amber-800">{ev.requirements}</p>
                  </div>
                )}

                {/* Eligibility */}
                {ev.eligibility && (
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="font-medium text-slate-900 mb-2">Eligibility</h3>
                    <p className="text-sm text-slate-700">{ev.eligibility}</p>
                  </div>
                )}

                {/* Prizes */}
                {ev.prizes && ev.prizes.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-200">
                    <h3 className="font-medium text-amber-900 mb-2">🏆 Prizes</h3>
                    <ul className="space-y-1">
                      {ev.prizes.map((prize, idx) => (
                        <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                          <span className="font-medium">{idx === 0 ? '1st:' : idx === 1 ? '2nd:' : idx === 2 ? '3rd:' : `${idx + 1}th:`}</span>
                          <span>{prize}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search and Export */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                  <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search participants..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  {canManage && (
                    <button
                      onClick={exportToExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Excel Report
                    </button>
                  )}
                </div>

                {/* College Participants */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-sky-50 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-medium text-sky-900 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      College Participants ({collegeParticipants.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Roll No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Year/Div</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredParticipants.filter(p => !p.isExternal).map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {p.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{p.name}</p>
                                  <p className="text-xs text-slate-500">{p.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700">{p.rollNumber}</td>
                            <td className="px-4 py-3 text-slate-700">{p.department}</td>
                            <td className="px-4 py-3 text-slate-700">{p.year} / {p.div}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'attended' ? 'bg-green-100 text-green-700' :
                                p.status === 'registered' ? 'bg-sky-100 text-sky-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {filteredParticipants.filter(p => !p.isExternal).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No college participants found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* External Participants */}
                {ev.allowExternalParticipants && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-purple-50 px-4 py-3 border-b border-slate-200">
                      <h3 className="font-medium text-purple-900 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        External College Participants ({externalParticipants.length})
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">College</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">City</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredParticipants.filter(p => p.isExternal).map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {p.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">{p.name}</p>
                                    <p className="text-xs text-slate-500">{p.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{p.collegeName}</td>
                              <td className="px-4 py-3 text-slate-700">{p.collegeCity}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'attended' ? 'bg-green-100 text-green-700' :
                                  p.status === 'registered' ? 'bg-purple-100 text-purple-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {filteredParticipants.filter(p => p.isExternal).length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No external participants found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0 bg-slate-50 rounded-b-2xl">
            <div className="flex flex-col gap-2">
              {/* Registration Status and Button */}
              {(() => {
                const regStatus = getRegistrationStatus(ev);

                // For students and visitors - show register button or status
                if (canRegister) {
                  if (!ev.registrationRequired) {
                    return (
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-xl text-sm font-medium">
                        ✓ No registration required - Open entry
                      </span>
                    );
                  }

                  if (regStatus.status === 'open') {
                    return (
                      <button
                        onClick={() => registerForEvent(ev.id)}
                        disabled={saving}
                        className="px-5 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Register Now
                      </button>
                    );
                  }

                  if (regStatus.status === 'not_started') {
                    return (
                      <div className="flex flex-col gap-1">
                        <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Registration Not Yet Open
                        </span>
                        <span className="text-xs text-slate-500 ml-1">{regStatus.message}</span>
                      </div>
                    );
                  }

                  if (regStatus.status === 'closed') {
                    return (
                      <span className="px-4 py-2 bg-red-100 text-red-800 rounded-xl text-sm font-medium flex items-center gap-2">
                        <X className="w-4 h-4" />
                        {regStatus.message}
                      </span>
                    );
                  }

                  if (regStatus.status === 'full') {
                    return (
                      <span className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Registration Full
                      </span>
                    );
                  }
                }

                return null;
              })()}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* CRUD operations - for teachers, HODs, admins */}
              {canManage && (
                <>
                  <button
                    onClick={() => toggleStatus(ev.id, ev.status === 'ongoing' ? 'completed' : ev.status === 'upcoming' ? 'ongoing' : 'upcoming')}
                    disabled={saving}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {ev.status === 'ongoing' ? 'Mark Completed' : ev.status === 'upcoming' ? 'Start Event' : 'Reopen'}
                  </button>
                  <button
                    onClick={() => openEditForm(ev)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this event? This cannot be undone.")) {
                        deleteEvent(ev.id);
                      }
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              )}

              <div className="text-xs text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
                Created: {new Date(ev.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Page layout ---------- */
  // If showing detail page, render it as full page content
  if (showDetail && detailEvent) {
    return <EventDetailPage ev={detailEvent} />;
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
            {user?.role === "student" ? "Events" : "Event Management"}
          </h1>
          <p className="text-sm text-slate-500">
            {user?.role === "student"
              ? "Browse upcoming college events"
              : "Create and manage events, workshops and activities"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-sm font-medium">Refresh</span>
          </button>

          {user?.role !== "student" && user?.role !== 'visitor' && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Add Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            <p className="text-slate-700">Loading events...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 text-sm"
              />
            </div>

            {/* desktop filters */}
            <div className="hidden md:flex items-center gap-2">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics & Communication</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="Civil">Civil</option>
                <option value="Cultural Committee">Cultural Committee</option>
                <option value="Sports Committee">Sports Committee</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                <option>Academic</option>
                <option>Cultural</option>
                <option>Sports</option>
                <option>Technical</option>
                <option>Social</option>
                <option>Other</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* mobile filters toggle */}
            <button
              onClick={() => setShowMobileFilters((s) => !s)}
              className="md:hidden p-2 rounded-md bg-gray-100 hover:bg-gray-200"
              aria-expanded={showMobileFilters}
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* mobile filters */}
        {showMobileFilters && (
          <div className="mt-3 md:hidden grid grid-cols-1 gap-2">
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics & Communication</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
              <option value="Civil">Civil</option>
              <option value="Cultural Committee">Cultural Committee</option>
              <option value="Sports Committee">Sports Committee</option>
            </select>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="all">All Categories</option>
              <option>Academic</option>
              <option>Cultural</option>
              <option>Sports</option>
              <option>Technical</option>
              <option>Social</option>
              <option>Other</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Grid */}
      <section>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No events found</h3>
            <p className="text-sm text-gray-600">Try changing filters or add a new event.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <EventCard ev={ev} key={ev.id} />
            ))}
          </div>
        )}
      </section>

      {/* Floating Add button for mobile */}
      {user?.role !== "student" && user?.role !== 'visitor' && (
        <div className="fixed right-4 bottom-6 md:hidden z-40">
          <button
            onClick={openCreateForm}
            className="p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
            aria-label="Add event"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Form modal (Add/Edit) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{editingEvent ? "Edit Event" : "Create Event"}</h2>
                <p className="text-xs text-gray-500">Fill details and save</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={submitForm} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Title *</label>
                  <input
                    className="w-full px-3 py-2 border rounded"
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={form.category}
                    onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                  >
                    <option>Academic</option>
                    <option>Cultural</option>
                    <option>Sports</option>
                    <option>Technical</option>
                    <option>Social</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded"
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded"
                    value={form.date}
                    onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border rounded"
                    value={form.time}
                    onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Location</label>
                  <input className="w-full px-3 py-2 border rounded" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Organizer *</label>
                  <input className="w-full px-3 py-2 border rounded" value={form.organizer} onChange={(e) => setForm((s) => ({ ...s, organizer: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Max participants</label>
                  <input type="number" min={0} className="w-full px-3 py-2 border rounded" value={form.maxParticipants} onChange={(e) => setForm((s) => ({ ...s, maxParticipants: e.target.value }))} />
                </div>

                <div className="flex items-center gap-3">
                  <input id="reg" type="checkbox" checked={form.registrationRequired} onChange={(e) => setForm((s) => ({ ...s, registrationRequired: e.target.checked }))} className="h-4 w-4" />
                  <label htmlFor="reg" className="text-sm text-gray-700">Registration required</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Department</label>
                  <input className="w-full px-3 py-2 border rounded" value={form.department} onChange={(e) => setForm((s) => ({ ...s, department: e.target.value }))} placeholder="e.g., Computer Science" />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Contact Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded" value={form.contactEmail} onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))} placeholder="contact@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Contact Phone</label>
                  <input type="tel" className="w-full px-3 py-2 border rounded" value={form.contactPhone} onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))} placeholder="+91 9876543210" />
                </div>
              </div>

              {/* Registration Timing Section */}
              {form.registrationRequired && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-4">
                  <h3 className="text-sm font-medium text-amber-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Registration Timing (Auto Open/Close)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Registration Opens On</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded"
                        value={form.registrationStartDate}
                        onChange={(e) => setForm((s) => ({ ...s, registrationStartDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Opening Time</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border rounded"
                        value={form.registrationStartTime}
                        onChange={(e) => setForm((s) => ({ ...s, registrationStartTime: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Registration Closes On</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border rounded"
                        value={form.registrationDeadline}
                        onChange={(e) => setForm((s) => ({ ...s, registrationDeadline: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Closing Time</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border rounded"
                        value={form.registrationDeadlineTime}
                        onChange={(e) => setForm((s) => ({ ...s, registrationDeadlineTime: e.target.value }))}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-amber-700">
                    Leave dates empty for manual registration control. When set, registration will automatically open and close based on these timings.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-700 mb-1">Requirements</label>
                <textarea rows={2} className="w-full px-3 py-2 border rounded" value={form.requirements} onChange={(e) => setForm((s) => ({ ...s, requirements: e.target.value }))} placeholder="Any special requirements or prerequisites..." />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => { setShowForm(false); setEditingEvent(null); resetForm(); }} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingEvent ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingEvent ? "Update Event" : "Create Event"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;
