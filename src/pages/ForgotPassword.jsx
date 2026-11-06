
import { useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import { Link } from "react-router-dom";

function ForgotPassword() {
    const [step, setStep] = useState(1); // Step 1: Email, Step 2: Reset Code & Password
    const [email, setEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailSubmit = async (event) => {
        event.preventDefault();
        setErrors({});
        setSuccessMessage("");

        if (!email) {
            setErrors({ email: "Email is required" });
            return;
        }

        setIsLoading(true);
        try {
            await axios.post(
                `${serverEndpoint}/auth/forgot-password`,
                { email },
                { withCredentials: true }
            );

            setSuccessMessage("Reset code sent! Please check your registered email.");
            setStep(2);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error sending reset code";
            setErrors({ message: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const validateResetForm = () => {
        let newErrors = {};
        let isValid = true;

        if (!resetCode) {
            newErrors.resetCode = "Reset code is required";
            isValid = false;
        }

        if (!newPassword) {
            newErrors.newPassword = "New password is required";
            isValid = false;
        } else if (newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters";
            isValid = false;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleResetSubmit = async (event) => {
        event.preventDefault();
        setSuccessMessage("");

        if (validateResetForm()) {
            setIsLoading(true);
            try {
                await axios.post(
                    `${serverEndpoint}/auth/reset-password`,
                    {
                        email,
                        resetCode,
                        newPassword,
                        confirmPassword,
                    },
                    { withCredentials: true }
                );

                setSuccessMessage("Password reset successfully! Redirecting to login...");
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } catch (error) {
                const errorMessage = error.response?.data?.message || "Error resetting password";
                setErrors({ message: errorMessage });
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                        <div className="card-body p-5">
                            {/* Brand Header */}
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-dark">
                                    Reset Your Password
                                </h2>
                                <p className="text-muted">
                                    {step === 1
                                        ? "Enter your email to receive a reset code"
                                        : "Enter your reset code and new password"}
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
                            {errors.message && (
                                <div className="alert alert-danger py-2 small border-0 shadow-sm mb-4">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {errors.message}
                                </div>
                            )}

                            {step === 1 ? (
                                <form onSubmit={handleEmailSubmit} noValidate>
                                    {/* Email Field */}
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-secondary">
                                            Email Address
                                        </label>
                                        <input
                                            className={`form-control form-control-lg rounded-3 fs-6 ${
                                                errors.email ? "is-invalid" : ""
                                            }`}
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (errors.email) {
                                                    setErrors({ ...errors, email: "" });
                                                }
                                            }}
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-center">
                                        <button
                                            className="btn btn-primary w-100 btn-md rounded-pill fw-bold shadow-sm mb-4"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Sending..." : "Send Reset Code"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleResetSubmit} noValidate>
                                    {/* Reset Code Field */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary">
                                            Reset Code
                                        </label>
                                        <input
                                            className={`form-control form-control-lg rounded-3 fs-6 ${
                                                errors.resetCode ? "is-invalid" : ""
                                            }`}
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            value={resetCode}
                                            onChange={(e) => {
                                                setResetCode(e.target.value);
                                                if (errors.resetCode) {
                                                    setErrors({ ...errors, resetCode: "" });
                                                }
                                            }}
                                        />
                                        {errors.resetCode && (
                                            <div className="invalid-feedback">
                                                {errors.resetCode}
                                            </div>
                                        )}
                                        <small className="text-muted d-block mt-2">
                                            Check your browser console for the reset code (demo)
                                        </small>
                                    </div>

                                    {/* New Password Field */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary">
                                            New Password
                                        </label>
                                        <input
                                            className={`form-control form-control-lg rounded-3 fs-6 ${
                                                errors.newPassword ? "is-invalid" : ""
                                            }`}
                                            type="password"
                                            placeholder="At least 6 characters"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                if (errors.newPassword) {
                                                    setErrors({ ...errors, newPassword: "" });
                                                }
                                            }}
                                        />
                                        {errors.newPassword && (
                                            <div className="invalid-feedback">
                                                {errors.newPassword}
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-secondary">
                                            Confirm Password
                                        </label>
                                        <input
                                            className={`form-control form-control-lg rounded-3 fs-6 ${
                                                errors.confirmPassword ? "is-invalid" : ""
                                            }`}
                                            type="password"
                                            placeholder="Re-enter your password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                if (errors.confirmPassword) {
                                                    setErrors({ ...errors, confirmPassword: "" });
                                                }
                                            }}
                                        />
                                        {errors.confirmPassword && (
                                            <div className="invalid-feedback">
                                                {errors.confirmPassword}
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-center">
                                        <button
                                            className="btn btn-primary w-100 btn-md rounded-pill fw-bold shadow-sm mb-4"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Resetting..." : "Reset Password"}
                                        </button>
                                    </div>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm text-decoration-none"
                                            onClick={() => {
                                                setStep(1);
                                                setResetCode("");
                                                setNewPassword("");
                                                setConfirmPassword("");
                                                setErrors({});
                                            }}
                                        >
                                            Back to enter email
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Link to Login */}
                            <div className="text-center mt-4">
                                <p className="text-muted small">
                                    Remember your password?{" "}
                                    <Link to="/login" className="text-primary fw-bold text-decoration-none">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;