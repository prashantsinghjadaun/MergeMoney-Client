import axios from "axios";
import { useState } from "react";
import { serverEndpoint } from "../config/appConfig";
import { useSelector } from "react-redux";

function SettlementSummary({ groupId, group, onGroupSettle }) {
    const user = useSelector((state) => state.userDetails);
    const [settlement, setSettlement] = useState(null);
    const [loading, setLoading] = useState(false);
    const [settling, setSettling] = useState(false);

    const fetchSettlement = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${serverEndpoint}/expenses/settlement/${groupId}`,
                { withCredentials: true }
            );
            setSettlement(response.data.settlement);
        } catch (error) {
            console.error(error);
            alert("Error fetching settlement details");
        } finally {
            setLoading(false);
        }
    };

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
            } catch (error) {
                console.error(error);
                alert("Error settling group: " + (error.response?.data?.message || error.message));
            } finally {
                setSettling(false);
            }
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

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Settlement Summary</h5>
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={fetchSettlement}
                        disabled={loading}
                    >
                        {loading ? "Updating..." : settlement === null ? "Calculate" : "Refresh"}
                    </button>
                </div>

                {settlement === null ? (
                    <div className="text-center py-4">
                        <p className="text-muted mb-0">Click &quot;Calculate&quot; to view settlement details</p>
                    </div>
                ) : !hasData ? (
                    <div className="alert alert-info mb-0">
                        <p className="mb-0">No expenses yet. Settlement details will appear here.</p>
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

                        {/* Settlement Suggestions */}
                        {settlements.length > 0 && (
                            <div>
                                <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                                    Suggested Payments
                                </h6>
                                <div className="d-flex flex-column gap-2">
                                    {settlements.map((txn, index) => (
                                        <div
                                            key={index}
                                            className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2"
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-medium">{txn.from}</span>
                                                <i className="bi bi-arrow-right text-primary"></i>
                                                <span className="fw-medium">{txn.to}</span>
                                            </div>
                                            <span className="fw-bold text-primary">
                                                ₹{txn.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {isGroupAdmin && hasData && (
                    <div className="mt-4 pt-3 border-top">
                        <button
                            type="button"
                            className="btn btn-success w-100"
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
                                    Settle Group
                                </>
                            )}
                        </button>
                        <small className="text-muted d-block mt-2">
                            Only group admin can settle. This marks all debts as paid.
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SettlementSummary;
