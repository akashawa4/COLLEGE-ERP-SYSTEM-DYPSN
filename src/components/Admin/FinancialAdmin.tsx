import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Building2
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'refund';
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  studentId?: string;
  studentName?: string;
}

interface Refund {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedDate: string;
  processedDate?: string;
  processedBy?: string;
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: string;
}

const FinancialAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Mock data
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        category: 'Tuition Fee',
        description: 'Tuition fee payment - John Doe',
        amount: 50000,
        date: '2024-01-15',
        status: 'completed',
        reference: 'TXN001',
        studentId: 'CS001',
        studentName: 'John Doe'
      },
      {
        id: '2',
        type: 'income',
        category: 'Library Fee',
        description: 'Library membership fee - Sarah Johnson',
        amount: 2000,
        date: '2024-01-14',
        status: 'completed',
        reference: 'TXN002',
        studentId: 'CS002',
        studentName: 'Sarah Johnson'
      },
      {
        id: '3',
        type: 'expense',
        category: 'Infrastructure',
        description: 'Lab equipment maintenance',
        amount: 15000,
        date: '2024-01-13',
        status: 'completed',
        reference: 'TXN003'
      },
      {
        id: '4',
        type: 'refund',
        category: 'Fee Refund',
        description: 'Refund for cancelled admission - Mike Wilson',
        amount: 25000,
        date: '2024-01-12',
        status: 'pending',
        reference: 'TXN004',
        studentId: 'CS003',
        studentName: 'Mike Wilson'
      }
    ];

    const mockRefunds: Refund[] = [
      {
        id: '1',
        studentId: 'CS003',
        studentName: 'Mike Wilson',
        amount: 25000,
        reason: 'Cancelled admission due to personal reasons',
        status: 'pending',
        requestedDate: '2024-01-12'
      },
      {
        id: '2',
        studentId: 'CS004',
        studentName: 'Emily Davis',
        amount: 15000,
        reason: 'Overpayment of fees',
        status: 'approved',
        requestedDate: '2024-01-10',
        processedDate: '2024-01-11',
        processedBy: 'Dr. Principal Admin'
      },
      {
        id: '3',
        studentId: 'CS005',
        studentName: 'David Brown',
        amount: 30000,
        reason: 'Course withdrawal',
        status: 'rejected',
        requestedDate: '2024-01-08',
        processedDate: '2024-01-09',
        processedBy: 'Dr. Principal Admin'
      }
    ];

    const mockLedger: LedgerEntry[] = [
      {
        id: '1',
        date: '2024-01-15',
        description: 'Tuition fee collection',
        debit: 0,
        credit: 50000,
        balance: 50000,
        category: 'Income'
      },
      {
        id: '2',
        date: '2024-01-14',
        description: 'Library fee collection',
        debit: 0,
        credit: 2000,
        balance: 52000,
        category: 'Income'
      },
      {
        id: '3',
        date: '2024-01-13',
        description: 'Lab equipment maintenance',
        debit: 15000,
        credit: 0,
        balance: 37000,
        category: 'Expense'
      },
      {
        id: '4',
        date: '2024-01-12',
        description: 'Fee refund - Mike Wilson',
        debit: 25000,
        credit: 0,
        balance: 12000,
        category: 'Refund'
      }
    ];

    setTransactions(mockTransactions);
    setRefunds(mockRefunds);
    setLedger(mockLedger);
  }, []);

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalRefunds = () => {
    return transactions
      .filter(t => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getNetBalance = () => {
    return getTotalIncome() - getTotalExpenses() - getTotalRefunds();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApproveRefund = (refundId: string) => {
    setRefunds(refunds.map(refund =>
      refund.id === refundId
        ? {
          ...refund,
          status: 'approved',
          processedDate: new Date().toISOString().split('T')[0],
          processedBy: 'Dr. Principal Admin'
        }
        : refund
    ));
  };

  const handleRejectRefund = (refundId: string) => {
    setRefunds(refunds.map(refund =>
      refund.id === refundId
        ? {
          ...refund,
          status: 'rejected',
          processedDate: new Date().toISOString().split('T')[0],
          processedBy: 'Dr. Principal Admin'
        }
        : refund
    ));
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Financial Administration</h1>
          <p className="text-sm text-slate-500">Manage ledgers, refunds, and financial reconciliations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              <option value="CSE">Computer Science</option>
              <option value="IT">Information Technology</option>
              <option value="ECE">Electronics & Communication</option>
              <option value="ME">Mechanical Engineering</option>
              <option value="CE">Civil Engineering</option>
              <option value="EE">Electrical Engineering</option>
              <option value="Administration">Administration</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Security">Security</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6 px-4 lg:px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'transactions', label: 'Transactions', icon: CreditCard },
              { id: 'refunds', label: 'Refunds', icon: DollarSign },
              { id: 'ledger', label: 'Ledger', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-slate-800 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 lg:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Financial Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total Income</p>
                      <p className="text-xl font-bold text-emerald-600">₹{getTotalIncome().toLocaleString()}</p>
                    </div>
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total Expenses</p>
                      <p className="text-xl font-bold text-red-600">₹{getTotalExpenses().toLocaleString()}</p>
                    </div>
                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Total Refunds</p>
                      <p className="text-xl font-bold text-amber-600">₹{getTotalRefunds().toLocaleString()}</p>
                    </div>
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Net Balance</p>
                      <p className={`text-xl font-bold ${getNetBalance() >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{getNetBalance().toLocaleString()}
                      </p>
                    </div>
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-100' :
                              transaction.type === 'expense' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                            {transaction.type === 'income' ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                              transaction.type === 'expense' ? <TrendingDown className="w-4 h-4 text-red-600" /> :
                                <DollarSign className="w-4 h-4 text-yellow-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-xs text-gray-600">{transaction.category} • {transaction.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' :
                              transaction.type === 'expense' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                            {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1 capitalize">{transaction.status}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-gray-900">All Transactions</h2>
                <div className="flex space-x-3 mt-4 sm:mt-0">
                  <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                              <div className="text-sm text-gray-500">{transaction.reference}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-800' :
                                transaction.type === 'expense' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                              }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{transaction.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getStatusIcon(transaction.status)}
                              <span className="ml-1 capitalize">{transaction.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Refunds Tab */}
          {activeTab === 'refunds' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Refund Management</h2>

              <div className="grid gap-4">
                {refunds.map((refund) => (
                  <div key={refund.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{refund.studentName}</h3>
                          <span className="text-sm text-gray-600">({refund.studentId})</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${refund.status === 'approved' ? 'bg-green-100 text-green-800' :
                              refund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {refund.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{refund.reason}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Amount: ₹{refund.amount.toLocaleString()}</span>
                          <span>Requested: {new Date(refund.requestedDate).toLocaleDateString()}</span>
                          {refund.processedDate && (
                            <span>Processed: {new Date(refund.processedDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        {refund.processedBy && (
                          <p className="text-xs text-gray-500 mt-1">Processed by: {refund.processedBy}</p>
                        )}
                      </div>
                      {refund.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveRefund(refund.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRefund(refund.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ledger Tab */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-gray-900">General Ledger</h2>
                <div className="flex space-x-3 mt-4 sm:mt-0">
                  <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4 mr-2" />
                    Export Ledger
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {entry.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{entry.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAdmin;
