const fs = require("fs");
const path = "C:/Users/Olivier/Documents/REG Payroll System/pay/reserve-payroll/frontend/app/super-admin-dashboard/page.tsx";
let txt = fs.readFileSync(path, "utf8");

const tForm = `
              {/* Form */}
              <div className="panel">
                <h2>User Management</h2>
                <form id="userForm" className="user-form" onSubmit={saveUser}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div className="field-group">
                      <label htmlFor="national_id">National ID *</label>
                      <input type="text" id="national_id" value={form.national_id} onChange={handleChange} required />
                    </div>
                    <div className="field-group">
                      <label htmlFor="userName">Name *</label>
                      <input type="text" id="userName" value={form.name} onChange={handleChange} required />
                    </div>
                    <div className="field-group">
                      <label htmlFor="userUsername">Username</label>
                      <input type="text" id="userUsername" value={form.username} onChange={handleChange} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="date_of_birth">Date of Birth</label>
                      <input type="date" id="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="email">Email *</label>
                      <input type="email" id="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="field-group">
                      <label htmlFor="phone_number">Telephone *</label>
                      <input type="text" id="phone_number" value={form.phone_number} onChange={handleChange} required />
                    </div>
                    <div className="field-group">
                      <label htmlFor="branch">Branch</label>
                      <select id="branch" value={form.branch} onChange={handleChange}>
                        <option value="">Select Branch</option>
                        <option value="Musanze">Musanze</option>
                        <option value="Kigali">Kigali</option>
                        <option value="Rusizi">Rusizi</option>
                        {appBranch.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="payment_method">Payment Method</label>
                      <select id="payment_method" value={form.payment_method} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Telephone">Telephone</option>
                        <option value="Bank account">Bank account</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="payment_number">Payment Number</label>
                      <input type="text" id="payment_number" value={form.payment_number} onChange={handleChange} />
                    </div>
                    <div className="field-group">
                      <label htmlFor="userRole">Role *</label>
                      <select id="userRole" value={form.roleId} onChange={handleChange} required>
                        {roles.filter((r) => r.status === "ACTIVE").map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="userStatus">Status *</label>
                      <select id="userStatus" value={form.status} onChange={handleChange} required>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="LOCKED">LOCKED</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="category">Category</label>
                      <select id="category" value={form.category} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="manager">manager</option>
                        <option value="officer">officer</option>
                        <option value="casual worker">casual worker</option>
                        {appCategories.map(c => <option key={"cat-"+c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="contract_type">Contract Type</label>
                      <select id="contract_type" value={form.contract_type} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Fixed Term">Fixed Term</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label htmlFor="education_level">Education Level</label>
                      <select id="education_level" value={form.education_level} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="non-Study">non-Study</option>
                        <option value="primary level">primary level</option>
                        <option value="A2">A2</option>
                        <option value="A1">A1</option>
                        <option value="A0">A0</option>
                        <option value="Masters Degree">Masters Degree</option>
                        <option value="PHD">PHD</option>
                      </select>
                    </div>
                    {!isEditing && (
                      <div className="field-group">
                        <label htmlFor="userPassword">Password</label>
                        <input type="text" id="userPassword" value={form.password} onChange={handleChange} required />
                      </div>
                    )}
                  </div>

                  <div className="user-form-actions" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                    <button type="submit" className="primary-btn" id="saveUserBtn">
                      {isEditing ? "Update User" : "Save User"}
                    </button>
                    <button type="button" className="secondary-btn" id="cancelEditBtn" onClick={resetForm}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>\n`;

const tableUI = `
              {/* Table */}
              <div className="panel" style={{ marginTop: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2>System Users</h2>
                  <input 
                    type="text" 
                    placeholder="Search Users..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); loadUsers(e.target.value); }}
                    style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", minWidth: "250px" }}
                  />
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>National ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Branch</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody id="usersTableBody">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.national_id || "-"}</td>
                          <td>{user.name}</td>
                          <td>{user.email || "-"}</td>
                          <td>{user.phone_number || "-"}</td>
                          <td>{user.branch || "-"}</td>
                          <td>{roleNameById(user.roleId)}</td>
                          <td>{user.status}</td>
                          <td>
                            <div className="actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <button className="link-btn" onClick={() => editUser(user.id)}>Edit</button>
                              <button className="link-btn" onClick={() => resetUserPassword(user.id)} style={{ color: "#0056b3" }}>Reset Auth</button>
                              <button className="link-btn delete" onClick={() => deleteUser(user.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>\n            `;

const startForm = txt.indexOf("{/* Form */}");
const startTable = txt.indexOf("{/* Table */}");
const endTable = txt.indexOf("</section>", startTable);

if (startForm !== -1 && endTable !== -1) {
  const newText = txt.substring(0, startForm) + tForm + tableUI + txt.substring(endTable);
  fs.writeFileSync(path, newText);
  console.log("DOM updated!");
} else {
  console.error("Boundaries not found!", startForm, startTable, endTable);
}

