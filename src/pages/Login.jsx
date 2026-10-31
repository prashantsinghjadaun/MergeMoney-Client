import { useState } from "react";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { serverEndpoint } from "../config/appConfig";
import { useDispatch } from "react-redux";
import { SET_USER } from "../redux/user/action";
import { Link } from "react-router-dom";

const RECENT_EMAILS_KEY = "recent_login_emails";

const getRecentEmails = () => {
    try {
        const stored = localStorage.getItem(RECENT_EMAILS_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch {
        return [];
    }
};

const saveRecentEmail = (email) => {
    if (!email || typeof email !== "string") return;
    try {
        const trimmed = email.trim().toLowerCase();
        const existing = getRecentEmails();
        const filtered = existing.filter(
            (e) => typeof e === "string" && e.toLowerCase() !== trimmed
        );
        const updated = [trimmed, ...filtered].slice(0, 5);
        localStorage.setItem(RECENT_EMAILS_KEY, JSON.stringify(updated));
    } catch (err) {
        console.error("Failed to save recent email:", err);
    }
};

function Login() {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [recentEmails, setRecentEmails] = useState(() => getRecentEmails());

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        setFormData({
            ...formData,
            [name]: value,
        });

        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null,
            });
        }
    };

    const validate = () => {
        let newErrors = {};
        let isValid = true;

        if (formData.email.length === 0) {
            newErrors.email = "Email is required";
            isValid = false;
        }

        if (formData.password.length === 0) {
            newErrors.password = "Password is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleFormSubmit = async (event) => {
        // Prevent default behaviour of form which is to do complete page reload.
        event.preventDefault();

        if (validate()) {
            try {
                const body = {
                    email: formData.email,
                    password: formData.password,
                };
                const config = { withCredentials: true };
                const response = await axios.post(
                    `${serverEndpoint}/auth/login`,
                    body,
                    config
                );

                saveRecentEmail(formData.email);
                setRecentEmails(getRecentEmails());

                dispatch({
                    type: SET_USER,
                    payload: response.data.user,
                });
            } catch (error) {
                console.log(error);
                const errorMessage =
                    error.response?.data?.message ||
                    error.response?.data?.errors?.[0]?.msg ||
                    "Something went wrong, please try again";
                setErrors({
                    message: errorMessage,
                });
            }
        }
    };

    const handleGoogleSuccess = async (authResponse) => {
        try {
            const body = {
                idToken: authResponse?.credential,
            };
            const response = await axios.post(
                `${serverEndpoint}/auth/google-auth`,
                body,
                { withCredentials: true }
            );

            if (response.data.user?.email) {
                saveRecentEmail(response.data.user.email);
                setRecentEmails(getRecentEmails());
            }

            dispatch({
                type: SET_USER,
                payload: response.data.user,
            });
        } catch (error) {
            console.log(error);
            setErrors({
                message: "Unable to process google sso, please try again",
            });
        }
    };

    const handleGoogleFailure = (error) => {
        console.log(error);
        setErrors({
            message:
                "Something went wrong while performing google single sign-on",
        });
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    {/* Main Login Card */}
                    <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                        <div className="card-body p-5">
                            {/* Brand Header */}
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-dark">
                                    Welcome{" "}
                                    <span className="text-primary">Back</span>
                                </h2>
                                <p className="text-muted">
                                    Login to manage your MergeMoney account
                                </p>
                            </div>

                            {/* Global Alerts */}
                            {errors.message && (
                                <div className="alert alert-danger py-2 small border-0 shadow-sm mb-4">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {errors.message}
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} noValidate>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary">
                                        Email Address
                                    </label>

                                    {/* Recent Email Suggestions */}
                                    {recentEmails.length > 0 && (
                                        <div className="mb-2 d-flex flex-wrap align-items-center gap-1">
                                            <span className="text-muted small me-1">Recent:</span>
                                            {recentEmails.map((email) => (
                                                <button
                                                    key={email}
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill"
                                                    style={{ fontSize: "0.75rem" }}
                                                    onClick={() => {
                                                        setFormData((prev) => ({ ...prev, email }));
                                                        if (errors.email) {
                                                            setErrors((prev) => ({ ...prev, email: null }));
                                                        }
                                                    }}
                                                >
                                                    {email}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <input
                                        className={`form-control form-control-lg rounded-3 fs-6 ${
                                            errors.email ? "is-invalid" : ""
                                        }`}
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        list="recent-login-emails"
                                        onChange={handleChange}
                                    />
                                    <datalist id="recent-login-emails">
                                        {recentEmails.map((email) => (
                                            <option key={email} value={email} />
                                        ))}
                                    </datalist>
                                    {errors.email && (
                                        <div className="invalid-feedback">
                                            {errors.email}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-secondary">
                                        Password
                                    </label>
                                    <div className="input-group">
                                        <input
                                            className={`form-control form-control-lg rounded-3 rounded-end-0 fs-6 ${
                                                errors.password ? "is-invalid" : ""
                                            }`}
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary rounded-3 rounded-start-0"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                        </button>
                                        {errors.password && (
                                            <div className="invalid-feedback">
                                                {errors.password}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-center">
                                    <button className="btn btn-primary w-100 btn-md rounded-pill fw-bold shadow-sm mb-4">
                                        Sign In
                                    </button>
                                </div>
                            </form>

                            {/* Divider */}
                            <div className="d-flex align-items-center my-2">
                                <hr className="flex-grow-1 text-muted" />
                                <span className="mx-3 text-muted small fw-bold">
                                    OR
                                </span>
                                <hr className="flex-grow-1 text-muted" />
                            </div>

                            {/* Google Social Login */}
                            <div className="d-flex justify-content-center w-100">
                                <GoogleOAuthProvider
                                    clientId={
                                        import.meta.env.VITE_GOOGLE_CLIENT_ID
                                    }
                                >
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleFailure}
                                        theme="outline"
                                        shape="pill"
                                        text="signin_with"
                                        width="500"
                                    />
                                </GoogleOAuthProvider>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
