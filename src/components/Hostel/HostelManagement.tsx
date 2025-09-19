import React from 'react';
import { 
  ExternalLink,
  Building,
  Utensils,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Globe,
  Phone,
  Mail
} from 'lucide-react';

const HostelManagement: React.FC<{ user: any }> = ({ user }) => {
  // Handle redirect to Nivasi Space website
  const handleRedirectToWebsite = () => {
    // Replace with your actual Nivasi Space website URL
    window.open('https://www.nivasi.space/', '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Hostel & Room Services</h1>
        <p className="text-lg text-gray-600">Find your perfect accommodation and mess food</p>
      </div>

      {/* Main Banner Card - Orange and White Design */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 border-2 border-white/30">
              <Building className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">Nivasi Space</h2>
          <p className="text-xl mb-6 text-white/95 font-medium">Your trusted partner for college accommodation and mess food</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleRedirectToWebsite}
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Globe className="w-5 h-5" />
              Visit Nivasi Space
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Services Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Room Renting Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center mb-4">
            <div className="bg-orange-100 p-3 rounded-lg mr-4">
              <Building className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Room Renting</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Find comfortable and affordable rooms near your college. We offer a wide range of accommodation options 
            including single rooms, shared rooms, and dormitories with all necessary amenities.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Verified and safe accommodations
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Flexible rental options
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              All amenities included
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Easy booking process
            </div>
          </div>
        </div>

        {/* Mess Food Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <Utensils className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Mess Food</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Enjoy delicious and nutritious meals at affordable prices. Our mess services provide 
            home-cooked food with proper hygiene and nutrition standards.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Hygienic and fresh food
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Nutritious meals
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Affordable pricing
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Flexible meal plans
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 rounded-xl p-8 mb-8">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">Why Choose Nivasi Space?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Student-Friendly</h4>
            <p className="text-gray-600">Designed specifically for college students with their needs and budget in mind.</p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-orange-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Quality Service</h4>
            <p className="text-gray-600">We maintain high standards of service and ensure customer satisfaction.</p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-orange-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">24/7 Support</h4>
            <p className="text-gray-600">Round-the-clock customer support to help you with any queries or issues.</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Get in Touch</h3>
        <p className="text-center text-gray-600 mb-6">
          Contact us for help or if you want to register your room on Nivasi Space
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-orange-100 p-3 rounded-lg w-fit mx-auto mb-3">
              <Phone className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Primary Support</h4>
            <p className="text-gray-600 mb-3">Call us for immediate assistance</p>
            <div className="flex flex-col gap-2">
              <a href="tel:+919876543210" className="text-orange-600 hover:underline font-medium">
                +91 98765 43210
              </a>
              <a 
                href="tel:+919876543210" 
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-3">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Secondary Support</h4>
            <p className="text-gray-600 mb-3">Alternative contact number</p>
            <div className="flex flex-col gap-2">
              <a href="tel:+919876543211" className="text-green-600 hover:underline font-medium">
                +91 98765 43211
              </a>
              <a 
                href="tel:+919876543211" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-3">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Email Support</h4>
            <p className="text-gray-600 mb-3">Send us your queries via email</p>
            <div className="flex flex-col gap-2">
              <a href="mailto:support@nivasispace.com" className="text-purple-600 hover:underline font-medium">
                support@nivasispace.com
              </a>
              <a 
                href="mailto:support@nivasispace.com" 
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email Now
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-8">
        <button
          onClick={handleRedirectToWebsite}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <ExternalLink className="w-5 h-5" />
          Visit Nivasi Space Now
        </button>
      </div>
    </div>
  );
};

export default HostelManagement;
