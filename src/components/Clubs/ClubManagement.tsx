// ClubManagement.enhanced.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Filter,
  Search,
  UserPlus,
  UserMinus,
  Award,
  BookOpen,
  MoreVertical,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  X
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { clubService, clubMemberService } from "../../firebase/firestore";
import { Club, ClubMember } from "../../types";


const categoryColor = (c: Club['category']) => {
  switch (c) {
    case "Academic": return "bg-purple-100 text-purple-800";
    case "Cultural": return "bg-pink-100 text-pink-800";
    case "Sports": return "bg-orange-100 text-orange-800";
    case "Technical": return "bg-blue-100 text-blue-800";
    case "Social": return "bg-green-100 text-green-800";
    case "Literary": return "bg-indigo-100 text-indigo-800";
    case "Other": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const statusColor = (s: Club['status']) => {
  switch (s) {
    case "active": return "bg-green-100 text-green-800";
    case "inactive": return "bg-gray-100 text-gray-800";
    case "suspended": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const ClubManagement: React.FC = () => {
  const { user } = useAuth();

  // Data
  const [clubs, setClubs] = useState<Club[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, ClubMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showClubDetail, setShowClubDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  const [showMembers, setShowMembers] = useState(false);
  const [activeClubIdForMembers, setActiveClubIdForMembers] = useState<string | null>(null);

  // member form
  const [editingMember, setEditingMember] = useState<{ clubId: string; member: ClubMember | null } | null>(null);
  const [memberForm, setMemberForm] = useState<{ name: string; email: string; role: ClubMember["role"]; joinDate: string; status: ClubMember["status"]; studentId?: string; phone?: string; department?: string; year?: string }>({
    name: "",
    email: "",
    role: "Member",
    joinDate: new Date().toISOString().slice(0,10),
    status: "active",
    studentId: "",
    phone: "",
    department: "",
    year: "",
  });

  // club form
  const [clubForm, setClubForm] = useState({
    name: "",
    description: "",
    category: "Academic" as Club['category'],
    president: "",
    presidentEmail: "",
    presidentPhone: "",
    facultyAdvisor: "",
    advisorEmail: "",
    maxMembers: "",
    establishedDate: "",
    activities: "",
    achievements: "",
    department: "",
    meetingSchedule: "",
    budget: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
    },
  });

  // filters + search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // action menu state (which club id's menu is open)
  const [openActionFor, setOpenActionFor] = useState<string | null>(null);

  // refs for focus management
  const clubNameRef = useRef<HTMLInputElement | null>(null);
  const memberNameRef = useRef<HTMLInputElement | null>(null);

  /* ---------- Document click handling for closing action menus ---------- */
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const tgt = e.target as Element | null;
      if (!openActionFor) return;
      if (!tgt) return;
      // if click outside the element that has data-action-root="{openActionFor}", close menu
      if (!tgt.closest(`[data-action-root="${openActionFor}"]`)) {
        setOpenActionFor(null);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openActionFor]);

  /* ---------- Keyboard handling (Escape): close any open modal */ 
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowClubDetail(false);
        setShowForm(false);
        setShowMembers(false);
        setEditingClub(null);
        setEditingMember(null);
        setOpenActionFor(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Load data from Firestore
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const clubsData = await clubService.getAllClubs();
      setClubs(clubsData);
      
      // Load members for each club
      const membersData: Record<string, ClubMember[]> = {};
      for (const club of clubsData) {
        const members = await clubMemberService.getClubMembers(club.id);
        membersData[club.id] = members;
      }
      setMembersMap(membersData);
    } catch (error) {
      console.error('Error loading clubs:', error);
      setError('Failed to load clubs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stable form handlers to prevent re-renders
  const handleMemberFormChange = useCallback((field: string, value: any) => {
    setMemberForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClubFormChange = useCallback((field: string, value: any) => {
    setClubForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Memoize form key to prevent unnecessary re-renders
  const memberFormKey = useMemo(() => {
    return editingMember?.member?.id || 'new';
  }, [editingMember?.member?.id]);

  /* ---------- Focus management when forms open ---------- */
  useEffect(() => {
    if (showForm) {
      // small delay to ensure modal is in DOM
      setTimeout(() => clubNameRef.current?.focus(), 50);
    }
  }, [showForm]);

  useEffect(() => {
    if (showMembers && editingMember) {
      setTimeout(() => memberNameRef.current?.focus(), 50);
    }
  }, [showMembers, editingMember]);

  /* ---------- Filtering logic ---------- */
  const filteredClubs = clubs.filter((c) => {
    const text = `${c.name} ${c.description}`.toLowerCase();
    const matchesSearch = searchTerm.trim() === "" || text.includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || c.category === filterCategory;
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesDepartment = filterDepartment === "all" || c.facultyAdvisor.toLowerCase().includes(filterDepartment.toLowerCase());
    return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
  });

  /* ---------- Club CRUD ---------- */
  const openCreateClub = () => {
    setEditingClub(null);
    setClubForm({
      name: "",
      description: "",
      category: "Academic",
      president: "",
      presidentEmail: "",
      presidentPhone: "",
      facultyAdvisor: "",
      advisorEmail: "",
      maxMembers: "",
      establishedDate: "",
      activities: "",
      achievements: "",
      department: "",
      meetingSchedule: "",
      budget: "",
      socialMedia: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
      },
    });
    setShowForm(true);
  };

  const openEditClub = (club: Club) => {
    setEditingClub(club);
    setClubForm({
      name: club.name,
      description: club.description,
      category: club.category,
      president: club.president,
      presidentEmail: club.presidentEmail,
      presidentPhone: club.presidentPhone,
      facultyAdvisor: club.facultyAdvisor,
      advisorEmail: club.advisorEmail,
      maxMembers: club.maxMembers?.toString() || "",
      establishedDate: club.establishedDate,
      activities: club.activities.join(", "),
      achievements: club.achievements.join(", "),
      department: club.department || "",
      meetingSchedule: club.meetingSchedule || "",
      budget: club.budget?.toString() || "",
      socialMedia: {
        facebook: club.socialMedia?.facebook || "",
        instagram: club.socialMedia?.instagram || "",
        twitter: club.socialMedia?.twitter || "",
        linkedin: club.socialMedia?.linkedin || "",
      },
    });
    setShowForm(true);
  };

  const submitClubForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubForm.name.trim()) {
      alert("Please provide club name.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const clubData = {
        name: clubForm.name.trim(),
        description: clubForm.description.trim(),
        category: clubForm.category as Club['category'],
        president: clubForm.president.trim(),
        presidentEmail: clubForm.presidentEmail.trim(),
        presidentPhone: clubForm.presidentPhone.trim(),
        facultyAdvisor: clubForm.facultyAdvisor.trim(),
        advisorEmail: clubForm.advisorEmail.trim(),
        totalMembers: editingClub?.totalMembers || 0,
        maxMembers: clubForm.maxMembers ? parseInt(clubForm.maxMembers, 10) : undefined,
        establishedDate: clubForm.establishedDate || new Date().toISOString().slice(0, 10),
        status: (editingClub?.status || "active") as Club['status'],
        activities: clubForm.activities ? clubForm.activities.split(",").map(a => a.trim()).filter(Boolean) : [],
        achievements: clubForm.achievements ? clubForm.achievements.split(",").map(a => a.trim()).filter(Boolean) : [],
        department: clubForm.department?.trim() || undefined,
        meetingSchedule: clubForm.meetingSchedule?.trim() || undefined,
        budget: clubForm.budget ? parseFloat(clubForm.budget) : undefined,
        socialMedia: (() => {
          const social = clubForm.socialMedia;
          if (!social) return undefined;
          
          const cleanedSocial: any = {};
          if (social.facebook?.trim()) cleanedSocial.facebook = social.facebook.trim();
          if (social.instagram?.trim()) cleanedSocial.instagram = social.instagram.trim();
          if (social.twitter?.trim()) cleanedSocial.twitter = social.twitter.trim();
          if (social.linkedin?.trim()) cleanedSocial.linkedin = social.linkedin.trim();
          
          return Object.keys(cleanedSocial).length > 0 ? cleanedSocial : undefined;
        })(),
      };

      if (editingClub) {
        await clubService.updateClub(editingClub.id, clubData);
      } else {
        await clubService.createClub(clubData);
      }

      await loadData(); // Reload data from Firestore
      setShowForm(false);
      setEditingClub(null);
    } catch (error) {
      console.error('Error saving club:', error);
      setError('Failed to save club. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteClub = async (id: string) => {
    if (!confirm("Delete this club? This action cannot be undone.")) return;
    
    try {
      setSaving(true);
      setError(null);
      await clubService.deleteClub(id);
      await loadData(); // Reload data from Firestore
      
      if (selectedClub?.id === id) {
        setSelectedClub(null);
        setShowClubDetail(false);
      }
      if (activeClubIdForMembers === id) {
        setActiveClubIdForMembers(null);
        setShowMembers(false);
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      setError('Failed to delete club. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleClubStatus = async (id: string) => {
    try {
      setSaving(true);
      setError(null);
      const club = clubs.find(c => c.id === id);
      if (club) {
        const newStatus = club.status === "active" ? "inactive" : "active";
        await clubService.updateClubStatus(id, newStatus);
        await loadData(); // Reload data from Firestore
      }
    } catch (error) {
      console.error('Error updating club status:', error);
      setError('Failed to update club status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Members ---------- */
  const openMembersModal = (clubId: string) => {
    setActiveClubIdForMembers(clubId);
    setShowMembers(true);
    setEditingMember(null);
  };

  const exportMembersCSV = (clubId: string) => {
    const members = membersMap[clubId] || [];
    const header = ["Name", "Email", "Role", "Join Date", "Status"];
    const rows = members.map(m => [m.name, m.email, m.role, new Date(m.joinDate).toLocaleDateString(), m.status]);
    const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(clubs.find(c=>c.id===clubId)?.name || "members").replace(/\s+/g,'_')}_members.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAddMemberForm = (clubId: string) => {
    setEditingMember({ clubId, member: null });
    setMemberForm({ 
      name: "", 
      email: "", 
      role: "Member", 
      joinDate: new Date().toISOString().slice(0,10), 
      status: "active",
      studentId: "",
      phone: "",
      department: "",
      year: "",
    });
  };

  const openEditMemberForm = (clubId: string, member: ClubMember) => {
    setEditingMember({ clubId, member });
    setMemberForm({ 
      name: member.name, 
      email: member.email, 
      role: member.role, 
      joinDate: member.joinDate, 
      status: member.status,
      studentId: member.studentId || "",
      phone: member.phone || "",
      department: member.department || "",
      year: member.year || "",
    });
  };

  const submitMemberForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    try {
      setSaving(true);
      setError(null);
      const { clubId, member } = editingMember;
      
      const memberData = {
        clubId,
        name: memberForm.name.trim(),
        email: memberForm.email.trim(),
        role: memberForm.role,
        joinDate: memberForm.joinDate,
        status: memberForm.status,
        studentId: memberForm.studentId?.trim() || undefined,
        phone: memberForm.phone?.trim() || undefined,
        department: memberForm.department?.trim() || undefined,
        year: memberForm.year?.trim() || undefined,
      };

      if (member) {
        await clubMemberService.updateMember(member.id, memberData);
      } else {
        await clubMemberService.addMember(memberData);
      }

      await loadData(); // Reload data from Firestore
      setEditingMember(null);
      setMemberForm({ 
        name: "", 
        email: "", 
        role: "Member", 
        joinDate: new Date().toISOString().slice(0,10), 
        status: "active",
        studentId: "",
        phone: "",
        department: "",
        year: "",
      });
    } catch (error) {
      console.error('Error saving member:', error);
      setError('Failed to save member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (clubId: string, memberId: string) => {
    if (!confirm("Remove this member?")) return;
    
    try {
      setSaving(true);
      setError(null);
      await clubMemberService.removeMember(memberId);
      await loadData(); // Reload data from Firestore
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Card & Popups ---------- */

  const openClubDetail = (club: Club) => {
    setSelectedClub(club);
    setShowClubDetail(true);
  };

  const closeClubDetail = () => {
    setSelectedClub(null);
    setShowClubDetail(false);
  };

  const ClubCard: React.FC<{ club: Club }> = ({ club }) => {
    const pct = club.maxMembers && club.maxMembers > 0 ? Math.round((club.totalMembers / club.maxMembers) * 100) : 0;

    return (
      <article
        className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
        onClick={() => openClubDetail(club)}
        aria-label={`Open details for ${club.name}`}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{club.name}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{club.description}</p>

            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className={`text-xs px-2 py-1 rounded-full ${categoryColor(club.category)}`}>{club.category}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColor(club.status)}`}>{club.status}</span>
            </div>
          </div>

          <div
            className="ml-3 flex items-start gap-2"
            onClick={(e) => e.stopPropagation()}
            // attach a root attribute for outside-click detection keyed by club id
            data-action-root={club.id}
          >
            <button
              title="Members"
              onClick={() => { openMembersModal(club.id); }}
              className="p-2 rounded-md hover:bg-gray-50 text-gray-600"
              aria-label={`Open members for ${club.name}`}
            >
              <Users className="w-4 h-4" />
            </button>

            {user?.role !== "student" && user?.role !== 'visitor' && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenActionFor((cur) => (cur === club.id ? null : club.id)); }}
                  className="p-2 rounded-md hover:bg-gray-50 text-gray-600"
                  aria-haspopup="true"
                  aria-expanded={openActionFor === club.id}
                  aria-controls={`action-menu-${club.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {openActionFor === club.id && (
                  <div id={`action-menu-${club.id}`} className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-40">
                    <button onClick={() => { openEditClub(club); setOpenActionFor(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => { toggleClubStatus(club.id); setOpenActionFor(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4" /> Toggle Status
                    </button>
                    <button onClick={() => { deleteClub(club.id); setOpenActionFor(null); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex-1">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Award className="w-4 h-4" />
            <span className="truncate">{club.facultyAdvisor}</span>
            <Mail className="w-4 h-4 ml-3" />
            <span className="truncate">{club.advisorEmail}</span>
          </div>

          {club.maxMembers && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Members</span>
                <span>{club.totalMembers}/{club.maxMembers} ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Established: {new Date(club.establishedDate).toLocaleDateString()}
        </div>
      </article>
    );
  };

  const ClubDetailPopup: React.FC<{ club: Club }> = ({ club }) => {
    const members = membersMap[club.id] || [];
    const pct = club.maxMembers && club.maxMembers > 0 ? Math.round((club.totalMembers / club.maxMembers) * 100) : 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${club.name} details`}>
        <div className="absolute inset-0 bg-black/50" onClick={closeClubDetail} />
        <div className="relative z-50 bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
          {/* Header - Fixed */}
          <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4 flex-shrink-0">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">{club.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{club.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className={`text-xs px-2 py-1 rounded-full ${categoryColor(club.category)}`}>{club.category}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor(club.status)}`}>{club.status}</span>
              </div>
            </div>

            <button onClick={closeClubDetail} className="text-gray-600 hover:text-gray-900 p-2 rounded" aria-label="Close details">×</button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600 flex items-center gap-2"><Award className="w-4 h-4" /> Advisor: <span className="font-medium text-gray-900">{club.facultyAdvisor}</span></div>
                <div className="text-sm text-gray-600 flex items-center gap-2"><Mail className="w-4 h-4" /> Advisor email: <span className="font-medium text-gray-900">{club.advisorEmail}</span></div>
                <div className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4" /> President: <span className="font-medium text-gray-900">{club.president}</span> ({club.presidentPhone})</div>
                <div className="text-sm text-gray-600">Created: {new Date(club.createdAt).toLocaleDateString()}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Established</div>
                <div className="font-medium text-gray-900">{new Date(club.establishedDate).toLocaleDateString()}</div>

                {club.maxMembers && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Members: {club.totalMembers}/{club.maxMembers} ({pct}%)</div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div className="h-3 bg-blue-600 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Activities</h4>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {club.activities.length ? club.activities.map((a, i) => <li key={i}>{a}</li>) : <li className="text-gray-400">No activities listed</li>}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Achievements</h4>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {club.achievements.length ? club.achievements.map((a, i) => <li key={i}>{a}</li>) : <li className="text-gray-400">No achievements listed</li>}
              </ul>
            </div>

            <div className="text-sm text-gray-600">Members: <span className="font-medium text-gray-900">{members.length}</span></div>
          </div>

          {/* Footer - Fixed */}
          <div className="p-5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => exportMembersCSV(club.id)} className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2" aria-label="Export members">
                <BookOpen className="w-4 h-4" /> Export Members
              </button>
              <button onClick={() => openMembersModal(club.id)} className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center gap-2" aria-label="Manage members">
                <UserPlus className="w-4 h-4" /> Manage Members
              </button>
            </div>

            {user?.role !== "student" && user?.role !== 'visitor' && (
              <div className="flex items-center gap-2">
                <button onClick={() => openEditClub(club)} className="px-3 py-2 bg-white border rounded-md flex items-center gap-2" aria-label="Edit club">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { if (confirm("Delete this club?")) deleteClub(club.id); }} className="px-3 py-2 bg-white border text-red-600 rounded-md flex items-center gap-2" aria-label="Delete club">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MembersModal: React.FC<{ clubId: string }> = ({ clubId }) => {
    const club = clubs.find(c => c.id === clubId)!;
    const members = membersMap[clubId] || [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${club.name} members`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowMembers(false)} />
        <div className="relative z-50 bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{club.name} — Members</h3>
              <div className="text-sm text-gray-500">Total members: {members.length}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => exportMembersCSV(clubId)} className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={() => { openAddMemberForm(clubId); }} className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
              <button onClick={() => setShowMembers(false)} className="text-gray-600 p-2 rounded" aria-label="Close members">×</button>
            </div>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg" aria-label={`${club.name} members table`}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Join Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                      <td className="px-4 py-3 text-gray-700">{m.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          m.role === "President" ? "bg-purple-100 text-purple-800" :
                          m.role === "Vice President" ? "bg-blue-100 text-blue-800" :
                          m.role === "Secretary" ? "bg-green-100 text-green-800" :
                          m.role === "Treasurer" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{m.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{new Date(m.joinDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${m.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{m.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEditMemberForm(clubId, m)} className="text-blue-600 hover:text-blue-800" aria-label={`Edit ${m.name}`}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeMember(clubId, m.id)} className="text-red-600 hover:text-red-800" aria-label={`Remove ${m.name}`}>
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {members.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No members</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Member add/edit form */}
            {editingMember && editingMember.clubId === clubId && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">{editingMember.member ? "Edit Member" : "Add Member"}</h4>
                <form key={memberFormKey} onSubmit={submitMemberForm} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Name</label>
                    <input 
                      key={`name-${memberFormKey}`}
                      ref={memberNameRef} 
                      value={memberForm.name} 
                      onChange={(e) => handleMemberFormChange('name', e.target.value)} 
                      className="w-full px-3 py-2 border rounded" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Email</label>
                    <input type="email" value={memberForm.email} onChange={(e) => handleMemberFormChange('email', e.target.value)} className="w-full px-3 py-2 border rounded" required />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Role</label>
                    <select value={memberForm.role} onChange={(e) => handleMemberFormChange('role', e.target.value as ClubMember["role"])} className="w-full px-3 py-2 border rounded">
                      <option>President</option>
                      <option>Vice President</option>
                      <option>Secretary</option>
                      <option>Treasurer</option>
                      <option>Member</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Join Date</label>
                    <input type="date" value={memberForm.joinDate} onChange={(e) => handleMemberFormChange('joinDate', e.target.value)} className="w-full px-3 py-2 border rounded" />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
                    <input id="m-status" type="checkbox" checked={memberForm.status === "active"} onChange={(e) => handleMemberFormChange('status', e.target.checked ? "active" : "inactive")} className="h-4 w-4" />
                    <label htmlFor="m-status" className="text-sm text-gray-700">Active</label>
                    <div className="ml-auto flex gap-2">
                      <button type="button" onClick={() => { setEditingMember(null); setMemberForm({ name: "", email: "", role: "Member", joinDate: new Date().toISOString().slice(0,10), status: "active", studentId: "", phone: "", department: "", year: "" }); }} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
                      <button type="submit" disabled={saving} className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {editingMember.member ? 'Saving...' : 'Adding...'}
                          </>
                        ) : (
                          editingMember.member ? "Save" : "Add"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Layout ---------- */

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{user?.role === "student" ? "Clubs" : "Club Management"}</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.role === "student" ? "Explore student clubs" : "Create and manage student clubs"}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {user?.role !== "student" && user?.role !== 'visitor' && (
            <button onClick={openCreateClub} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Club
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
            <p className="text-blue-800">Loading clubs...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search clubs by name or description" className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="hidden md:flex items-center gap-2">
              <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics & Communication</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="Civil">Civil</option>
                <option value="Cultural">Cultural Committee</option>
                <option value="Sports">Sports Committee</option>
              </select>

              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Categories</option>
                <option>Academic</option>
                <option>Cultural</option>
                <option>Sports</option>
                <option>Technical</option>
                <option>Social</option>
                <option>Literary</option>
                <option>Other</option>
              </select>

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileFilters(s => !s)} className="md:hidden p-2 rounded-md bg-gray-100 hover:bg-gray-200" aria-expanded={showMobileFilters} aria-label="Toggle filters">
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
              <option value="Cultural">Cultural Committee</option>
              <option value="Sports">Sports Committee</option>
            </select>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="all">All Categories</option>
              <option>Academic</option>
              <option>Cultural</option>
              <option>Sports</option>
              <option>Technical</option>
              <option>Social</option>
              <option>Literary</option>
              <option>Other</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        )}
      </div>

      {/* Grid */}
      <section>
        {filteredClubs.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No clubs found</h3>
            <p className="text-sm text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map(c => <ClubCard club={c} key={c.id} />)}
          </div>
        )}
      </section>

      {/* Floating Add button for mobile */}
      {user?.role !== "student" && user?.role !== 'visitor' && (
        <div className="fixed right-4 bottom-6 md:hidden z-40">
          <button onClick={openCreateClub} className="p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700" aria-label="Add club">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Club detail popup */}
      {showClubDetail && selectedClub && <ClubDetailPopup club={selectedClub} />}

      {/* Club form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-label={editingClub ? "Edit club" : "Add club"}>
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{editingClub ? "Edit Club" : "Add Club"}</h3>
                <p className="text-sm text-gray-500">{editingClub ? "Update club details" : "Create a new club"}</p>
              </div>
              <button onClick={() => { setShowForm(false); setEditingClub(null); }} className="text-gray-600 p-2 rounded" aria-label="Close form">×</button>
            </div>

            <form onSubmit={submitClubForm} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Club Name</label>
                  <input ref={clubNameRef} className="w-full px-3 py-2 border rounded" value={clubForm.name} onChange={(e) => setClubForm(s => ({ ...s, name: e.target.value }))} required />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border rounded" value={clubForm.category} onChange={(e) => setClubForm(s => ({ ...s, category: e.target.value as Club['category'] }))}>
                    <option>Academic</option>
                    <option>Cultural</option>
                    <option>Sports</option>
                    <option>Technical</option>
                    <option>Social</option>
                    <option>Literary</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border rounded" rows={3} value={clubForm.description} onChange={(e) => setClubForm(s => ({ ...s, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">President Name</label>
                  <input className="w-full px-3 py-2 border rounded" value={clubForm.president} onChange={(e) => setClubForm(s => ({ ...s, president: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">President Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded" value={clubForm.presidentEmail} onChange={(e) => setClubForm(s => ({ ...s, presidentEmail: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">President Phone</label>
                  <input className="w-full px-3 py-2 border rounded" value={clubForm.presidentPhone} onChange={(e) => setClubForm(s => ({ ...s, presidentPhone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Faculty Advisor</label>
                  <input className="w-full px-3 py-2 border rounded" value={clubForm.facultyAdvisor} onChange={(e) => setClubForm(s => ({ ...s, facultyAdvisor: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Advisor Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded" value={clubForm.advisorEmail} onChange={(e) => setClubForm(s => ({ ...s, advisorEmail: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Max Members (optional)</label>
                  <input type="number" min={0} className="w-full px-3 py-2 border rounded" value={clubForm.maxMembers} onChange={(e) => setClubForm(s => ({ ...s, maxMembers: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Established Date</label>
                <input type="date" className="w-full px-3 py-2 border rounded" value={clubForm.establishedDate} onChange={(e) => setClubForm(s => ({ ...s, establishedDate: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Activities (comma separated)</label>
                <textarea className="w-full px-3 py-2 border rounded" rows={2} value={clubForm.activities} onChange={(e) => setClubForm(s => ({ ...s, activities: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Achievements (comma separated)</label>
                <textarea className="w-full px-3 py-2 border rounded" rows={2} value={clubForm.achievements} onChange={(e) => setClubForm(s => ({ ...s, achievements: e.target.value }))} />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => { setShowForm(false); setEditingClub(null); }} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingClub ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingClub ? "Update Club" : "Create Club"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members modal */}
      {showMembers && activeClubIdForMembers && <MembersModal clubId={activeClubIdForMembers} />}
    </div>
  );
};

export default ClubManagement;
