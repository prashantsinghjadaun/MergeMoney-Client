import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import { useEffect, useState } from "react";
import GroupCard from "../components/GroupCard";
import CreateGroupModal from "../components/CreateGroupModal";
import { usePermission } from "../rbac/userPermissions";

function Groups() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);
    const permissions = usePermission();

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(3);
    const [sortBy, setSortBy] = useState('newest');

    const fetchGroups = async (page = 1) => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/groups/my-groups?page=${page}&limit=${limit}&sortBy=${sortBy}`,
                { withCredentials: true }
            );

            setGroups(response?.data?.groups);
            setTotalPages(response?.data?.pagination?.totalPages);
            setCurrentPage(response?.data?.pagination?.currentPage);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGroupUpdateSuccess = (data) => {
        // Default to 1st page whenever there is an update to the group,
        // or new group is added. This logic can be customized as per the
        // user experience you want to provide. You can choose to keep the user
        // on the same page or go to last page. No right or wrong answers here!
        fetchGroups(1);
    };

    // Triggers call to fetchGroups when the component is rendered for the very
    // first time and also whenever value of the currentPage/sortBy state variable
    // changes.
    useEffect(() => {
        fetchGroups(currentPage);
    }, [currentPage, sortBy]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (loading) {
        return (
            <div
                className="container p-5 d-flex flex-column align-items-center justify-content-center"
                style={{ minHeight: "60vh" }}
            >
                <div
                    className="spinner-grow text-primary"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted fw-medium">
                    Syncing your circles...
                </p>
            </div>
        );
    }

    return (
        <div className="container py-5 px-4 px-md-5">
            <div className="row align-items-center mb-5">
                <div className="col-md-8 text-center text-md-start mb-3 mb-md-0">
                    <h2 className="fw-bold text-dark display-6">
                        Manage <span className="text-primary">Groups</span>
                    </h2>
                    <p className="text-muted mb-0">
                        View balances, invite friends, and settle shared
                        expenses in one click.
                    </p>
                </div>

                {permissions.canCreateGroups && (
                    <div className="col-md-4 text-center text-md-end">
                        <div className="d-flex align-items-center w-sm-auto">
                            <label>Sort:</label>
                            <select className="form-select form-select-sm rounded-pill me-2"
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setCurrentPage(1); // Reset to 1st page to show newly sorted results first.
                                }}
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>


                            <button
                                className="btn btn-primary btn-sm rounded-pill fw-bold shadow-sm"
                                onClick={() => setShow(true)}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <hr className="mb-5 opacity-10" />

            {groups.length === 0 && (
                <div className="text-center py-5 bg-light rounded-5 border border-dashed border-primary border-opacity-25 shadow-inner">
                    <div className="bg-white rounded-circle d-inline-flex p-4 mb-4 shadow-sm">
                        <i
                            className="bi bi-people text-primary"
                            style={{ fontSize: "3rem" }}
                        ></i>
                    </div>
                    <h4 className="fw-bold">No Groups Found</h4>
                    <p
                        className="text-muted mx-auto mb-4"
                        style={{ maxWidth: "400px" }}
                    >
                        You haven't joined any groups yet. Create a group to
                        start splitting bills with your friends or roommates!
                    </p>
                    <button
                        className="btn btn-outline-primary rounded-pill px-4"
                        onClick={() => setShow(true)}
                    >
                        Get Started
                    </button>
                </div>
            )}

            {groups.length > 0 && (
                <div className="row g-4 animate__animated animate__fadeIn">
                    {groups.map((group) => (
                        <div className="col-md-6 col-lg-4" key={group._id}>
                            <GroupCard
                                group={group}
                                onUpdate={handleGroupUpdateSuccess}
                            />
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <nav className="mt-5 d-flex justify-content-center">
                    <ul className="pagination shadow-sm">
                        {/* Previous page button link */}
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link"
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                &laquo;
                            </button>
                        </li>

                        {/* ...Array(totalPages) generates array of size totalPages with empty (undefined) values */}
                        {[...Array(totalPages)].map((num, index) => (
                            <li key={index+1} className={`page-item ${currentPage === (index+1) ? "active" : ""}`}>
                                <button className="page-link" onClick={() => handlePageChange(index+1)}>
                                    {index+1}
                                </button>
                            </li>
                        ))}

                        {/* Next page button link */}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link"
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                &raquo;
                            </button>
                        </li>
                    </ul>
                </nav>
            )}

            <CreateGroupModal
                show={show}
                onHide={() => setShow(false)}
                onSuccess={handleGroupUpdateSuccess}
            />
        </div>
    );
}

export default Groups;