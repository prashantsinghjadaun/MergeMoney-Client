import { useNavigate } from "react-router-dom";

function UnauthorizedAccess() {
    const navigate = useNavigate();

    return (
        <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="text-center">
                <h1 className="display-1 fw-bold text-danger">403</h1>
                <h2 className="mb-4">Access Denied</h2>
                <p className="mb-4 text-muted">
                    Sorry, you don't have permission to access this page.
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate(-1)}
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}

export default UnauthorizedAccess;