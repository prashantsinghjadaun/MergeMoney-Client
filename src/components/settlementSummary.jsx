import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { serverEndpoint } from "../config/appConfig";
import { useSelector } from "react-redux";
import { Modal, Button, Form } from "react-bootstrap";
import QRCode from "qrcode";

function SettlementSummary({ groupId, group, onGroupSettle }) {
    const user = useSelector((state) => state.userDetails);
    const [settlement, setSettlement] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settling, setSettling] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // 'payment-create', 'utr-submit', or paymentId
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Modal state for UPI payment initiation & UTR submission
    const [showPayModal, setShowPayModal] = useState(false);
    const [activePayment, setActivePayment] = useState(null);
    const [utrInput, setUtrInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState(null);

    // Generate local QR code entirely in browser (no external service calls)
    useEffect(() => {
        let isMounted = true;
        if (activePayment?.upiLink) {
            QRCode.toDataURL(activePayment.upiLink, {
                width: 180,
                margin: 2,
                color: {
                    dark: "#000000",
                    light: "#ffffff"
                }
            })
                .then((url) => {
                    if (isMounted) setQrDataUrl(url);
                })
                .catch((err) => {
                    console.error("Local QR generation error:", err);
                    if (isMounted) setQrDataUrl(null);
                });
        } else {
            setQrDataUrl(null);
        }
        return () => {
            isMounted = false;
        };
    }, [activePayment?.upiLink]);

    // Modal state for payment rejection
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectPaymentId, setRejectPaymentId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    // Fetch settlements and payments
    const fetchSettlement = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${serverEndpoint}/expenses/settlement/${groupId}`,
                { withCredentials: true }
            );
            setSettlement(response.data.settlement);
            setError(null);
        } catch (err) {
            console.error("Error fetching settlement details:", err);
            setError("Failed to load settlement details.");
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const fetchPayments = useCallback(async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/expenses/settlement-payment/group/${groupId}`,
                { withCredentials: true }
            );
            setPayments(response.data.payments || []);
        } catch (err) {
            console.error("Error fetching settlement payments:", err);
        }
    }, [groupId]);

    useEffect(() => {
        if (groupId) {
            fetchSettlement();
            fetchPayments();
        }
    }, [groupId, fetchSettlement, fetchPayments]);

    // Admin settles entire group
    const handleSettleGroup = async () => {
        if (
            window.confirm(
                "Are you sure you want to settle this group? This will mark all debts as paid."
            )
        ) {
            setSettling(true);
            try {
                const response = await axios.post(
                    `${serverEndpoint}/expenses/settle/${groupId}`,
                    {},
                    { withCredentials: true }
                );
                onGroupSettle(response.data.group);
                setSettlement({ balances: [], settlements: [] });
                setSuccessMsg("Group marked as settled successfully.");
            } catch (err) {
                console.error("Error settling group:", err);
                setError("Error settling group: " + (err.response?.data?.message || err.message));
            } finally {
                setSettling(false);
            }
        }
    };

    // 1. Initiate UPI payment for a suggested settlement
    const handleInitiatePayment = async (txn) => {
        setError(null);
        setSuccessMsg(null);
        setActionLoading(`create-${txn.to}`);

        try {
            const response = await axios.post(
                `${serverEndpoint}/expenses/settlement-payment/create`,
                {
                    groupId,
                    payeeEmail: txn.to,
                    amount: txn.amount
                },
                { withCredentials: true }
            );

            const { payment, upiLink } = response.data;
            setActivePayment({ ...payment, upiLink });
            setUtrInput("");
            setShowPayModal(true);

            // On mobile devices, trigger native UPI app intent
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile && upiLink) {
                window.location.href = upiLink;
            }

            // Refresh payment history to reflect 'pending' record
            fetchPayments();
        } catch (err) {
            console.error("Error initiating UPI payment:", err);
            setError(err.response?.data?.message || "Failed to initiate UPI payment request.");
        } finally {
            setActionLoading(null);
        }
    };

    // 2. Payer submits transaction reference (UTR)
    const handleSubmitUtr = async (e) => {
        e.preventDefault();
        if (!activePayment?._id) return;

        if (!utrInput || utrInput.trim().length < 6) {
            setError("Please enter a valid UPI transaction reference (UTR) of at least 6 characters.");
            return;
        }

        setActionLoading("submit-utr");
        setError(null);

        try {
            const response = await axios.post(
                `${serverEndpoint}/expenses/settlement-payment/${activePayment._id}/submit`,
                { upiTransactionRef: utrInput.trim() },
                { withCredentials: true }
            );

            setSuccessMsg(response.data.message || "UTR submitted successfully! Awaiting recipient confirmation.");
            setShowPayModal(false);
            setActivePayment(null);
            setUtrInput("");

            // Refresh both settlement balances and payment list
            fetchSettlement();
            fetchPayments();
        } catch (err) {
            console.error("Error submitting UTR:", err);
            setError(err.response?.data?.message || "Failed to submit UPI transaction reference.");
        } finally {
            setActionLoading(null);
        }
    };

    // 3. Recipient confirms received payment
    const handleConfirmPayment = async (paymentId) => {
        setActionLoading(`confirm-${paymentId}`);
        setError(null);
        setSuccessMsg(null);

        try {
            const response = await axios.post(
                `${serverEndpoint}/expenses/settlement-payment/${paymentId}/confirm`,
                {},
                { withCredentials: true }
            );

            setSuccessMsg(response.data.message || "Payment confirmed! Net balances updated.");
            fetchSettlement();
            fetchPayments();
        } catch (err) {
            console.error("Error confirming payment:", err);
            setError(err.response?.data?.message || "Failed to confirm payment.");
        } finally {
            setActionLoading(null);
        }
    };

    // 4. Open rejection dialog
    const handleOpenReject = (paymentId) => {
        setRejectPaymentId(paymentId);
        setRejectReason("");
        setShowRejectModal(true);
    };

    // 5. Recipient rejects payment
    const handleRejectPayment = async (e) => {
        e.preventDefault();
        if (!rejectPaymentId) return;

        setActionLoading(`reject-${rejectPaymentId}`);
        setError(null);
        setSuccessMsg(null);

        try {
            const response = await axios.post(
                `${serverEndpoint}/expenses/settlement-payment/${rejectPaymentId}/reject`,
                { reason: rejectReason.trim() },
                { withCredentials: true }
            );

            setSuccessMsg(response.data.message || "Payment rejected.");
            setShowRejectModal(false);
            setRejectPaymentId(null);
            setRejectReason("");
            fetchSettlement();
            fetchPayments();
        } catch (err) {
            console.error("Error rejecting payment:", err);
            setError(err.response?.data?.message || "Failed to reject payment.");
        } finally {
            setActionLoading(null);
        }
    };

    // Copy UPI link to clipboard
    const handleCopyUpiLink = () => {
        if (activePayment?.upiLink) {
            navigator.clipboard.writeText(activePayment.upiLink).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    const isGroupAdmin = user?.email === group?.adminEmail;
    const isGroupSettled = group?.paymentStatus?.isPaid;

    if (isGroupSettled) {
        return (
            <div className="alert alert-success border-2 border-success d-flex align-items-center gap-3 mb-4">
                <i className="bi bi-check-circle-fill fs-5"></i>
                <div>
                    <h6 className="mb-1">Group Already Settled</h6>
                    <p className="text-muted small mb-0">
                        This group was settled on{" "}
                        {new Date(group.paymentStatus.date).toLocaleDateString("en-IN")}. All
                        members now owe zero amount.
                    </p>
                </div>
            </div>
        );
    }

    const balances = settlement?.balances || [];
    const settlements = settlement?.settlements || [];
    const hasData = balances.length > 0 || settlements.length > 0;

    // Filter payments awaiting confirmation for the logged-in recipient
    const paymentsAwaitingMyConfirmation = payments.filter(
        (p) => p.status === "submitted" && p.payeeEmail === user?.email
    );

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Settlement Summary</h5>
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                            fetchSettlement();
                            fetchPayments();
                        }}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Updating...
                            </>
                        ) : settlement === null ? "Calculate" : "Refresh"}
                    </button>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
                    </div>
                )}

                {successMsg && (
                    <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {successMsg}
                        <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)} aria-label="Close"></button>
                    </div>
                )}

                {/* Recipient Action Banner: Awaiting My Confirmation */}
                {paymentsAwaitingMyConfirmation.length > 0 && (
                    <div className="alert alert-warning border-warning shadow-sm mb-4">
                        <h6 className="fw-bold text-dark mb-2">
                            <i className="bi bi-bell-fill text-warning me-2"></i>
                            Action Required: Payments Awaiting Your Confirmation ({paymentsAwaitingMyConfirmation.length})
                        </h6>
                        <div className="d-flex flex-column gap-2 mt-2">
                            {paymentsAwaitingMyConfirmation.map((p) => (
                                <div
                                    key={p._id}
                                    className="d-flex flex-wrap align-items-center justify-content-between bg-white rounded-3 p-2 border"
                                >
                                    <div>
                                        <span className="fw-bold text-primary">₹{p.amount.toFixed(2)}</span>
                                        <span className="text-muted ms-2 small">from</span>
                                        <span className="fw-medium ms-1 small">{p.payerEmail}</span>
                                        {p.upiTransactionRef && (
                                            <div className="text-muted small">
                                                UTR: <code className="text-dark">{p.upiTransactionRef}</code>
                                            </div>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2 mt-2 mt-sm-0">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-success"
                                            onClick={() => handleConfirmPayment(p._id)}
                                            disabled={actionLoading === `confirm-${p._id}`}
                                        >
                                            {actionLoading === `confirm-${p._id}` ? (
                                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                            ) : (
                                                <i className="bi bi-check-lg me-1"></i>
                                            )}
                                            Confirm Receipt
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleOpenReject(p._id)}
                                            disabled={actionLoading === `reject-${p._id}`}
                                        >
                                            <i className="bi bi-x-lg me-1"></i>
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {settlement === null ? (
                    <div className="text-center py-4">
                        <p className="text-muted mb-0">Click &quot;Calculate&quot; to view settlement details</p>
                    </div>
                ) : !hasData ? (
                    <div className="alert alert-info mb-0">
                        <p className="mb-0">All group debts are fully settled! No outstanding balances.</p>
                    </div>
                ) : (
                    <>
                        {/* Member Balances Table */}
                        <div className="table-responsive mb-4">
                            <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                                Member Balances
                            </h6>
                            <table className="table table-sm mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Member</th>
                                        <th className="text-end">Amount</th>
                                        <th className="text-end">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {balances.map((item, index) => (
                                        <tr key={index}>
                                            <td className="fw-medium">{item.member}</td>
                                            <td className="text-end">₹{item.amount.toFixed(2)}</td>
                                            <td className="text-end">
                                                {item.amount < 0.01 ? (
                                                    <span className="badge bg-secondary">Settled</span>
                                                ) : item.owes ? (
                                                    <span className="badge bg-danger">Owes</span>
                                                ) : (
                                                    <span className="badge bg-success">Gets Back</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Suggested Payments Cards */}
                        {settlements.length > 0 && (
                            <div className="mb-4">
                                <h6 className="fw-bold text-secondary small text-uppercase mb-3">
                                    Suggested Payments
                                </h6>
                                <div className="d-flex flex-column gap-3">
                                    {settlements.map((txn, index) => {
                                        const isCurrentUserPayer = user?.email === txn.from;
                                        const isPayeeUpiAvailable = txn.payeeHasUpi;

                                        return (
                                            <div
                                                key={index}
                                                className="d-flex flex-column flex-md-row align-items-md-center justify-content-between bg-light rounded-3 p-3 border"
                                            >
                                                {/* Left: Transfer info & UPI Badge */}
                                                <div className="mb-2 mb-md-0">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <span className={`fw-bold ${isCurrentUserPayer ? "text-primary" : "text-dark"}`}>
                                                            {txn.from} {isCurrentUserPayer && "(You)"}
                                                        </span>
                                                        <i className="bi bi-arrow-right text-primary"></i>
                                                        <span className="fw-bold text-dark">
                                                            {txn.payeeName ? txn.payeeName : txn.to}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 small">
                                                        {isPayeeUpiAvailable ? (
                                                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                                                                <i className="bi bi-qr-code me-1"></i>
                                                                UPI: {txn.payeeUpiId}
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                                Recipient has not set up UPI ID
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right: Amount & Action Button */}
                                                <div className="d-flex align-items-center gap-3">
                                                    <span className="fs-5 fw-bold text-primary">
                                                        ₹{txn.amount.toFixed(2)}
                                                    </span>

                                                    {isCurrentUserPayer ? (
                                                        isPayeeUpiAvailable ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary btn-sm px-3"
                                                                onClick={() => handleInitiatePayment(txn)}
                                                                disabled={actionLoading === `create-${txn.to}`}
                                                            >
                                                                {actionLoading === `create-${txn.to}` ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                                                        Preparing...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <i className="bi bi-phone me-1"></i>
                                                                        Pay via UPI
                                                                    </>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary btn-sm px-3"
                                                                disabled
                                                                title="Payee must add their UPI ID in Profile"
                                                            >
                                                                UPI Unavailable
                                                            </button>
                                                        )
                                                    ) : (
                                                        <span className="badge bg-light text-secondary border">
                                                            Pending Transfer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Settlement Payments History */}
                {payments.length > 0 && (
                    <div className="mt-4 pt-3 border-top">
                        <h6 className="fw-bold text-secondary small text-uppercase mb-3">
                            Settlement Transactions History ({payments.length})
                        </h6>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover align-middle mb-0">
                                <thead className="table-light small">
                                    <tr>
                                        <th>Date</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>UTR / Ref</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="small">
                                    {payments.map((p) => {
                                        const isPayee = user?.email === p.payeeEmail;
                                        const isPayer = user?.email === p.payerEmail;

                                        return (
                                            <tr key={p._id}>
                                                <td className="text-muted">
                                                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </td>
                                                <td className="fw-medium">{p.payerEmail} {isPayer && "(You)"}</td>
                                                <td className="fw-medium">{p.payeeEmail} {isPayee && "(You)"}</td>
                                                <td className="fw-bold text-primary">₹{p.amount.toFixed(2)}</td>
                                                <td>
                                                    {p.status === "confirmed" && (
                                                        <span className="badge bg-success">
                                                            <i className="bi bi-check-circle-fill me-1"></i>
                                                            Confirmed
                                                        </span>
                                                    )}
                                                    {p.status === "submitted" && (
                                                        <span className="badge bg-info text-dark">
                                                            <i className="bi bi-hourglass-split me-1"></i>
                                                            Submitted (Verifying)
                                                        </span>
                                                    )}
                                                    {p.status === "pending" && (
                                                        <span className="badge bg-warning text-dark">
                                                            Pending UTR
                                                        </span>
                                                    )}
                                                    {p.status === "rejected" && (
                                                        <span className="badge bg-danger" title={p.rejectionReason}>
                                                            <i className="bi bi-x-circle me-1"></i>
                                                            Rejected
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {p.upiTransactionRef ? (
                                                        <code className="text-dark">{p.upiTransactionRef}</code>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {/* If user is the recipient and payment is submitted, show confirm/reject actions */}
                                                    {isPayee && p.status === "submitted" && (
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-success btn-sm py-0 px-2"
                                                                onClick={() => handleConfirmPayment(p._id)}
                                                                disabled={actionLoading === `confirm-${p._id}`}
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm py-0 px-2"
                                                                onClick={() => handleOpenReject(p._id)}
                                                                disabled={actionLoading === `reject-${p._id}`}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* If user is payer and status is pending, allow opening modal to submit UTR */}
                                                    {isPayer && p.status === "pending" && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-primary btn-sm py-0 px-2"
                                                            onClick={() => {
                                                                setActivePayment(p);
                                                                setUtrInput("");
                                                                setShowPayModal(true);
                                                            }}
                                                        >
                                                            Submit UTR
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Admin Settle Group (Fallback All-in-one) */}
                {isGroupAdmin && hasData && (
                    <div className="mt-4 pt-3 border-top">
                        <button
                            type="button"
                            className="btn btn-outline-success w-100"
                            onClick={handleSettleGroup}
                            disabled={settling}
                        >
                            {settling ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Settling...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle me-2"></i>
                                    Settle All Group Balances (Admin)
                                </>
                            )}
                        </button>
                        <small className="text-muted d-block mt-2">
                            Admin tool: Directly marks all balances as settled.
                        </small>
                    </div>
                )}
            </div>

            {/* UPI Payment & UTR Submission Modal */}
            <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h5 fw-bold">
                        <i className="bi bi-qr-code-scan me-2 text-primary"></i>
                        UPI Settlement Payment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {activePayment && (
                        <div>
                            {/* Summary Box */}
                            <div className="bg-light p-3 rounded-3 mb-3 text-center">
                                <span className="text-muted small d-block">Amount to Pay</span>
                                <h3 className="fw-bold text-primary mb-1">₹{activePayment.amount.toFixed(2)}</h3>
                                <span className="small text-muted">
                                    Recipient: <strong className="text-dark">{activePayment.payeeEmail}</strong>
                                </span>
                            </div>

                            {/* QR Code and App Actions */}
                            {activePayment.upiLink && (
                                <div className="text-center mb-4">
                                    <div className="d-inline-block p-2 bg-white rounded-3 border shadow-sm mb-3">
                                        {qrDataUrl ? (
                                            <img
                                                src={qrDataUrl}
                                                alt="Scan to Pay with UPI"
                                                className="img-fluid"
                                                style={{ width: "180px", height: "180px" }}
                                            />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center" style={{ width: "180px", height: "180px" }}>
                                                <span className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Generating QR...</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="small text-muted mb-2">
                                        Scan with Google Pay, PhonePe, Paytm, or BHIM
                                    </p>
                                    <div className="d-flex gap-2 justify-content-center">
                                        <a
                                            href={activePayment.upiLink}
                                            className="btn btn-outline-primary btn-sm"
                                        >
                                            <i className="bi bi-box-arrow-up-right me-1"></i>
                                            Open in UPI App
                                        </a>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={handleCopyUpiLink}
                                        >
                                            <i className="bi bi-clipboard me-1"></i>
                                            {copied ? "Copied!" : "Copy Link"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step-2: UTR Reference Submission Form */}
                            <div className="border-top pt-3">
                                <div className="alert alert-info py-2 px-3 small mb-3">
                                    <i className="bi bi-info-circle me-1"></i>
                                    <strong>Important:</strong> After completing the transfer in your UPI app, enter the 12-digit UPI Reference Number / UTR below to submit your payment for verification.
                                </div>
                                <Form onSubmit={handleSubmitUtr}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">
                                            UPI Transaction Reference (UTR / Txn ID)
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="e.g. 123456789012"
                                            value={utrInput}
                                            onChange={(e) => setUtrInput(e.target.value)}
                                            required
                                            minLength={6}
                                            maxLength={50}
                                        />
                                        <Form.Text className="text-muted">
                                            Found in your payment app&apos;s receipt or transaction details.
                                        </Form.Text>
                                    </Form.Group>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-100"
                                        disabled={actionLoading === "submit-utr" || !utrInput.trim()}
                                    >
                                        {actionLoading === "submit-utr" ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Submitting UTR...
                                            </>
                                        ) : (
                                            "Submit Transaction Reference"
                                        )}
                                    </Button>
                                </Form>
                            </div>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            {/* Payment Rejection Dialog */}
            <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h5 fw-bold text-danger">
                        <i className="bi bi-x-circle me-2"></i>
                        Reject Payment
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleRejectPayment}>
                    <Modal.Body>
                        <p className="small text-muted mb-3">
                            Are you sure you want to reject this payment? The balance will remain outstanding.
                        </p>
                        <Form.Group>
                            <Form.Label className="small fw-bold">
                                Reason for Rejection (Optional)
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="e.g. Payment not credited in bank account"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" size="sm" onClick={() => setShowRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            size="sm"
                            disabled={actionLoading?.startsWith("reject-")}
                        >
                            {actionLoading?.startsWith("reject-") ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                    Rejecting...
                                </>
                            ) : (
                                "Confirm Rejection"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}

export default SettlementSummary;
