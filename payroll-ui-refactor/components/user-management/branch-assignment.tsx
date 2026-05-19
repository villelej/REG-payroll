/**
 * Frontend Implementation: Multi-Branch Support
 * User Management with Branch Assignment
 * 
 * This shows how SuperAdmin can:
 * 1. Assign multiple branches to HR/Admin users
 * 2. Grant "View All Branches" permission
 * 3. Hide branch field for Employee role
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, CheckCircle } from 'lucide-react';

interface BranchOption {
  id: number;
  name: string;
  status: string;
}

interface UserFormProps {
  onSubmit: (userData: any) => Promise<void>;
  roles: Array<{ id: string; name: string }>;
  branches: BranchOption[];
  loading?: boolean;
}

/**
 * Branch Assignment Component
 * Handles multi-select and "View All" permission
 */
export function BranchAssignmentSection({
  role,
  branches,
  selectedBranches,
  canViewAll,
  onBranchToggle,
  onViewAllToggle,
}: {
  role: string;
  branches: BranchOption[];
  selectedBranches: number[];
  canViewAll: boolean;
  onBranchToggle: (branchId: number) => void;
  onViewAllToggle: (checked: boolean) => void;
}) {
  // Show branch assignment only for HR/Admin roles
  const showBranchAssignment = ['BranchHR', 'CompanyAdmin'].includes(role);

  if (!showBranchAssignment) {
    return null;
  }

  return (
    <div className="border-t pt-6 mt-6 space-y-4">
      <div>
        <Label className="text-base font-semibold">Branch Assignment</Label>
        <p className="text-sm text-gray-600 mt-1">
          Select which branches this user can manage
        </p>
      </div>

      {/* View All Branches Toggle */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <input
          type="checkbox"
          id="viewAllBranches"
          checked={canViewAll}
          onChange={(e) => onViewAllToggle(e.target.checked)}
          className="mt-1 w-4 h-4 cursor-pointer"
        />
        <div className="flex-1">
          <Label
            htmlFor="viewAllBranches"
            className="text-sm font-medium cursor-pointer"
          >
            Can View All Branches
          </Label>
          <p className="text-xs text-gray-600 mt-1">
            Grant access to all branches in the company without selecting each one
          </p>
        </div>
      </div>

      {/* Specific Branches Selection */}
      {!canViewAll ? (
        <div>
          <Label className="text-sm font-medium">Select Specific Branches</Label>
          <div className="mt-3 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 border rounded-lg bg-gray-50">
            {branches.length === 0 ? (
              <p className="col-span-2 text-sm text-gray-500 py-4">
                No branches available
              </p>
            ) : (
              branches.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-primary cursor-pointer"
                  onClick={() => onBranchToggle(branch.id)}
                >
                  <input
                    type="checkbox"
                    id={`branch-${branch.id}`}
                    checked={selectedBranches.includes(branch.id)}
                    onChange={() => onBranchToggle(branch.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor={`branch-${branch.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {branch.name}
                  </label>
                </div>
              ))
            )}
          </div>
          {selectedBranches.length > 0 && (
            <p className="mt-2 text-sm text-green-700 font-medium">
              ✓ {selectedBranches.length} branch{selectedBranches.length !== 1 ? 'es' : ''} selected
            </p>
          )}
        </div>
      ) : (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✓ This user can access all branches in the company
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Main User Management Form
 */
export default function UserManagementForm({
  onSubmit,
  roles,
  branches,
  loading = false,
}: UserFormProps) {
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    username: '',
    password: 'Reg@12345',
    role: '',
  });

  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [canViewAllBranches, setCanViewAllBranches] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setUserForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    setUserForm((prev) => ({ ...prev, role }));

    // Reset branch selection when role changes
    setSelectedBranches([]);
    setCanViewAllBranches(false);
  };

  const handleBranchToggle = (branchId: number) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleViewAllToggle = (checked: boolean) => {
    setCanViewAllBranches(checked);
    if (checked) {
      setSelectedBranches([]); // Clear specific selections
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate branch assignment for HR/Admin roles
      const needsBranchAssignment = ['BranchHR', 'CompanyAdmin'].includes(userForm.role);
      if (needsBranchAssignment && !canViewAllBranches && selectedBranches.length === 0) {
        setError('Please assign at least one branch or enable "View All Branches"');
        return;
      }

      const payload = {
        ...userForm,
        branches: canViewAllBranches ? [] : selectedBranches,
        canViewAllBranches,
      };

      await onSubmit(payload);
      setSuccess('User created successfully!');

      // Reset form
      setUserForm({ name: '', email: '', username: '', password: 'Reg@12345', role: '' });
      setSelectedBranches([]);
      setCanViewAllBranches(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const showBranchAssignment = ['BranchHR', 'CompanyAdmin'].includes(userForm.role);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg border">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create User</h2>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={userForm.name}
              onChange={handleInputChange}
              required
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={userForm.email}
              onChange={handleInputChange}
              required
              placeholder="john@company.com"
            />
          </div>
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={userForm.username}
              onChange={handleInputChange}
              required
              placeholder="john_doe"
            />
          </div>
          <div>
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              value={userForm.role}
              onChange={handleRoleChange}
              required
              className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm font-medium"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={userForm.password}
            onChange={handleInputChange}
            placeholder="Default: Reg@12345"
          />
          <p className="text-xs text-gray-500 mt-1">
            User will be prompted to change password on first login
          </p>
        </div>
      </div>

      {/* Branch Assignment Section */}
      {showBranchAssignment && (
        <BranchAssignmentSection
          role={userForm.role}
          branches={branches}
          selectedBranches={selectedBranches}
          canViewAll={canViewAllBranches}
          onBranchToggle={handleBranchToggle}
          onViewAllToggle={handleViewAllToggle}
        />
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
