// InstitutionSettings.responsive.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Save,
  Calendar,
  DollarSign,
  Building2,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  MoreVertical,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { institutionService } from '../../firebase/firestore';
import { AcademicYear, FeeStructureItem, InstitutionInfo } from '../../types';

// Indian Reservation Categories
const INDIAN_CATEGORIES = [
  'Open',
  'OBC (Other Backward Classes)',
  'SC (Scheduled Castes)',
  'ST (Scheduled Tribes)',
  'VJNT (Vimukta Jati Nomadic Tribes)',
  'NT (Nomadic Tribes)',
  'SBC (Special Backward Classes)',
  'EWS (Economically Weaker Sections)',
  'PWD (Persons with Disabilities)',
  'General'
];

// Exam Types
const EXAM_TYPES = [
  'Unit Test 1 (UT1)',
  'Unit Test 2 (UT2)',
  'Mid Semester Exam',
  'End Semester Exam',
  'Practical Exam',
  'Viva Voce',
  'Project Evaluation',
  'Assignment',
  'Quiz',
  'Internal Assessment',
  'External Assessment',
  'Continuous Assessment',
  'Terminal Exam',
  'Annual Exam',
  'Supplementary Exam',
  'Re-examination'
];

// Fee Categories
const FEE_CATEGORIES = [
  'Tuition Fee',
  'Library Fee',
  'Examination Fee',
  'Laboratory Fee',
  'Sports Fee',
  'Cultural Fee',
  'Development Fee',
  'Infrastructure Fee',
  'Transportation Fee',
  'Hostel Fee',
  'Mess Fee',
  'Medical Fee',
  'Insurance Fee',
  'Alumni Fee',
  'Placement Fee',
  'Research Fee',
  'Thesis Fee',
  'Convocation Fee',
  'Certificate Fee',
  'Transcript Fee',
  'Other'
];

const departments = [
  "All Departments",
  "Computer Science Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence & Machine Learning",
  "Data Science",
  "Administration",
];

const InstitutionSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"academic-year" | "fee-structure" | "institution-info">(
    "academic-year"
  );

  // Data state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [feeItems, setFeeItems] = useState<FeeStructureItem[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | null>(null);
  const [institutionInfo, setInstitutionInfo] = useState<InstitutionInfo>({
    name: "DYPSN College of Engineering",
    address: "123 Education Street, Pune, Maharashtra 411001",
    phone: "+91 20 1234 5678",
    email: "info@dypsn.edu",
    website: "www.dypsn.edu",
    establishedYear: "1995",
    affiliation: "Savitribai Phule Pune University",
    accreditation: "NAAC A+ Grade"
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI & form state
  const [newAcademicYear, setNewAcademicYear] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  const [feeSearch, setFeeSearch] = useState("");
  const [feeDeptFilter, setFeeDeptFilter] = useState<string>("All Departments");
  const [feeCatFilter, setFeeCatFilter] = useState<string>("all");
  const [feeReservationFilter, setFeeReservationFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedAcademicYearForFees, setSelectedAcademicYearForFees] = useState<string>("");

  // Add/Edit fee modal state
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [feeForm, setFeeForm] = useState({
    name: "",
    category: "",
    reservationCategory: "Open",
    department: "Computer Science Engineering",
    amount: 0,
    description: "",
  });

  // Load data from Firestore
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load academic years and institution info
      const [yearsData, infoData] = await Promise.all([
        institutionService.getAllAcademicYears(),
        institutionService.getInstitutionInfo()
      ]);
      
      setAcademicYears(yearsData);
      setInstitutionInfo(infoData);
      
      // Find active academic year
      const activeYear = yearsData.find(year => year.isActive);
      setActiveAcademicYear(activeYear || null);
      
      // Load fee items for active academic year
      let feesData: FeeStructureItem[] = [];
      if (activeYear) {
        feesData = await institutionService.getFeeItemsByAcademicYear(activeYear.id);
      }
      setFeeItems(feesData);
      
      // Initialize default data if none exists
      if (yearsData.length === 0) {
        await institutionService.initializeDefaultData();
        // Reload data after initialization
        const newYearsData = await institutionService.getAllAcademicYears();
        setAcademicYears(newYearsData);
        
        const newActiveYear = newYearsData.find(year => year.isActive);
        setActiveAcademicYear(newActiveYear || null);
        
        if (newActiveYear) {
          const newFeesData = await institutionService.getFeeItemsByAcademicYear(newActiveYear.id);
          setFeeItems(newFeesData);
        }
      }
    } catch (error) {
      console.error('Error loading institution data:', error);
      setError('Failed to load institution data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Action menu ref for mobile cards
  const actionRef = useRef<HTMLDivElement | null>(null);
  const [openActionFor, setOpenActionFor] = useState<string | null>(null);

  // helper: currency formatting
  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  // Academic Year handlers
  const handleAddAcademicYear = async () => {
    if (!newAcademicYear.name || !newAcademicYear.startDate || !newAcademicYear.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await institutionService.createAcademicYear({
        name: newAcademicYear.name,
        startDate: newAcademicYear.startDate,
        endDate: newAcademicYear.endDate,
        isActive: false
      });
      
      await loadData(); // Reload data
      setNewAcademicYear({ name: "", startDate: "", endDate: "" });
      (document.getElementById("add-year-modal") as HTMLDialogElement | null)?.close();
    } catch (error) {
      console.error('Error adding academic year:', error);
      alert('Failed to add academic year. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActiveYear = async (yearId: string) => {
    try {
      setSaving(true);
      await institutionService.setActiveAcademicYear(yearId);
      
      // Reload academic years and fee items for the new active year
      const yearsData = await institutionService.getAllAcademicYears();
      setAcademicYears(yearsData);
      
      const activeYear = yearsData.find(year => year.isActive);
      setActiveAcademicYear(activeYear || null);
      
      if (activeYear) {
        const feesData = await institutionService.getFeeItemsByAcademicYear(activeYear.id);
        setFeeItems(feesData);
      } else {
        setFeeItems([]);
      }
    } catch (error) {
      console.error('Error setting active year:', error);
      alert('Failed to set active year. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteYear = async (yearId: string) => {
    if (!confirm('Delete this academic year?')) return;
    
    try {
      setSaving(true);
      await institutionService.deleteAcademicYear(yearId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting academic year:', error);
      alert('Failed to delete academic year. Please try again.');
    } finally {
      setSaving(false);
    }
  };


  // Fee handlers
  const handleOpenAddFee = () => {
    setIsEditingFee(false);
    setEditingFeeId(null);
    setFeeForm({ name: "", category: "", reservationCategory: "Open", department: "Computer Science Engineering", amount: 0, description: "" });
    (document.getElementById("add-fee-modal") as HTMLDialogElement | null)?.showModal();
  };

  const handleOpenEditFee = (id: string) => {
    const f = feeItems.find((it) => it.id === id);
    if (!f) return;
    setIsEditingFee(true);
    setEditingFeeId(id);
    setFeeForm({
      name: f.name,
      category: f.category,
      reservationCategory: f.reservationCategory || "Open",
      department: f.department,
      amount: f.amount,
      description: f.description,
    });
    (document.getElementById("add-fee-modal") as HTMLDialogElement | null)?.showModal();
  };

  const handleSaveFee = async () => {
    if (!feeForm.name || !feeForm.category || feeForm.amount <= 0) {
      alert("Please provide name, category and a positive amount.");
      return;
    }

    try {
      setSaving(true);
      
      if (isEditingFee && editingFeeId) {
        await institutionService.updateFeeItem(editingFeeId, {
          name: feeForm.name,
          category: feeForm.category,
          reservationCategory: feeForm.reservationCategory,
          department: feeForm.department,
          amount: Number(feeForm.amount),
          description: feeForm.description
        });
      } else {
        if (!activeAcademicYear) {
          alert('No active academic year selected. Please select an academic year first.');
          return;
        }
        
        await institutionService.createFeeItem({
          name: feeForm.name,
          category: feeForm.category,
          reservationCategory: feeForm.reservationCategory,
          department: feeForm.department,
          amount: Number(feeForm.amount),
          description: feeForm.description,
          isActive: true,
          academicYearId: activeAcademicYear.id
        });
      }
      
      await loadData(); // Reload data
      (document.getElementById("add-fee-modal") as HTMLDialogElement | null)?.close();
      setIsEditingFee(false);
      setEditingFeeId(null);
      setFeeForm({ name: "", category: "", reservationCategory: "Open", department: "Computer Science Engineering", amount: 0, description: "" });
    } catch (error) {
      console.error('Error saving fee item:', error);
      alert('Failed to save fee item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm("Delete this fee item?")) return;
    
    try {
      setSaving(true);
      await institutionService.deleteFeeItem(id);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting fee item:', error);
      alert('Failed to delete fee item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInstitutionInfo = async () => {
    if (!institutionInfo.name || !institutionInfo.address || !institutionInfo.email) {
      alert("Please provide institution name, address, and email.");
      return;
    }

    try {
      setSaving(true);
      await institutionService.updateInstitutionInfo(institutionInfo);
      alert("Institution information saved successfully!");
    } catch (error) {
      console.error('Error saving institution info:', error);
      alert('Failed to save institution information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeeActive = async (id: string) => {
    try {
      setSaving(true);
      await institutionService.toggleFeeItemStatus(id);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error toggling fee status:', error);
      alert('Failed to update fee status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadFeesForAcademicYear = async (academicYearId: string) => {
    try {
      setLoading(true);
      const feesData = await institutionService.getFeeItemsByAcademicYear(academicYearId);
      setFeeItems(feesData);
      setSelectedAcademicYearForFees(academicYearId);
    } catch (error) {
      console.error('Error loading fees for academic year:', error);
      alert('Failed to load fees for selected academic year.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFeeStructure = async (fromYearId: string, toYearId: string) => {
    if (!confirm('This will copy all fee items from the source academic year to the target year. Continue?')) {
      return;
    }

    try {
      setSaving(true);
      await institutionService.copyFeeStructureToAcademicYear(fromYearId, toYearId);
      
      // Reload fees for the target year
      const feesData = await institutionService.getFeeItemsByAcademicYear(toYearId);
      setFeeItems(feesData);
      
      alert('Fee structure copied successfully!');
    } catch (error) {
      console.error('Error copying fee structure:', error);
      alert('Failed to copy fee structure. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered fee list
  const filteredFeeItems = feeItems.filter((it) => {
    const matchSearch =
      feeSearch.trim() === "" ||
      it.name.toLowerCase().includes(feeSearch.toLowerCase()) ||
      it.category.toLowerCase().includes(feeSearch.toLowerCase()) ||
      it.description.toLowerCase().includes(feeSearch.toLowerCase());

    const matchDept =
      feeDeptFilter === "All Departments" ||
      it.department === feeDeptFilter ||
      it.department === "All";

    const matchCat = feeCatFilter === "all" || it.category === feeCatFilter;

    const matchReservation = feeReservationFilter === "all" || it.reservationCategory === feeReservationFilter;

    return matchSearch && matchDept && matchCat && matchReservation;
  });

  // stats
  const totalFeeAmount = filteredFeeItems.reduce((s, it) => s + it.amount, 0);

  // close action menus when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenActionFor(null);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const toggleTab = (id: typeof activeTab) => setActiveTab(id);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Institution Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage academic years, fee structure and institution information
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-800">Loading institution data...</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-3 px-4 md:px-6 py-3">
            <button
              onClick={() => toggleTab("academic-year")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === "academic-year"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Academic Year
            </button>

            <button
              onClick={() => toggleTab("fee-structure")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === "fee-structure"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Fee Structure
            </button>

            <button
              onClick={() => toggleTab("institution-info")}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === "institution-info"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Institution Info
            </button>
          </nav>
        </div>

        <div className="p-4 md:p-6">
          {/* ------------------ Academic Year ------------------ */}
          {activeTab === "academic-year" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Academic Years</h2>
                  <p className="text-sm text-gray-500">Create and activate academic years</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => (document.getElementById("add-year-modal") as HTMLDialogElement | null)?.showModal()}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Year
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {academicYears.map((y) => (
                  <div
                    key={y.id}
                    className={`p-4 border rounded-lg flex items-center justify-between gap-4 ${
                      y.isActive ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{y.name}</h3>
                        {y.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(y.startDate).toLocaleDateString()} - {new Date(y.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!y.isActive && (
                        <button
                          onClick={() => handleSetActiveYear(y.id)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Set active"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteYear(y.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------ Fee Structure ------------------ */}
          {activeTab === "fee-structure" && (
            <div className="space-y-6">
              <div className="space-y-4">
                {/* Header with title and add button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Fee Structure</h2>
                    <p className="text-sm text-gray-500">
                      Manage fee items for {activeAcademicYear ? activeAcademicYear.name : 'selected academic year'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {academicYears.length > 0 && (
                      <select
                        value={selectedAcademicYearForFees || (activeAcademicYear?.id || "")}
                        onChange={(e) => handleLoadFeesForAcademicYear(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        {academicYears.map(year => (
                          <option key={year.id} value={year.id}>
                            {year.name} {year.isActive ? '(Active)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    {academicYears.length > 1 && (
                      <button
                        onClick={() => {
                          const fromYear = academicYears.find(y => y.id !== (selectedAcademicYearForFees || activeAcademicYear?.id));
                          const toYear = academicYears.find(y => y.id === (selectedAcademicYearForFees || activeAcademicYear?.id));
                          if (fromYear && toYear) {
                            handleCopyFeeStructure(fromYear.id, toYear.id);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Copy from Other Year
                      </button>
                    )}
                    <button
                      onClick={handleOpenAddFee}
                      disabled={!activeAcademicYear}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Add Fee
                    </button>
                  </div>
                </div>

                {/* Search and filters */}
                <div className="flex items-center gap-2 w-full">
                  {/* desktop controls */}
                  <div className="hidden md:flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        value={feeSearch}
                        onChange={(e) => setFeeSearch(e.target.value)}
                        placeholder="Search fee items..."
                        className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <select
                      value={feeCatFilter}
                      onChange={(e) => setFeeCatFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Categories</option>
                      {FEE_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <select
                      value={feeDeptFilter}
                      onChange={(e) => setFeeDeptFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <select
                      value={feeReservationFilter}
                      onChange={(e) => setFeeReservationFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Reservation Categories</option>
                      {INDIAN_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* mobile: filter toggle and add button */}
                  <div className="flex md:hidden items-center gap-2">
                    <button
                      onClick={() => setShowMobileFilters((s) => !s)}
                      className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
                      aria-expanded={showMobileFilters}
                      aria-label="Toggle filters"
                    >
                      <Filter className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={handleOpenAddFee}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Fee
                    </button>
                  </div>
                </div>
              </div>

              {/* mobile filters collapse */}
              {showMobileFilters && (
                <div className="md:hidden bg-white border border-gray-100 p-3 rounded-lg">
                  <div className="space-y-2">
                    <div>
                      <input
                        value={feeSearch}
                        onChange={(e) => setFeeSearch(e.target.value)}
                        placeholder="Search fee items..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={feeDeptFilter}
                        onChange={(e) => setFeeDeptFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {departments.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <select
                        value={feeCatFilter}
                        onChange={(e) => setFeeCatFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="all">Fee Categories</option>
                        <option value="Tuition">Tuition</option>
                        <option value="Library">Library</option>
                        <option value="Examination">Examination</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* stats */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-md">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Displayed Total</p>
                    <p className="text-xl font-semibold text-gray-900">{fmt(totalFeeAmount)}</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600">Showing {filteredFeeItems.length} items</div>
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block bg-white border border-gray-100 rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs text-gray-500">Name</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500">Category</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500">Reservation Category</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500">Department</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500">Amount</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500">Status</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredFeeItems.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{it.name}</div>
                          <div className="text-xs text-gray-500">{it.description}</div>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-700">{it.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{it.reservationCategory || 'Open'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{it.department}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{fmt(it.amount)}</td>

                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${it.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                            {it.isActive ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {it.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right text-sm">
                          <div className="inline-flex items-center gap-2">
                            <button onClick={() => handleOpenEditFee(it.id)} className="text-blue-600 hover:text-blue-900 p-1" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>

                            <button onClick={() => handleToggleFeeActive(it.id)} className="p-1 text-yellow-600 hover:text-yellow-900" title="Toggle active">
                              <CheckCircle className="w-4 h-4" />
                            </button>

                            <button onClick={() => handleDeleteFee(it.id)} className="text-red-600 hover:text-red-900 p-1" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredFeeItems.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={6}>
                          No fee items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile: cards */}
              <div className="md:hidden space-y-3">
                {filteredFeeItems.map((it) => (
                  <div key={it.id} className="border border-gray-100 p-3 rounded-lg bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900">{it.name}</h3>
                          <span className="text-xs text-gray-500">• {it.category}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{it.description}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-700 font-medium">{fmt(it.amount)}</span>
                          <span className="text-xs text-gray-500">Reservation: {it.reservationCategory || 'Open'}</span>
                          <span className="text-xs text-gray-500">Dept: {it.department}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${it.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                            {it.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="relative" ref={actionRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionFor((cur) => (cur === it.id ? null : it.id));
                          }}
                          className="p-2 rounded-md hover:bg-gray-50"
                          aria-expanded={openActionFor === it.id}
                          aria-haspopup="true"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>

                        {openActionFor === it.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-30">
                            <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm" onClick={() => { handleOpenEditFee(it.id); setOpenActionFor(null); }}>
                              <Edit className="w-4 h-4" /> Edit
                            </button>

                            <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm" onClick={() => { handleToggleFeeActive(it.id); setOpenActionFor(null); }}>
                              <CheckCircle className="w-4 h-4" /> Toggle Active
                            </button>

                            <button className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600" onClick={() => { handleDeleteFee(it.id); setOpenActionFor(null); }}>
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFeeItems.length === 0 && (
                  <div className="text-center text-sm text-gray-500 p-4">No fee items found.</div>
                )}
              </div>
            </div>
          )}

          {/* ------------------ Institution Info ------------------ */}
          {activeTab === "institution-info" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Institution Information</h2>
                <p className="text-sm text-gray-500">Update address, contact and accreditation details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
                  <input
                    value={institutionInfo.name}
                    onChange={(e) => setInstitutionInfo({ ...institutionInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
                  <input
                    value={institutionInfo.establishedYear}
                    onChange={(e) => setInstitutionInfo({ ...institutionInfo, establishedYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    rows={3}
                    value={institutionInfo.address}
                    onChange={(e) => setInstitutionInfo({ ...institutionInfo, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    value={institutionInfo.phone}
                    onChange={(e) => setInstitutionInfo({ ...institutionInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    value={institutionInfo.email}
                    onChange={(e) => setInstitutionInfo({ ...institutionInfo, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    value={institutionInfo.website}
                    onChange={(e) => setInstitutionInfo({ ...institutionInfo, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Affiliation</label>
                  <input
                    value={institutionInfo.affiliation}
                    onChange={(e) => setInstitutionInfo({ ...institutionInfo, affiliation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accreditation</label>
                  <input
                    value={institutionInfo.accreditation}
                    onChange={(e) => setInstitutionInfo({ ...institutionInfo, accreditation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveInstitutionInfo}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Academic Year Modal (native dialog) */}
      <dialog id="add-year-modal" className="rounded-lg">
        <form method="dialog" className="p-4 md:p-6 w-[min(600px,95vw)] space-y-4">
          <h3 className="text-lg font-semibold">Add Academic Year</h3>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Year Name</label>
            <input
              value={newAcademicYear.name}
              onChange={(e) => setNewAcademicYear((s) => ({ ...s, name: e.target.value }))}
              placeholder="2025-26"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={newAcademicYear.startDate}
                onChange={(e) => setNewAcademicYear((s) => ({ ...s, startDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={newAcademicYear.endDate}
                onChange={(e) => setNewAcademicYear((s) => ({ ...s, endDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <menu className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 rounded bg-gray-100" onClick={() => (document.getElementById("add-year-modal") as HTMLDialogElement | null)?.close()}>
              Cancel
            </button>
            <button type="button" className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" onClick={handleAddAcademicYear} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Year'
              )}
            </button>
          </menu>
        </form>
      </dialog>

      {/* Add / Edit Fee Modal */}
      <dialog id="add-fee-modal" className="rounded-lg">
        <form method="dialog" className="p-4 md:p-6 w-[min(720px,95vw)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{isEditingFee ? "Edit Fee Item" : "Add Fee Item"}</h3>
            {isEditingFee && (
              <span className="text-sm text-gray-500">Editing</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input value={feeForm.name} onChange={(e) => setFeeForm((s) => ({ ...s, name: e.target.value }))} className="w-full px-3 py-2 border rounded" />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select value={feeForm.category} onChange={(e) => setFeeForm((s) => ({ ...s, category: e.target.value }))} className="w-full px-3 py-2 border rounded">
                <option value="">Select category</option>
                {FEE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Reservation Category</label>
              <select value={feeForm.reservationCategory} onChange={(e) => setFeeForm((s) => ({ ...s, reservationCategory: e.target.value }))} className="w-full px-3 py-2 border rounded">
                {INDIAN_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Department</label>
              <select value={feeForm.department} onChange={(e) => setFeeForm((s) => ({ ...s, department: e.target.value }))} className="w-full px-3 py-2 border rounded">
                {departments.filter(d => d !== "All Departments").map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="All">All</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Amount (₹)</label>
              <input type="number" min={0} value={feeForm.amount} onChange={(e) => setFeeForm((s) => ({ ...s, amount: Number(e.target.value) }))} className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea rows={3} value={feeForm.description} onChange={(e) => setFeeForm((s) => ({ ...s, description: e.target.value }))} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>

          <menu className="flex justify-end gap-2">
            <button type="button" className="px-3 py-2 rounded bg-gray-100" onClick={() => {
              (document.getElementById("add-fee-modal") as HTMLDialogElement | null)?.close();
              setIsEditingFee(false);
              setEditingFeeId(null);
            }}>
              Cancel
            </button>

            <button type="button" className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" onClick={handleSaveFee} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditingFee ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                isEditingFee ? "Save Changes" : "Add Fee"
              )}
            </button>
          </menu>
        </form>
      </dialog>
    </div>
  );
};

export default InstitutionSettings;
