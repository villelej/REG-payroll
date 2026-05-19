import { X, Download, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BatchDetailsModalProps {
  batch: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BatchDetailsModal({ batch, isOpen, onClose }: BatchDetailsModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !batch) return null;

  const downloadBatchReport = () => {
    setIsDownloading(true);
    try {
      // Prepare CSV data
      const csvContent = [
        ['Payroll Batch Report'],
        [],
        ['Batch Code', batch.batch_code],
        ['Status', batch.status],
        ['Pay Period', `${new Date(batch.pay_period_start).toLocaleDateString()} - ${new Date(batch.pay_period_end).toLocaleDateString()}`],
        ['Created Date', new Date(batch.created_at).toLocaleDateString()],
        ['Created Time', new Date(batch.created_at).toLocaleTimeString()],
        [],
        ['Financial Summary'],
        ['Total Employees', batch.total_employees],
        ['Total Gross Payable (RWF)', Number(batch.total_gross_payable || 0).toLocaleString()],
        ['Total Deductions (RWF)', Number(batch.total_deductions || 0).toLocaleString()],
        ['Total Net Payable (RWF)', Number(batch.total_net_payable || 0).toLocaleString()],
        [],
        ['Additional Information'],
        ['Remarks', batch.remarks || 'No remarks'],
        ['Status History', `${batch.status} since ${new Date(batch.updated_at || batch.created_at).toLocaleDateString()}`],
        ...(batch.approved_by ? [['Approved By', batch.approved_by]] : []),
      ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${batch.batch_code}-report-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-emerald-100 text-emerald-700";
      case "Approved":
        return "bg-blue-100 text-blue-700";
      case "Calculated":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "Approved":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "Calculated":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {getStatusIcon(batch.status)}
            <div>
              <h2 className="text-2xl font-bold">{batch.batch_code}</h2>
              <p className="text-indigo-100 text-sm">
                Batch Details & Summary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-indigo-500 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Status & Period Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                Current Status
              </p>
              <div className="flex items-center gap-2">
                {getStatusIcon(batch.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}>
                  {batch.status}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                Pay Period
              </p>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(batch.pay_period_start).toLocaleDateString()} to{" "}
                  {new Date(batch.pay_period_end).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(batch.pay_period_start).toLocaleDateString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                Created Date
              </p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(batch.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(batch.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-2">
                  Total Employees
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {batch.total_employees}
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider mb-2">
                  Total Gross
                </p>
                <p className="text-2xl font-bold text-emerald-900">
                  {Number(batch.total_gross_payable || 0).toLocaleString()}
                </p>
                <p className="text-xs text-emerald-600 mt-1">RWF</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-xs text-red-600 uppercase font-bold tracking-wider mb-2">
                  Total Deductions
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {Number(batch.total_deductions || 0).toLocaleString()}
                </p>
                <p className="text-xs text-red-600 mt-1">RWF</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-xs text-indigo-600 uppercase font-bold tracking-wider mb-2">
                  Total Net Payable
                </p>
                <p className="text-2xl font-bold text-indigo-900">
                  {Number(batch.total_net_payable || 0).toLocaleString()}
                </p>
                <p className="text-xs text-indigo-600 mt-1">RWF</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                    Batch Code
                  </p>
                  <p className="text-sm font-medium text-gray-900">{batch.batch_code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                    Remarks
                  </p>
                  <p className="text-sm text-gray-600">
                    {batch.remarks || "No remarks"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                    Status History
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{batch.status}</p>
                      <p className="text-xs text-gray-500">
                        Since {new Date(batch.updated_at || batch.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {batch.approved_by && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                      Approved By
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {batch.approved_by}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-8 flex gap-3">
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={downloadBatchReport}
              disabled={isDownloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download Report"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
