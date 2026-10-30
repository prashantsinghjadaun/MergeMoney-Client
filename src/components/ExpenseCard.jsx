import axios from "axios";
import { useState } from "react";
import { serverEndpoint } from "../config/appConfig";

function ExpenseCard({ expense, onDelete }) {
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this expense?")) {
            setLoading(true);
            try {
                await axios.delete(
                    `${serverEndpoint}/expenses/${expense._id}`,
                    { withCredentials: true }
                );
                onDelete(expense._id);
            } catch (error) {
                console.error(error);
                alert("Error deleting expense");
            } finally {
                setLoading(false);
            }
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="card border-0 shadow-sm mb-3 hover-shadow transition">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1">
                        <h6 className="card-title fw-bold mb-1">{expense.title}</h6>
                        <p className="text-muted small mb-0">
                            Paid by <strong>{expense.paidBy}</strong> on{" "}
                            {formatDate(expense.createdAt)}
                        </p>
                    </div>
                    <div className="text-end">
                        <p className="text-primary fw-bold mb-0">₹{expense.amount.toFixed(2)}</p>
                        <small className="text-muted">{expense.currency}</small>
                    </div>
                </div>

                {expense.description && (
                    <p className="text-muted small mb-3">{expense.description}</p>
                )}

                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    {showDetails ? "Hide" : "View"} Split Details
                </button>

                <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={handleDelete}
                    disabled={loading}
                >
                    {loading ? "Deleting..." : "Delete"}
                </button>

                {showDetails && (
                    <div className="mt-3 p-3 bg-light rounded-3">
                        <h6 className="fw-bold mb-2">Split Details:</h6>
                        <div className="list-group list-group-flush">
                            {expense.splits.map((split, index) => (
                                <div key={index} className="d-flex justify-content-between py-2">
                                    <span>{split.memberEmail}</span>
                                    <strong>₹{split.amountOwed.toFixed(2)}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExpenseCard;