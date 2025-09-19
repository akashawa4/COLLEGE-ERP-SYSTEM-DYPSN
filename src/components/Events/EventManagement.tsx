// EventManagement.popup.tsx
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
  X
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { eventService } from "../../firebase/firestore";
import { Event } from "../../types";


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

  // Detail popup
  const [showDetail, setShowDetail] = useState(false);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

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
      const eventsData = await eventService.getAllEvents();
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
    registrationDeadline: "",
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
      registrationDeadline: "",
      requirements: "",
    });

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
      registrationDeadline: ev.registrationDeadline || "",
      requirements: ev.requirements || "",
    });
    setShowForm(true);
    // close detail popup if open
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
        registrationDeadline: form.registrationDeadline || undefined,
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
          <div>{ev.registrationRequired ? "Registration required" : "Open entry"}</div>
        </div>
      </article>
    );
  };

  /* ---------- Detail popup ---------- */
  const DetailPopup: React.FC<{ ev: Event }> = ({ ev }) => {
    const pct =
      ev.maxParticipants && ev.maxParticipants > 0
        ? Math.round((ev.currentParticipants / ev.maxParticipants) * 100)
        : 0;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        aria-modal="true"
        role="dialog"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            setShowDetail(false);
            setDetailEvent(null);
          }}
        />
        <div
          ref={detailRef}
          className="relative z-50 bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl"
        >
          {/* Header - Fixed */}
          <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">{ev.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{ev.description}</p>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className={`text-xs px-2 py-1 rounded-full ${categoryBadge(ev.category)}`}>{ev.category}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(ev.status)}`}>{ev.status}</span>
                {ev.registrationRequired && <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-800">Registration</span>}
              </div>
            </div>

            <button
              aria-label="Close"
              onClick={() => {
                setShowDetail(false);
                setDetailEvent(null);
              }}
              className="text-gray-600 hover:text-gray-900 p-2 rounded"
            >
              ×
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-800">{new Date(ev.date).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{ev.time}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div className="text-sm text-gray-700">{ev.location}</div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div className="text-sm text-gray-700">{ev.organizer}</div>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="text-sm text-gray-700">{new Date(ev.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {ev.maxParticipants && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <div>Participants</div>
                  <div>{ev.currentParticipants}/{ev.maxParticipants} ({pct}%)</div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div className="h-3 bg-blue-600 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="p-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              {ev.registrationRequired ? (
                <button
                  onClick={() => registerForEvent(ev.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Register
                </button>
              ) : (
                <button className="px-4 py-2 bg-gray-100 rounded-lg">No registration required</button>
              )}

              <button
                className="px-4 py-2 bg-white border rounded-lg text-sm"
                onClick={() => alert("Share / export action placeholder")}
              >
                Share
              </button>
            </div>

            <div className="flex items-center gap-2">
              {user?.role !== "student" && user?.role !== 'visitor' && (
                <>
                  <button
                    onClick={() => openEditForm(ev)}
                    className="px-3 py-2 bg-white border rounded-md flex items-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Delete this event?")) {
                        deleteEvent(ev.id);
                      }
                    }}
                    className="px-3 py-2 bg-white border rounded-md text-sm text-red-600"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" /> Delete
                  </button>
                </>
              )}

              <div className="text-xs text-gray-500">
                Status: <span className="font-medium">{ev.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Page layout ---------- */
  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {user?.role === "student" ? "Events" : "Event Management"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {user?.role === "student"
              ? "Browse upcoming college events"
              : "Create and manage events, workshops and activities"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {user?.role !== "student" && user?.role !== 'visitor' && (
            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Event</span>
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-800">Loading events...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or description"
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
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

      {/* Detail popup */}
      {showDetail && detailEvent && <DetailPopup ev={detailEvent} />}

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

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Registration Deadline</label>
                  <input type="date" className="w-full px-3 py-2 border rounded" value={form.registrationDeadline} onChange={(e) => setForm((s) => ({ ...s, registrationDeadline: e.target.value }))} />
                </div>
              </div>

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
