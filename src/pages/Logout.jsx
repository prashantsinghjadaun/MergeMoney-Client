import axios from "axios";
import { useEffect } from "react";
import { serverEndpoint } from "../config/appConfig";
import { useDispatch } from "react-redux";
import { CLEAR_USER } from "../redux/user/action";
import { useNavigate } from "react-router-dom";

function Logout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                await axios.post(
                    `${serverEndpoint}/auth/logout`,
                    {},
                    { withCredentials: true }
                );
            } catch (error) {
                console.log("Logout error:", error);
            } finally {
                dispatch({
                    type: CLEAR_USER,
                });
                navigate("/login", { replace: true });
            }
        };

        handleLogout();
    }, [dispatch, navigate]);

    return (
        <div className="container text-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Logging out...</span>
            </div>
        </div>
    );
}

export default Logout;