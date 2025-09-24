import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  Award, 
  Users, 
  BookOpen, 
  GraduationCap,
  Loader2,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Search,
  X
} from 'lucide-react';
import { institutionService } from '../../firebase/firestore';
import { InstitutionInfo, FeeStructureItem } from '../../types';

const AboutPage: React.FC = () => {
  const [institutionInfo, setInstitutionInfo] = useState<InstitutionInfo | null>(null);
  const [feeStructure, setFeeStructure] = useState<FeeStructureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedReservationCategory, setSelectedReservationCategory] = useState<string>('all');

  const loadInstitutionInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load institution info and fee structure in parallel
      const [info, fees] = await Promise.all([
        institutionService.getInstitutionInfo(),
        institutionService.getAllFeeItems()
      ]);
      
      setInstitutionInfo(info);
      setFeeStructure(fees);
    } catch (error) {
      console.error('Error loading institution info:', error);
      setError('Failed to load college information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutionInfo();
  }, []);

  // Get unique categories, departments, and reservation categories for filters
  const categories = Array.from(new Set(feeStructure.map(fee => fee.category).filter(cat => cat && cat.trim() !== ''))).sort();
  const departments = Array.from(new Set(feeStructure.map(fee => fee.department).filter(dept => dept && dept.trim() !== ''))).sort();
  
  // Get reservation categories from data, but also include common Indian reservation categories
  const dataReservationCategories = Array.from(new Set(feeStructure.map(fee => fee.reservationCategory))).sort();
  const commonReservationCategories = [
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
  
  // Combine data categories with common categories, removing duplicates and invalid entries
  const reservationCategories = Array.from(new Set([
    ...dataReservationCategories.filter(cat => cat && cat.trim() !== ''), 
    ...commonReservationCategories
  ])).sort();

  // Filter fee structure based on search and filters
  const filteredFeeStructure = feeStructure.filter(fee => {
    const matchesSearch = searchTerm === '' || 
      fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || fee.category === selectedCategory;
    const matchesDepartment = selectedDepartment === 'all' || fee.department === selectedDepartment;
    const matchesReservationCategory = selectedReservationCategory === 'all' || 
      fee.reservationCategory === selectedReservationCategory ||
      (selectedReservationCategory === 'Open' && (fee.reservationCategory === 'Open' || !fee.reservationCategory));
    
    return matchesSearch && matchesCategory && matchesDepartment && matchesReservationCategory;
  });

  // Group filtered fees by category
  const groupedFees = filteredFeeStructure.reduce((acc, fee) => {
    if (!acc[fee.category]) {
      acc[fee.category] = [];
    }
    acc[fee.category].push(fee);
    return acc;
  }, {} as Record<string, FeeStructureItem[]>);

  // Calculate total amount for filtered fees
  const totalAmount = filteredFeeStructure.reduce((sum, fee) => sum + fee.amount, 0);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedReservationCategory('all');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading college information...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center text-center">
            <div>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Information</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadInstitutionInfo}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">About Our College</h1>
        <p className="text-gray-600">Discover the excellence and heritage of our institution</p>
      </div>

      {/* College Information Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{institutionInfo?.name || 'DYPSN College of Engineering'}</h2>
              <p className="text-blue-100 mt-1">Excellence in Engineering Education</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-gray-600">{institutionInfo?.address || '123 Education Street, Pune, Maharashtra 411001'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-gray-600">{institutionInfo?.phone || '+91 20 1234 5678'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">{institutionInfo?.email || 'info@dypsn.edu'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Website</p>
                    <p className="text-gray-600">{institutionInfo?.website || 'www.dypsn.edu'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Institution Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Institution Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Established</p>
                    <p className="text-gray-600">{institutionInfo?.establishedYear || '1995'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Affiliation</p>
                    <p className="text-gray-600">{institutionInfo?.affiliation || 'Savitribai Phule Pune University'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Accreditation</p>
                    <p className="text-gray-600">{institutionInfo?.accreditation || 'NAAC A+ Grade'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Our Mission & Vision
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Mission</h4>
                <p className="text-blue-800 text-sm">
                  To provide quality engineering education that fosters innovation, creativity, and technical excellence, 
                  preparing students to become competent professionals and responsible citizens.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Vision</h4>
                <p className="text-green-800 text-sm">
                  To be a leading institution in engineering education, recognized for academic excellence, 
                  research innovation, and contribution to technological advancement and societal development.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Key Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Quality Education</h4>
                <p className="text-sm text-gray-600">Comprehensive curriculum with modern teaching methods</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Experienced Faculty</h4>
                <p className="text-sm text-gray-600">Highly qualified and experienced teaching staff</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Industry Recognition</h4>
                <p className="text-sm text-gray-600">Strong industry partnerships and placement support</p>
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Our Departments
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'Computer Science Engineering',
                'Information Technology',
                'Electronics & Communication',
                'Electrical Engineering',
                'Mechanical Engineering',
                'Civil Engineering',
                'Artificial Intelligence & ML',
                'Data Science'
              ].map((dept, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-900">{dept}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campus Life Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Campus Life
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Student Activities</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Technical clubs and societies</li>
              <li>• Cultural events and festivals</li>
              <li>• Sports and recreational activities</li>
              <li>• Industry visits and workshops</li>
              <li>• Research and innovation projects</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Facilities</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Modern laboratories and equipment</li>
              <li>• Well-stocked library with digital resources</li>
              <li>• Computer centers with latest technology</li>
              <li>• Sports complex and gymnasium</li>
              <li>• Cafeteria and student lounge areas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Fee Structure Section */}
      {feeStructure.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Fee Structure
            </h3>
            {(searchTerm || selectedCategory !== 'all' || selectedDepartment !== 'all' || selectedReservationCategory !== 'all') && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Filters Section - Always Visible */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search fees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Fee Type Filter (renamed from Category) */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Fee Types</option>
                {categories.map((category, index) => (
                  <option key={`category-${index}-${category}`} value={category}>{category}</option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((department, index) => (
                  <option key={`department-${index}-${department}`} value={department}>{department}</option>
                ))}
              </select>

              {/* Reservation Category Filter */}
              <select
                value={selectedReservationCategory}
                onChange={(e) => setSelectedReservationCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Reservation Categories</option>
                {reservationCategories.map((reservationCategory, index) => (
                  <option key={`reservation-${index}-${reservationCategory}`} value={reservationCategory}>
                    {reservationCategory}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredFeeStructure.length} of {feeStructure.length} fee items
              {totalAmount > 0 && (
                <span className="ml-2 font-semibold text-gray-900">
                  • Total: ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-4">
            {Object.keys(groupedFees).length > 0 ? (
              Object.entries(groupedFees).map(([category, fees]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-blue-700 flex items-center justify-between">
                    <span>{category}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {fees.length} item{fees.length !== 1 ? 's' : ''}
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fees.map((fee) => (
                      <div key={fee.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{fee.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {fee.department !== 'All' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {fee.department}
                              </span>
                            )}
                            {fee.reservationCategory !== 'Open' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {fee.reservationCategory}
                              </span>
                            )}
                          </div>
                          {fee.description && (
                            <p className="text-xs text-gray-500 mt-1" title={fee.description}>
                              {fee.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-gray-900">
                            ₹{fee.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No fees found</h4>
                <p className="text-gray-500 mb-4">
                  {selectedReservationCategory !== 'all' ? 
                    `No fee items found for the selected reservation category "${selectedReservationCategory}". This category may not have specific fees defined yet.` :
                    'No fee items match your current filters. Try adjusting your search criteria.'
                  }
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Fee structures may vary based on reservation categories and departments. 
                For detailed fee information and payment procedures, please contact the administration office.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Fee Structure
          </h3>
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Fee Structure Not Available</h4>
            <p className="text-gray-500 mb-4">
              Fee structure information is currently being updated. Please contact the administration office for current fee details.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Contact Information:</strong><br />
                Phone: {institutionInfo?.phone || '+91 20 1234 5678'}<br />
                Email: {institutionInfo?.email || 'info@dypsn.edu'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white text-center">
        <h3 className="text-xl font-bold mb-2">Interested in Joining Us?</h3>
        <p className="text-blue-100 mb-4">
          Discover more about our programs, admission process, and campus life.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            View Programs
          </button>
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors">
            Contact Admissions
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
