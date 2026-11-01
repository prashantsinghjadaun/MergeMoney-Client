import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import AddExpenseModal from "../components/addExpenseModal";
import ExpenseCard from "../components/ExpenseCard";
import SettlementSummary from "../components/settlementSummary";

function GroupExpenses() {
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch group details
    const fetchGroupDetails = async () => {
        try {
            if (!groupId) {
                console.warn('[GroupExpenses] No groupId provided! Cannot fetch group.');
                setError("No group ID provided");
                return;
            }

            const url = `${serverEndpoint}/groups/${groupId}`;
            console.log('[GroupExpenses] Fetching group from URL:', url);
            console.log('[GroupExpenses] Using serverEndpoint:', serverEndpoint);
            console.log('[GroupExpenses] groupId:', groupId);

            const response = await axios.get(
                url,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('[GroupExpenses] Group fetch successful. Status:', response.status);
            console.log('[GroupExpenses] Group data:', response.data);
            setGroup(response.data);
            setError(null);
        } catch (err) {
            console.error('[GroupExpenses] Error details:', err);
            if (err.response) {
                console.error('[GroupExpenses] Response status:', err.response.status);
                console.error('[GroupExpenses] Response data:', err.response.data);
            } else if (err.request) {
                console.error('[GroupExpenses] No response received. Request:', err.request);
            } else {
                console.error('[GroupExpenses] Error message:', err.message);
            }
            setError("Unable to fetch group details - see console for details");
            // Don't stop loading - we can still show expenses
        }
    };

    // Fetch expenses for the group
    const fetchExpenses = async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/expenses/group/${groupId}`,
                { withCredentials: true }
            );
            setExpenses(response.data.expenses || []);
        } catch (err) {
            console.log(err);
            setError("Unable to fetch expenses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchGroupDetails();
            fetchExpenses();
        }
    }, [groupId]);

    const handleExpenseAdded = (newExpense) => {
        setExpenses((prevExpenses) => [newExpense, ...prevExpenses]);
        setShowAddExpense(false);
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleExpenseDeleted = (expenseId) => {
        setExpenses((prevExpenses) => prevExpenses.filter(expense => expense._id !== expenseId));
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleGroupSettle = (updatedGroup) => {
        setGroup(updatedGroup);
    };

    if (loading) {
        return (
            <div className="container p-5 text-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/dashboard">Groups</Link>
                    </li>
                    <li className="breadcrumb-item active">
                        {group?.name || "Expense Details"}
                    </li>
                </ol>
            </nav>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {group && (
                <div className="bg-white p-5 rounded-4 shadow-sm border mb-4">
                    <h2 className="fw-bold mb-3">{group.name}</h2>
                    <p className="text-muted">{group.description}</p>

                    <div className="mb-3">
                        <h5>Members:</h5>
                        <div className="d-flex flex-wrap gap-2">
                            {group.membersEmail && group.membersEmail.map((email, idx) => (
                                <span key={idx} className="badge bg-primary">
                                    {email}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddExpense(true)}
                    >
                        + Add Expense
                    </button>
                </div>
            )}

            {group && (
                <SettlementSummary
                    groupId={groupId}
                    group={group}
                    onGroupSettle={handleGroupSettle}
                    refreshTrigger={refreshTrigger}
                />
            )}

            <div className="bg-white p-5 rounded-4 shadow-sm border">
                <h3 className="fw-bold mb-4">Transactions</h3>

                {expenses.length === 0 ? (
                    <p className="text-muted text-center py-5">
                        No expenses yet. Add one to get started!
                    </p>
                ) : (
                    <div className="row gap-3">
                        {expenses.map((expense) => (
                            <ExpenseCard
                                key={expense._id}
                                expense={expense}
                                onDelete={handleExpenseDeleted}
                            />
                        ))}
                    </div>
                )}
            </div>

            <AddExpenseModal
                show={showAddExpense}
                onHide={() => setShowAddExpense(false)}
                groupId={groupId}
                groupMembers={group?.membersEmail || []}
                onSuccess={handleExpenseAdded}
            />
        </div>
    );
}

export default GroupExpenses;