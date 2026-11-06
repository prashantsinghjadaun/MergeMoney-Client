import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { serverEndpoint } from "../config/appConfig";
import { useDispatch } from "react-redux";
import { SET_USER } from "../redux/user/action";
import { Link, useNavigate } from "react-router-dom";

const PASSWORD_RULES = [
    { key: "minLength", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
    { key: "uppercase", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
    { key: "lowercase", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
    { key: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
    { key: "special", label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function Signup() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        setFormData({
            ...formData,
            [name]: value,
        });
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: "",
            });
        }
    };

    const validate = () => {
        let newErrors = {};
        let isValid = true;

        if (formData.name.length === 0) {
            newErrors.name = "Name is required";
            isValid = false;
        }

        if (formData.email.length === 0) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
            isValid = false;
        }

        if (formData.password.length === 0) {
            newErrors.password = "Password is required";
            isValid = false;
        } else {
            const failedRules = PASSWORD_RULES.filter((rule) => !rule.test(formData.password));
            if (failedRules.length > 0) {
                newErrors.password = "Password does not meet all requirements";
                isValid = false;
            }
        }

        if (formData.confirmPassword.length === 0) {
            newErrors.confirmPassword = "Please confirm your password";
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        setSuccessMessage("");

        if (validate()) {
            setIsLoading(true);
            try {
                const body = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                };
                await axios.post(
                    `${serverEndpoint}/auth/register`,
                    body,
                    { withCredentials: true }
                );

                setSuccessMessage("Account created successfully! Redirecting to login...");

                // Clear form
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                });

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } catch (error) {
                console.log(error);
                const errorMessage = error.response?.data?.message || "Something went wrong, please try again";
                setErrors({
                    message: errorMessage,
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGoogleSuccess = async (authResponse) => {
        try {
            console.log('=== Google Authentication Success ===');
            console.log('AuthResponse received:', {
                credential: authResponse?.credential ? 'received (JWT token)' : 'MISSING',
                clientId: authResponse?.clientId ? 'present' : 'missing'
            });

            if (!authResponse?.credential) {
                console.error('ERROR: No credential in authResponse');
                setErrors({
                    message: "No credential received from Google. Please try again.",
                });
                return;
            }

            const body = {
                idToken: authResponse.credential,
            };

            console.log('Sending request to backend...');
            console.log('Server endpoint:', serverEndpoint);

            const response = await axios.post(
                `${serverEndpoint}/auth/google-auth`,
                body,
                { withCredentials: true }
            );

            console.log('Backend response received:', response.data);
            dispatch({
                type: SET_USER,
                payload: response.data.user,
            });
            navigate("/dashboard");
        } catch (error) {
            console.error('=== Google SSO Error ===');
            console.error('Error status:', error.response?.status);
            console.error('Error message:', error.response?.data?.message);
            console.error('Full error response:', error.response?.data);
            console.error('Network error:', error.message);
            setErrors({
                message: error.response?.data?.message || "Unable to process google sso, please try again",
            });
        }
    };

    const handleGoogleFailure = (error) => {
        console.log(error);
        setErrors({
            message: "Something went wrong while performing google single sign-on",
        });
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    {/* Main Signup Card */}
                    <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                        <div className="card-body p-5">
                            {/* Brand Header */}
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-dark">
                                    Create Your Account
                                </h2>
                                <p className="text-muted">
                                    Join MergeMoney to manage expenses together
                                </p>
                            </div>

                            {/* Success Alert */}
                            {successMessage && (
                                <div className="alert alert-success py-2 small border-0 shadow-sm mb-4">
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    {successMessage}
                                </div>
                            )}

                            {/* Error Alert */}
                            {(errors.message) && (
                                <div className="alert alert-danger py-2 small border-0 shadow-sm mb-4">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {errors.message}
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} noValidate>
                                {/* Name Field */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary">
                                        Full Name
                                    </label>
                                    <input
                                        className={`form-control form-control-lg rounded-3 fs-6 ${
                                            errors.name ? "is-invalid" : ""
                                        }`}
                                        type="text"
                                        name="name"
                                        placeholder="John Doe"
                                        autoComplete="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>

                                {/* Email Field */}
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-secondary">
                                        Email Address
                                    </label>
                                    <input
                                        className={`form-control form-control-lg rounded-3 fs-6 ${
                                            errors.email ? "is-invalid" : ""
                                        }`}
                                        type="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                    {errors.email && (
                                        <div className="invalid-feedback">
                                            {errors.email}
                                        </div>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div className="mb-3">
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
                                            placeholder="Create a strong password"
                                            autoComplete="new-password"
                                            value={formData.password}
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
                                    {/* Password Requirements Checklist */}
                                    {formData.password.length > 0 && (
                                        <ul className="list-unstyled mt-2 mb-0 small">
                                            {PASSWORD_RULES.map((rule) => {
                                                const passed = rule.test(formData.password);
                                                return (
                                                    <li key={rule.key} className={passed ? "text-success" : "text-muted"}>
                                                        <i className={`bi ${passed ? "bi-check-circle-fill" : "bi-circle"} me-1`}></i>
                                                        {rule.label}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>

                                {/* Confirm Password Field */}
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-secondary">
                                        Confirm Password
                                    </label>
                                    <div className="input-group">
                                        <input
                                            className={`form-control form-control-lg rounded-3 rounded-end-0 fs-6 ${
                                                errors.confirmPassword ? "is-invalid" : ""
                                            }`}
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            placeholder="Re-enter your password"
                                            autoComplete="new-password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary rounded-3 rounded-start-0"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                        </button>
                                        {errors.confirmPassword && (
                                            <div className="invalid-feedback">
                                                {errors.confirmPassword}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-center">
                                    <button
                                        className="btn btn-primary w-100 btn-md rounded-pill fw-bold shadow-sm mb-4"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Creating Account..." : "Sign Up"}
                                    </button>
                                </div>
                            </form>

                            {/* Link to Login */}
                            <div className="text-center mb-3">
                                <p className="text-muted small">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-primary fw-bold text-decoration-none">
                                        Sign In
                                    </Link>
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="d-flex align-items-center my-2">
                                <hr className="flex-grow-1 text-muted" />
                                <span className="mx-3 text-muted small fw-bold">
                                    OR
                                </span>
                                <hr className="flex-grow-1 text-muted" />
                            </div>

                            {/* Google Social Signup */}
                            <div className="d-flex justify-content-center w-100">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={handleGoogleFailure}
                                    theme="outline"
                                    shape="pill"
                                    text="signup_with"
                                    width="350"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;