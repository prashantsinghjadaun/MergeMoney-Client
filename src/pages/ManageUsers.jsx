import { useEffect, useState } from "react";
import { serverEndpoint } from "../config/appConfig";
import axios from "axios";
import Can from "../components/can";

function ManageUsers() {
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "Select",
    });

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${serverEndpoint}/users/`, {
                withCredentials: true,
            });
            setUsers(response.data.users);
        } catch (error) {
            console.log(error);
            setErrors({ message: "Unable to fetch users, please try again" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validate = () => {
        let isValid = true;
        let newErrors = {};
        if (formData.name.length === 0) {
            isValid = false;
            newErrors.name = "Name is required";
        }

        if (!editingUserId && formData.email.length === 0) {
            isValid = false;
            newErrors.email = "Email is required";
        }

        if (formData.role === "Select") {
            isValid = false;
            newErrors.role = "Role is required";
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validate()) {
            setActionLoading(true);
            try {
                if (editingUserId) {
                    // Update existing user
                    const response = await axios.patch(
                        `${serverEndpoint}/users/`,
                        {
                            userId: editingUserId,
                            name: formData.name,
                            role: formData.role,
                        },
                        { withCredentials: true }
                    );
                    setUsers(users.map(u => u._id === editingUserId ? response.data.user : u));
                    setMessage("User updated successfully!");
                    setEditingUserId(null);
                } else {
                    // Add new user
                    const response = await axios.post(
                        `${serverEndpoint}/users/`,
                        {
                            name: formData.name,
                            email: formData.email,
                            role: formData.role,
                        },
                        { withCredentials: true }
                    );
                    setUsers([...users, response.data.user]);
                    setMessage("User added successfully!");
                }
                setFormData({ name: "", email: "", role: "Select" });
                setErrors({});
            } catch (error) {
                console.log(error);
                setErrors({ message: error.response?.data?.message || "Unable to save user, please try again" });
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUserId(user._id);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
        });
        setErrors({});
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setActionLoading(true);
            try {
                await axios.post(
                    `${serverEndpoint}/users/delete`,
                    { userId },
                    { withCredentials: true }
                );
                setUsers(users.filter(u => u._id !== userId));
                setMessage("User deleted successfully!");
            } catch (error) {
                console.log(error);
                setErrors({ message: error.response?.data?.message || "Unable to delete user" });
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleCancel = () => {
        setEditingUserId(null);
        setFormData({ name: "", email: "", role: "Select" });
        setErrors({});
    };

    if (loading) {
        return (
            <div className="container p-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100 py-5">
            <div className="container">
                {/* Header Section */}
                <div className="mb-5">
                    <h1 className="fw-bold text-dark mb-2">
                        <i className="bi bi-people-fill text-primary me-2"></i>
                        Manage Users
                    </h1>
                    <p className="text-muted fs-5">
                        View and manage all team members along with their roles and permissions
                    </p>
                </div>

                {/* Alert Messages */}
                {errors.message && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="bi bi-exclamation-circle me-2"></i>
                        {errors.message}
                        <button type="button" className="btn-close" onClick={() => setErrors({})}></button>
                    </div>
                )}

                {message && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="bi bi-check-circle me-2"></i>
                        {message}
                        <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                    </div>
                )}

                <div className="row g-4">
                    {/* Add Member Form */}
                    <Can requiredPermission="canCreateUsers">
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-lg h-100">
                                <div className="card-header bg-primary text-white border-0 py-3">
                                    <h5 className="mb-0">
                                        <i className="bi bi-plus-circle me-2"></i>
                                        {editingUserId ? 'Edit Member' : 'Add New Member'}
                                    </h5>
                                </div>

                                <div className="card-body p-4">
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-dark">
                                                <i className="bi bi-person me-1 text-primary"></i>
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                className={`form-control form-control-lg ${
                                                    errors.name ? 'is-invalid' : ''
                                                }`}
                                                placeholder="Enter member name"
                                                value={formData.name}
                                                onChange={handleChange}
                                            />
                                            {errors.name && (
                                                <div className="invalid-feedback d-block">
                                                    <i className="bi bi-exclamation-circle me-1"></i>
                                                    {errors.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold text-dark">
                                                <i className="bi bi-envelope me-1 text-primary"></i>
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                className={`form-control form-control-lg ${
                                                    errors.email ? 'is-invalid' : ''
                                                }`}
                                                placeholder="Enter email address"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={editingUserId}
                                            />
                                            {errors.email && (
                                                <div className="invalid-feedback d-block">
                                                    <i className="bi bi-exclamation-circle me-1"></i>
                                                    {errors.email}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label fw-semibold text-dark">
                                                <i className="bi bi-shield-check me-1 text-primary"></i>
                                                Role
                                            </label>
                                            <select
                                                name="role"
                                                className={`form-select form-select-lg ${
                                                    errors.role ? 'is-invalid' : ''
                                                }`}
                                                value={formData.role}
                                                onChange={handleChange}
                                            >
                                                <option value="Select">Select a role</option>
                                                <option value="manager">Manager</option>
                                                <option value="viewer">Viewer</option>
                                            </select>
                                            {errors.role && (
                                                <div className="invalid-feedback d-block">
                                                    <i className="bi bi-exclamation-circle me-1"></i>
                                                    {errors.role}
                                                </div>
                                            )}
                                        </div>

                                        <div className="d-grid gap-2">
                                            <button
                                                className="btn btn-primary btn-lg fw-semibold"
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        {editingUserId ? 'Updating...' : 'Adding...'}
                                                    </>
                                                ) : editingUserId ? (
                                                    <>
                                                        <i className="bi bi-pencil-square me-2"></i>
                                                        Update Member
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-plus-circle me-2"></i>
                                                        Add Member
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {editingUserId && (
                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-lg w-100 fw-semibold"
                                                    onClick={handleCancel}
                                                >
                                                    <i className="bi bi-x-circle me-2"></i>
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        </div>
                    </Can>

                    {/* Team Members Table */}
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-lg h-100">
                            <div className="card-header bg-gradient bg-primary text-white border-0 py-3">
                                <h5 className="mb-0">
                                    <i className="bi bi-people me-2"></i>
                                    Team Members ({users.length})
                                </h5>
                            </div>

                            <div className="card-body p-4">
                                {users.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="mb-3">
                                            <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                                        </div>
                                        <h6 className="text-muted">No team members yet</h6>
                                        <p className="text-muted small">Start by adding your first team member using the form on the left</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="fw-semibold text-dark">
                                                        <i className="bi bi-person me-2 text-primary"></i>
                                                        Name
                                                    </th>
                                                    <th className="fw-semibold text-dark">
                                                        <i className="bi bi-envelope me-2 text-primary"></i>
                                                        Email
                                                    </th>
                                                    <th className="fw-semibold text-dark">
                                                        <i className="bi bi-shield me-2 text-primary"></i>
                                                        Role
                                                    </th>
                                                    <th className="fw-semibold text-dark text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr key={user._id} className="border-bottom">
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div
                                                                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                                                                    style={{ width: '40px', height: '40px' }}
                                                                >
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="fw-semibold text-dark">{user.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-muted">{user.email}</td>
                                                        <td>
                                                            <span className="badge bg-info text-dark">
                                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                onClick={() => handleEdit(user)}
                                                                title="Edit member"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDelete(user._id)}
                                                                disabled={actionLoading}
                                                                title="Delete member"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageUsers;