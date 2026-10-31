import axios from "axios";
import { useState, useEffect } from "react";
import { serverEndpoint } from "../config/appConfig";
import { useSelector } from "react-redux";

const calculateEqualSplit = (currentSplits, totalAmount) => {
    const parsedAmount = parseFloat(totalAmount);
    const includedCount = currentSplits.filter((s) => s.included).length;

    if (isNaN(parsedAmount) || parsedAmount <= 0 || includedCount === 0) {
        return currentSplits.map((split) => ({
            ...split,
            amountOwed: 0,
        }));
    }

    const totalCents = Math.round(parsedAmount * 100);
    const baseCents = Math.floor(totalCents / includedCount);
    const remainderCents = totalCents % includedCount;

    let includedIndex = 0;
    return currentSplits.map((split) => {
        if (!split.included) {
            return { ...split, amountOwed: 0 };
        }
        const shareCents = baseCents + (includedIndex < remainderCents ? 1 : 0);
        includedIndex++;
        return {
            ...split,
            amountOwed: Number((shareCents / 100).toFixed(2)),
        };
    });
};

function AddExpenseModal({ show, onHide, groupId, groupMembers, onSuccess }) {
    const user = useSelector((state) => state.userDetails);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        amount: "",
        paidBy: user?.email || "",
        splitType: "equal", // equal, custom
    });

    const [splits, setSplits] = useState(
        (groupMembers || []).map((member) => ({
            memberEmail: member,
            amountOwed: 0,
            included: true,
        }))
    );

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSplits((prevSplits) => {
            const currentEmails = groupMembers || [];
            const prevEmails = prevSplits.map((s) => s.memberEmail);
            const isSame =
                prevEmails.length === currentEmails.length &&
                currentEmails.every((m, i) => m === prevEmails[i]);

            if (isSame) {
                return prevSplits;
            }

            const existingMap = new Map(prevSplits.map((s) => [s.memberEmail, s]));
            const newSplits = currentEmails.map((member) => {
                const existing = existingMap.get(member);
                return existing
                    ? { ...existing }
                    : { memberEmail: member, amountOwed: 0, included: true };
            });

            if (formData.splitType === "equal") {
                return calculateEqualSplit(newSplits, formData.amount);
            }
            return newSplits;
        });
    }, [groupMembers, formData.splitType, formData.amount]);

    const validate = () => {
        let isValid = true;
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Expense title is required";
            isValid = false;
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = "Amount must be greater than 0";
            isValid = false;
        }

        const inclusionSplits = splits.filter((s) => s.included);
        if (inclusionSplits.length === 0) {
            newErrors.splits = "At least one member must be included in the split";
            isValid = false;
        }

        const totalSplit = inclusionSplits.reduce((sum, s) => sum + (s.amountOwed || 0), 0);
        if (Math.abs(totalSplit - parseFloat(formData.amount)) > 0.01) {
            newErrors.splits = `Split amounts (${totalSplit.toFixed(2)}) must equal total (${parseFloat(formData.amount).toFixed(2)})`;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        const nextFormData = { ...formData, [name]: value };
        setFormData(nextFormData);

        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }

        // If amount changes or splitType switches to equal, recalculate splits
        if (name === "amount" && nextFormData.splitType === "equal") {
            setSplits((prevSplits) => calculateEqualSplit(prevSplits, value));
        } else if (name === "splitType" && value === "equal") {
            setSplits((prevSplits) => calculateEqualSplit(prevSplits, nextFormData.amount));
        }
    };

    const handleSplitChange = (index, field, value) => {
        setSplits((prevSplits) => {
            const newSplits = [...prevSplits];
            newSplits[index] = { ...newSplits[index], [field]: value };

            if (field === "included" && formData.splitType === "equal") {
                return calculateEqualSplit(newSplits, formData.amount);
            }
            return newSplits;
        });

        if (errors.splits) {
            setErrors({ ...errors, splits: null });
        }
    };

    const handleEqualSplit = () => {
        setSplits((prevSplits) => calculateEqualSplit(prevSplits, formData.amount));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validate()) {
            setLoading(true);
            try {
                const splitsToSend = splits.filter((s) => s.included).map((s) => ({
                    memberEmail: s.memberEmail,
                    amountOwed: parseFloat(s.amountOwed),
                }));

                const response = await axios.post(
                    `${serverEndpoint}/expenses/create`,
                    {
                        groupId,
                        title: formData.title,
                        description: formData.description,
                        amount: parseFloat(formData.amount),
                        paidBy: formData.paidBy,
                        splits: splitsToSend,
                    },
                    { withCredentials: true }
                );

                onSuccess(response.data.expense);
                setFormData({
                    title: "",
                    description: "",
                    amount: "",
                    paidBy: user?.email || "",
                    splitType: "equal",
                });
                setSplits(
                    (groupMembers || []).map((member) => ({
                        memberEmail: member,
                        amountOwed: 0,
                        included: true,
                    }))
                );
                onHide();
            } catch (error) {
                console.error(error);
                setErrors({
                    message: error.response?.data?.message || "Error creating expense",
                });
            } finally {
                setLoading(false);
            }
        }
    };

    if (!show) return null;

    return (
        <div
            className="modal show d-block"
            tabIndex="-1"
            style={{
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
            }}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 rounded-4 shadow-lg p-3">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header border-0 pb-0">
                            <div className="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
                                <i className="bi bi-plus-circle-fill text-primary fs-4"></i>
                            </div>
                            <h5 className="fw-bold mb-0">Add Expense</h5>
                            <button
                                type="button"
                                className="btn-close shadow-none"
                                onClick={onHide}
                                disabled={loading}
                            ></button>
                        </div>

                        <div className="modal-body py-4">
                            {errors.message && (
                                <div className="alert alert-danger py-2 small border-0 mb-3">
                                    {errors.message}
                                </div>
                            )}

                            {/* Title */}
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-secondary text-uppercase mb-2">
                                    Expense Title
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Dinner, Movie tickets"
                                    className={`form-control form-control-lg bg-light border-0 fs-6 ${
                                        errors.title ? "is-invalid" : ""
                                    }`}
                                    name="title"
                                    value={formData.title}
                                    onChange={onChange}
                                    disabled={loading}
                                />
                                {errors.title && (
                                    <div className="invalid-feedback ps-1">{errors.title}</div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-secondary text-uppercase mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Add details about this expense..."
                                    className="form-control form-control-lg bg-light border-0 fs-6"
                                    name="description"
                                    value={formData.description}
                                    onChange={onChange}
                                    disabled={loading}
                                />
                            </div>

                            {/* Amount */}
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary text-uppercase mb-2">
                                            Total Amount
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light border-0">₹</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                step="0.01"
                                                className={`form-control form-control-lg bg-light border-0 fs-6 ${
                                                    errors.amount ? "is-invalid" : ""
                                                }`}
                                                name="amount"
                                                value={formData.amount}
                                                onChange={onChange}
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.amount && (
                                            <div className="invalid-feedback ps-1 d-block">
                                                {errors.amount}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payer */}
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-secondary text-uppercase mb-2">
                                            Paid By
                                        </label>
                                        <select
                                            className="form-select form-select-lg bg-light border-0 fs-6"
                                            name="paidBy"
                                            value={formData.paidBy}
                                            onChange={onChange}
                                            disabled={loading}
                                        >
                                            {groupMembers.map((member) => (
                                                <option key={member} value={member}>
                                                    {member}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Split Type */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="small fw-bold text-secondary text-uppercase m-0">
                                        Split Type
                                    </label>
                                    {formData.splitType === "equal" && formData.amount && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={handleEqualSplit}
                                            disabled={loading}
                                        >
                                            Auto Split
                                        </button>
                                    )}
                                </div>
                                <div className="btn-group w-100" role="group">
                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name="splitType"
                                        id="splitEqual"
                                        value="equal"
                                        checked={formData.splitType === "equal"}
                                        onChange={onChange}
                                        disabled={loading}
                                    />
                                    <label className="btn btn-outline-primary" htmlFor="splitEqual">
                                        Equal Split
                                    </label>

                                    <input
                                        type="radio"
                                        className="btn-check"
                                        name="splitType"
                                        id="splitCustom"
                                        value="custom"
                                        checked={formData.splitType === "custom"}
                                        onChange={onChange}
                                        disabled={loading}
                                    />
                                    <label className="btn btn-outline-primary" htmlFor="splitCustom">
                                        Custom Split
                                    </label>
                                </div>
                            </div>

                            {/* Members Split */}
                            <div className="mb-3">
                                <label className="small fw-bold text-secondary text-uppercase d-block mb-3">
                                    Split Among Members
                                </label>
                                {errors.splits && (
                                    <div className="alert alert-warning py-2 small border-0 mb-3">
                                        {errors.splits}
                                    </div>
                                )}
                                <div className="bg-light p-3 rounded-3">
                                    {splits.map((split, index) => (
                                        <div key={index} className="mb-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`member-${index}`}
                                                    checked={split.included}
                                                    onChange={(e) =>
                                                        handleSplitChange(index, "included", e.target.checked)
                                                    }
                                                    disabled={loading}
                                                />
                                                <label
                                                    className="form-label m-0 flex-grow-1"
                                                    htmlFor={`member-${index}`}
                                                >
                                                    {split.memberEmail}
                                                </label>
                                                {split.included && (
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        className="form-control form-control-sm"
                                                        style={{ width: "100px" }}
                                                        value={split.amountOwed || ""}
                                                        onChange={(e) =>
                                                            handleSplitChange(
                                                                index,
                                                                "amountOwed",
                                                                parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                        disabled={loading}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer border-0 pt-0">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onHide}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>
                                        Adding...
                                    </>
                                ) : (
                                    "Add Expense"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddExpenseModal;