"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";

interface BranchOption {
  id: number;
  name: string;
  status: string;
}

interface CategoryOption {
  id: number;
  name: string;
  status: string;
}

interface FormProps {
  onSubmit: (data: any) => Promise<void>;
  branches: BranchOption[];
  categories: CategoryOption[];
  loading?: boolean;
}

type UserRole = "SuperAdmin" | "BranchHR" | "Employee";

const MOMO_PROVIDERS = ["MTN Mobile Money", "Airtel Money"];
const RWANDAN_BANKS = [
  "Bank of Kigali (BK)",
  "BPR Bank Rwanda",
  "I&M Bank",
  "Cogebanque",
  "Equity Bank",
  "KCB Bank",
  "Ecobank",
  "Access Bank",
  "GTBank",
  "NCBA Bank",
  "Urwego Bank",
  "Zigama CSS",
  "Unguka Bank"
];

// Field visibility configuration by role
const FIELD_CONFIG: Record<UserRole, { required: string[]; optional: string[] }> = {
  SuperAdmin: {
    required: ["full_name", "email", "national_id", "phone_number"],
    optional: ["username", "date_of_birth"],
  },
  BranchHR: {
    required: ["full_name", "email", "national_id", "phone_number", "branch"],
    optional: [
      "username",
      "date_of_birth",
      "category",
      "contract_start",
      "contract_end",
      "education_level",
      "payment_method",
      "payment_number",
    ],
  },
  Employee: {
    required: ["full_name", "email", "national_id", "phone_number", "branch", "category", "payment_method", "payment_number"],
    optional: [
      "username",
      "date_of_birth",
      "contract_start",
      "contract_end",
      "education_level",
    ],
  },
};

export default function RoleBasedUserForm({ onSubmit, branches, categories, loading = false }: FormProps) {
  const [role, setRole] = useState<UserRole>("Employee");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    national_id: "",
    username: "",
    date_of_birth: "",
    branch: "",
    category: "",
    contract_start: "",
    contract_end: "",
    education_level: "",
    payment_type: "",
    payment_method: "",
    payment_number: "",
    status: "PENDING",
  });
  const [error, setError] = useState("");

  const visibleFields = useMemo(() => {
    const config = FIELD_CONFIG[role];
    return new Set([...config.required, ...config.optional]);
  }, [role]);

  const requiredFields = useMemo(() => {
    return new Set(FIELD_CONFIG[role].required);
  }, [role]);

  const isFieldVisible = (fieldName: string): boolean => {
    return visibleFields.has(fieldName);
  };

  const isFieldRequired = (fieldName: string): boolean => {
    return requiredFields.has(fieldName);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    // Reset branch-related fields when role changes
    setFormData((prev) => ({
      ...prev,
      branch: "",
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setFormData((prev) => ({
      ...prev,
      payment_type: newType,
      payment_method: "", // reset provider when type changes
    }));
  };

  const validateForm = (): boolean => {
    setError("");

    // Check required fields
    for (const field of requiredFields) {
      const value = formData[field as keyof typeof formData];
      if (!value) {
        const fieldLabel = field.replace(/_/g, " ").toUpperCase();
        setError(`${fieldLabel} is required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const roleMap: Record<string, string> = {
        SuperAdmin: "SuperAdmin",
        BranchHR: "BranchHR",
        Employee: "Employee"
      };

      // Get branch name
      let branchName = "";
      if (formData.branch) {
        const selectedBranch = branches.find(b => b.id.toString() === formData.branch || b.name === formData.branch);
        if (selectedBranch) branchName = selectedBranch.name;
      }

      const payload = {
        role: roleMap[role],
        status: "ACTIVE",
        full_name: formData.full_name.trim(),
        email: formData.email.toLowerCase().trim(),
        ...(formData.phone_number && { phone_number: formData.phone_number }),
        ...(formData.national_id && { national_id: formData.national_id }),
        ...(formData.username && { username: formData.username.trim() }),
        ...(formData.date_of_birth && { date_of_birth: formData.date_of_birth }),
        ...(branchName && { branch: branchName }),
        ...((role === "Employee" || role === "BranchHR") && formData.category && { category: formData.category }),
        ...(formData.contract_start && { contract_start: formData.contract_start }),
        ...(formData.contract_end && { contract_end: formData.contract_end }),
        ...(formData.education_level && { education_level: formData.education_level }),
        ...(formData.payment_method && { payment_method: formData.payment_method }),
        ...(formData.payment_number && { payment_number: formData.payment_number }),
      };

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create User</h2>
        <p className="text-sm text-gray-600 mt-1">Role-based form with dynamic fields</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Password Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Password will be auto-generated</p>
          <p className="text-xs mt-1">User must change password on first login</p>
        </div>
      </div>

      {/* ===== ROLE SELECTION ===== */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">User Role *</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(["SuperAdmin", "BranchHR", "Employee"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleChange(r)}
              className={`p-3 rounded-lg border-2 font-medium transition ${
                role === r
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {r === "BranchHR" ? "Branch HR" : r}
            </button>
          ))}
        </div>
      </div>

      {/* ===== COMMON FIELDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        {isFieldVisible("full_name") && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="full_name">
              Full Name {isFieldRequired("full_name") && "*"}
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="John Doe"
              required={isFieldRequired("full_name")}
            />
          </div>
        )}

        {/* Email */}
        {isFieldVisible("email") && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">
              Email {isFieldRequired("email") && "*"}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@company.com"
              required={isFieldRequired("email")}
            />
          </div>
        )}

        {/* Phone */}
        {isFieldVisible("phone_number") && (
          <div className="space-y-2">
            <Label htmlFor="phone_number">
              Phone Number {isFieldRequired("phone_number") && "*"}
            </Label>
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="+250788123456"
            />
          </div>
        )}

        {/* National ID */}
        {isFieldVisible("national_id") && (
          <div className="space-y-2">
            <Label htmlFor="national_id">
              National ID {isFieldRequired("national_id") && "*"}
            </Label>
            <Input
              id="national_id"
              name="national_id"
              value={formData.national_id}
              onChange={handleInputChange}
              placeholder="1234567890123456"
            />
          </div>
        )}

        {/* Username */}
        {isFieldVisible("username") && (
          <div className="space-y-2">
            <Label htmlFor="username">
              Username {isFieldRequired("username") && "*"}
            </Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="john_doe"
            />
          </div>
        )}

        {/* Date of Birth */}
        {isFieldVisible("date_of_birth") && (
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">
              Date of Birth {isFieldRequired("date_of_birth") && "*"}
            </Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleInputChange}
            />
          </div>
        )}
      </div>

      {/* ===== BRANCH ASSIGNMENT (BranchHR) ===== */}
      {role === "BranchHR" && (
        <div className="border-t pt-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Branch Assignment</h3>
            <p className="text-sm text-gray-600 mt-1">Select branch to manage</p>
          </div>

          {/* Branch Selection */}
          <div>
            <Label htmlFor="branch">
              Branch *
            </Label>
            <select
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleInputChange}
              className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm mt-2"
              required={isFieldRequired("branch")}
            >
              <option value="">Select Branch</option>
              {branches
                .filter((b) => b.status === "ACTIVE")
                .map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* ===== EMPLOYEE FIELDS ===== */}
      {role === "Employee" && (
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Employment Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Branch */}
            {isFieldVisible("branch") && (
              <div className="space-y-2">
                <Label htmlFor="branch">
                  Branch {isFieldRequired("branch") && "*"}
                </Label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                  required={isFieldRequired("branch")}
                >
                  <option value="">Select Branch</option>
                  {branches
                    .filter((b) => b.status === "ACTIVE")
                    .map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Category */}
            {isFieldVisible("category") && (
              <div className="space-y-2">
                <Label htmlFor="category">
                  Job Category {isFieldRequired("category") && "*"}
                </Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                  required={isFieldRequired("category")}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Contract Start Date */}
            {isFieldVisible("contract_start") && (
              <div className="space-y-2">
                <Label htmlFor="contract_start">Contract Start Date</Label>
                <Input
                  id="contract_start"
                  name="contract_start"
                  type="date"
                  value={formData.contract_start}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {/* Contract End Date */}
            {isFieldVisible("contract_end") && (
              <div className="space-y-2">
                <Label htmlFor="contract_end">Contract End Date</Label>
                <Input
                  id="contract_end"
                  name="contract_end"
                  type="date"
                  value={formData.contract_end}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {/* Education Level */}
            {isFieldVisible("education_level") && (
              <div className="space-y-2">
                <Label htmlFor="education_level">Education Level</Label>
                <select
                  id="education_level"
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="">Select Level</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor's Degree</option>
                  <option value="Master">Master's Degree</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
            )}
            
            {/* Payment Type */}
            {isFieldVisible("payment_method") && (
              <div className="space-y-2">
                <Label htmlFor="payment_type">
                  Payment Type {isFieldRequired("payment_method") && "*"}
                </Label>
                <select
                  id="payment_type"
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handlePaymentTypeChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                  required={isFieldRequired("payment_method")}
                >
                  <option value="">Select Payment Type</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="MoMo">Mobile Money</option>
                </select>
              </div>
            )}

            {/* Payment Provider (Bank or MoMo) */}
            {formData.payment_type && isFieldVisible("payment_method") && (
              <div className="space-y-2">
                <Label htmlFor="payment_method">
                  {formData.payment_type === "Bank" ? "Select Bank" : "Select Provider"} {isFieldRequired("payment_method") && "*"}
                </Label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                  required={isFieldRequired("payment_method")}
                >
                  <option value="">
                    {formData.payment_type === "Bank" ? "Select Bank" : "Select Provider"}
                  </option>
                  {formData.payment_type === "Bank"
                    ? RWANDAN_BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))
                    : MOMO_PROVIDERS.map((provider) => (
                        <option key={provider} value={provider}>{provider}</option>
                      ))}
                </select>
              </div>
            )}

            {/* Payment Number */}
            {isFieldVisible("payment_number") && formData.payment_method && (
              <div className="space-y-2">
                <Label htmlFor="payment_number">
                  {formData.payment_type === "Bank" ? "Account Number" : "Mobile Money Number"} {isFieldRequired("payment_number") && "*"}
                </Label>
                <Input
                  id="payment_number"
                  name="payment_number"
                  value={formData.payment_number}
                  onChange={handleInputChange}
                  placeholder={formData.payment_type === "Bank" ? "e.g., 00000000000" : "e.g., 078XXXXXXX"}
                  required={isFieldRequired("payment_number")}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== BranchHR OPTIONAL FIELDS ===== */}
      {role === "BranchHR" && (
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Optional Employment Information</h3>
          <p className="text-sm text-gray-600">Only fill if this HR is also a payroll employee</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            {isFieldVisible("category") && (
              <div className="space-y-2">
                <Label htmlFor="category">Job Category</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Contract Start */}
            {isFieldVisible("contract_start") && (
              <div className="space-y-2">
                <Label htmlFor="contract_start">Contract Start Date</Label>
                <Input
                  id="contract_start"
                  name="contract_start"
                  type="date"
                  value={formData.contract_start}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {/* Contract End */}
            {isFieldVisible("contract_end") && (
              <div className="space-y-2">
                <Label htmlFor="contract_end">Contract End Date</Label>
                <Input
                  id="contract_end"
                  name="contract_end"
                  type="date"
                  value={formData.contract_end}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {/* Education */}
            {isFieldVisible("education_level") && (
              <div className="space-y-2">
                <Label htmlFor="education_level">Education Level</Label>
                <select
                  id="education_level"
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="">Select Level</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
            )}
            
            {/* Payment Type */}
            {isFieldVisible("payment_method") && (
              <div className="space-y-2">
                <Label htmlFor="payment_type">Payment Type</Label>
                <select
                  id="payment_type"
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handlePaymentTypeChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="">Select Payment Type</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="MoMo">Mobile Money</option>
                </select>
              </div>
            )}

            {/* Payment Provider */}
            {formData.payment_type && isFieldVisible("payment_method") && (
              <div className="space-y-2">
                <Label htmlFor="payment_method">
                  {formData.payment_type === "Bank" ? "Select Bank" : "Select Provider"}
                </Label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm"
                >
                  <option value="">
                    {formData.payment_type === "Bank" ? "Select Bank" : "Select Provider"}
                  </option>
                  {formData.payment_type === "Bank"
                    ? RWANDAN_BANKS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))
                    : MOMO_PROVIDERS.map((provider) => (
                        <option key={provider} value={provider}>{provider}</option>
                      ))}
                </select>
              </div>
            )}

            {/* Payment Number */}
            {isFieldVisible("payment_number") && formData.payment_method && (
              <div className="space-y-2">
                <Label htmlFor="payment_number">Account / Phone</Label>
                <Input
                  id="payment_number"
                  name="payment_number"
                  value={formData.payment_number}
                  onChange={handleInputChange}
                  placeholder={formData.payment_type === "Bank" ? "e.g., 00000000000" : "e.g., 078XXXXXXX"}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  );
}
