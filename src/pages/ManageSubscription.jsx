import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import { useDispatch, useSelector } from "react-redux";
import { SET_USER } from "../redux/user/action";

const PLANS = {
    UNLIMITED_MONTHLY: {
        id: "UNLIMITED_MONTHLY",
        name: "Premium Monthly",
        price: 99,
        period: "month",
        badge: "Flexible",
        badgeVariant: "secondary",
        features: [
            "Unlimited group creation",
            "Full settlement calculations",
            "UPI peer settlements & QR links",
            "Detailed group balance tracking",
            "Email support"
        ]
    },
    UNLIMITED_YEARLY: {
        id: "UNLIMITED_YEARLY",
        name: "Premium Yearly",
        price: 799,
        period: "year",
        badge: "Best Value — Save ~33%",
        badgeVariant: "success",
        features: [
            "All Monthly features included",
            "Equivalent to 2 months free",
            "Priority settlement reconciliation",
            "Priority customer support",
            "Early access to new features"
        ]
    }
};

function ManageSubscription() {
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => state.userDetails);

    const [userProfile, setUserProfile] = useState(null);
    const [plansConfig, setPlansConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribingPlan, setSubscribingPlan] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch authoritative backend plan configurations
    useEffect(() => {
        axios.get(`${serverEndpoint}/payments/plans`)
            .then((res) => {
                if (res.data?.plans) {
                    setPlansConfig(res.data.plans);
                }
            })
            .catch((err) => {
                console.warn("Using default plans configuration:", err.message);
            });
    }, []);

    // Dynamically inject Razorpay Checkout script if not already present
    useEffect(() => {
        if (window.Razorpay) return;

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    // Fetch authoritative user profile from backend
    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/profile/get-user-info`,
                { withCredentials: true }
            );
            setUserProfile(response.data.user);
            setError(null);
        } catch (err) {
            console.error("Error fetching user profile:", err);
            setError("Unable to fetch current subscription status.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // Backend-authoritative verification handler
    const verifyCheckout = async (checkoutResponse) => {
        setVerifying(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post(
                `${serverEndpoint}/payments/verify-subscription`,
                {
                    razorpay_payment_id: checkoutResponse.razorpay_payment_id,
                    razorpay_subscription_id: checkoutResponse.razorpay_subscription_id,
                    razorpay_signature: checkoutResponse.razorpay_signature
                },
                { withCredentials: true }
            );

            const updatedUser = response.data.user;
            setUserProfile(updatedUser);
            dispatch({ type: SET_USER, payload: updatedUser });
            setSuccess("Congratulations! Your MergeMoney Premium subscription is now active.");
        } catch (err) {
            console.error("Subscription verification failed:", err);
            setError(err.response?.data?.message || "Subscription verification failed. Please contact support.");
        } finally {
            setVerifying(false);
            setSubscribingPlan(null);
        }
    };

    // Initiate Razorpay subscription flow
    const handleSubscribe = async (planKey) => {
        setError(null);
        setSuccess(null);

        // Guard against subscribing when already active
        if (isSubscribed && activePlanKey === planKey) {
            setError("You are already subscribed to this plan.");
            return;
        }

        if (isSubscribed && activePlanKey && activePlanKey !== planKey) {
            setError("Plan switching is not available in self-service. Please contact support@mergemoney.com to modify your mandate.");
            return;
        }

        setSubscribingPlan(planKey);

        if (!window.Razorpay) {
            setError("Razorpay SDK is still loading. Please refresh the page or try again in a moment.");
            setSubscribingPlan(null);
            return;
        }

        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!razorpayKey) {
            setError("Razorpay Key ID is not configured (missing VITE_RAZORPAY_KEY_ID in client environment).");
            setSubscribingPlan(null);
            return;
        }

        try {
            const createRes = await axios.post(
                `${serverEndpoint}/payments/create-subscription`,
                { plan_name: planKey },
                { withCredentials: true }
            );

            const subscription = createRes.data.subscription;
            if (!subscription || !subscription.id) {
                throw new Error("Invalid response received from subscription service");
            }

            const selectedPlan = PLANS[planKey];
            const options = {
                key: razorpayKey,
                subscription_id: subscription.id,
                name: "MergeMoney",
                description: `${selectedPlan.name} (₹${selectedPlan.price}/${selectedPlan.period})`,
                theme: { color: "#0d6efd" },
                prefill: {
                    name: userProfile?.name || currentUser?.name || "",
                    email: userProfile?.email || currentUser?.email || ""
                },
                handler: async (checkoutResponse) => {
                    await verifyCheckout(checkoutResponse);
                },
                modal: {
                    ondismiss: () => {
                        setSubscribingPlan(null);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (failResponse) => {
                console.error("Razorpay payment failed:", failResponse.error);
                setError(`Payment failed: ${failResponse.error?.description || "Transaction was not completed."}`);
                setSubscribingPlan(null);
            });
            rzp.open();
        } catch (err) {
            console.error("Error creating subscription:", err);
            setError(err.response?.data?.message || "Failed to initiate subscription. Please try again.");
            setSubscribingPlan(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
            return new Date(dateString).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading subscription details...</span>
                </div>
            </div>
        );
    }

    const subscription = userProfile?.subscription;
    const isSubscribed = Boolean(
        subscription &&
        subscription.status === "active" &&
        (!subscription.end || new Date(subscription.end) > new Date())
    );

    // Authoritative active plan key matching
    const activePlanKey = isSubscribed
        ? (subscription?.planKey || (
            subscription?.planId === "UNLIMITED_MONTHLY" || (plansConfig?.UNLIMITED_MONTHLY?.planId && subscription?.planId === plansConfig.UNLIMITED_MONTHLY.planId)
                ? "UNLIMITED_MONTHLY"
                : subscription?.planId === "UNLIMITED_YEARLY" || (plansConfig?.UNLIMITED_YEARLY?.planId && subscription?.planId === plansConfig.UNLIMITED_YEARLY.planId)
                    ? "UNLIMITED_YEARLY"
                    : null
          ))
        : null;

    return (
        <div className="container py-5">
            {/* Header */}
            <div className="text-center mb-5">
                <h2 className="fw-bold mb-2">MergeMoney Premium</h2>
                <p className="text-muted">
                    Unlock unlimited groups, automated settlement tracking, and advanced split features.
                </p>
            </div>

            {/* Status Notifications */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
                </div>
            )}

            {success && (
                <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {success}
                    <button type="button" className="btn-close" onClick={() => setSuccess(null)} aria-label="Close"></button>
                </div>
            )}

            {verifying && (
                <div className="alert alert-info d-flex align-items-center gap-3 mb-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <div>
                        <strong>Verifying transaction with Razorpay...</strong>
                        <div className="small text-muted">Please wait while we confirm your subscription.</div>
                    </div>
                </div>
            )}

            {/* Current Subscription Status Card */}
            {subscription && subscription.status && (
                <div className="card shadow-sm border-0 mb-5">
                    <div className="card-body p-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3">
                            <div>
                                <span className="text-muted small text-uppercase fw-bold">Current Membership</span>
                                <h4 className="fw-bold mb-0 text-dark">
                                    {isSubscribed
                                        ? (activePlanKey === "UNLIMITED_YEARLY" ? "Premium Yearly Plan" : "Premium Monthly Plan")
                                        : "Standard Plan"}
                                </h4>
                            </div>
                            <div className="mt-2 mt-sm-0">
                                {subscription.status === "active" && (
                                    <span className="badge bg-success fs-6 px-3 py-2">
                                        <i className="bi bi-patch-check-fill me-1"></i> Active
                                    </span>
                                )}
                                {subscription.status === "pending" && (
                                    <span className="badge bg-warning text-dark fs-6 px-3 py-2">
                                        <i className="bi bi-hourglass-split me-1"></i> Pending Verification
                                    </span>
                                )}
                                {subscription.status === "halted" && (
                                    <span className="badge bg-danger fs-6 px-3 py-2">
                                        <i className="bi bi-exclamation-octagon-fill me-1"></i> Payment Halted
                                    </span>
                                )}
                                {subscription.status === "cancelled" && (
                                    <span className="badge bg-secondary fs-6 px-3 py-2">
                                        Cancelled
                                    </span>
                                )}
                                {subscription.status === "completed" && (
                                    <span className="badge bg-info text-dark fs-6 px-3 py-2">
                                        Completed
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-sm-6 col-md-3">
                                <span className="text-muted small d-block">Subscription ID</span>
                                <code className="fw-medium text-dark">{subscription.subscriptionId || "—"}</code>
                            </div>
                            <div className="col-sm-6 col-md-3">
                                <span className="text-muted small d-block">Started On</span>
                                <span className="fw-medium text-dark">{formatDate(subscription.start)}</span>
                            </div>
                            <div className="col-sm-6 col-md-3">
                                <span className="text-muted small d-block">Next Billing Date</span>
                                <span className="fw-medium text-dark">{formatDate(subscription.nextBillDate || subscription.end)}</span>
                            </div>
                            <div className="col-sm-6 col-md-3">
                                <span className="text-muted small d-block">Payments Made</span>
                                <span className="fw-medium text-dark">{subscription.paymentsMade ?? 1} billing cycle(s)</span>
                            </div>
                        </div>

                        {/* Explicit Policy Regarding Cancellation */}
                        <div className="bg-light rounded-3 p-3 mt-4">
                            <div className="d-flex align-items-start gap-2">
                                <i className="bi bi-info-circle text-primary mt-1"></i>
                                <div className="small text-muted">
                                    <strong>Cancellation Policy:</strong> Self-service in-app cancellation is not currently supported by the API. To cancel or modify your recurring UPI/card mandate, please manage it directly within your banking app or contact support at <code>support@mergemoney.com</code>.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Plans Grid */}
            <div className="row justify-content-center g-4">
                {Object.values(PLANS).map((plan) => {
                    const isYearly = plan.id === "UNLIMITED_YEARLY";
                    const isCurrentPlan = isSubscribed && activePlanKey === plan.id;
                    const isOtherPlanWhileSubscribed = isSubscribed && !isCurrentPlan;

                    return (
                        <div key={plan.id} className="col-lg-5 col-md-6">
                            <div
                                className={`card h-100 shadow-sm border-2 ${
                                    isCurrentPlan
                                        ? "border-success shadow"
                                        : isYearly
                                            ? "border-primary"
                                            : "border-light-subtle"
                                } rounded-4 position-relative`}
                            >
                                {isCurrentPlan ? (
                                    <span
                                        className="position-absolute top-0 end-0 translate-middle-y me-4 badge bg-success px-3 py-2 shadow-sm rounded-pill"
                                    >
                                        <i className="bi bi-patch-check-fill me-1"></i> ACTIVE PLAN
                                    </span>
                                ) : plan.badge ? (
                                    <span
                                        className={`position-absolute top-0 end-0 translate-middle-y me-4 badge bg-${plan.badgeVariant} px-3 py-2 shadow-sm rounded-pill`}
                                    >
                                        {plan.badge}
                                    </span>
                                ) : null}

                                <div className="card-body p-4 d-flex flex-column">
                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                        <h4 className="fw-bold mb-0">{plan.name}</h4>
                                        {isCurrentPlan && (
                                            <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-muted small mb-4">
                                        {isYearly ? "Billed annually" : "Billed monthly"}
                                    </p>

                                    <div className="d-flex align-items-baseline mb-4">
                                        <span className="display-5 fw-bold text-dark">₹{plan.price}</span>
                                        <span className="text-muted ms-2">/ {plan.period}</span>
                                    </div>

                                    <ul className="list-unstyled mb-4 flex-grow-1">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="d-flex align-items-center gap-2 mb-2">
                                                <i className="bi bi-check-circle-fill text-primary"></i>
                                                <span className="small">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Plan Action Button */}
                                    {isCurrentPlan ? (
                                        <button
                                            type="button"
                                            className="btn btn-success py-2 fw-medium w-100 shadow-sm"
                                            disabled
                                        >
                                            <i className="bi bi-check-circle-fill me-2"></i> Current Plan
                                        </button>
                                    ) : isOtherPlanWhileSubscribed ? (
                                        <div>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary py-2 fw-medium w-100"
                                                disabled
                                                title="Plan switching is not available while an active subscription is in place."
                                            >
                                                <i className="bi bi-arrow-left-right me-2"></i> Switch Plan (Contact Support)
                                            </button>
                                            <div className="text-center mt-2">
                                                <small className="text-muted" style={{ fontSize: "0.78rem" }}>
                                                    To switch plans, please cancel your current mandate or contact{" "}
                                                    <a href="mailto:support@mergemoney.com" className="text-decoration-none">
                                                        support
                                                    </a>.
                                                </small>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`btn ${
                                                isYearly ? "btn-primary" : "btn-outline-primary"
                                            } py-2 fw-medium w-100 shadow-sm`}
                                            onClick={() => handleSubscribe(plan.id)}
                                            disabled={subscribingPlan !== null || verifying}
                                        >
                                            {subscribingPlan === plan.id ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Opening Checkout...
                                                </>
                                            ) : (
                                                `Subscribe to ${plan.name}`
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ManageSubscription;
