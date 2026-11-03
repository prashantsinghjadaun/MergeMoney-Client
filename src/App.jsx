import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AppLayout from "./components/AppLayout";
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Logout from "./pages/Logout";
import UserLayout from "./components/UserLayout";
import axios from "axios";
import { serverEndpoint } from "./config/appConfig";
import { useSelector, useDispatch } from "react-redux";
import { SET_USER } from "./redux/user/action";
import Groups from "./pages/Groups";
import GroupExpenses from "./pages/GroupExpense";
import ManageUsers from "./pages/ManageUsers";
import ProtectedRoute from "./rbac/ProtectedRoute";
import UnauthorizedAccess from "./components/errors/UnauthorizedAccess";
import ManagePayments from "./pages/ManagePayments";
import ManageSubscription from "./pages/ManageSubscription";

function App() {
    const dispatch = useDispatch();
    // Value of userDetails represents whether the user
    // is logged in or not.

    // useSelector takes in 1 function as input. Redux calls the function that
    // you pass to useSelector with all the values its storing/managing.
    // We need to take out userDetails since we're interested in userDetails object.
    const userDetails = useSelector((state) => state.userDetails);
    const [loading, setLoading] = useState(true);

    const isUserLoggedIn = async () => {
        try {
            const response = await axios.post(
                `${serverEndpoint}/auth/is-user-logged-in`,
                {},
                { withCredentials: true }
            );

            if (response.data.user) {
                dispatch({
                    type: SET_USER,
                    payload: response.data.user,
                });
            }
        } catch (error) {
            // Network error or 5xx — user stays logged out
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        isUserLoggedIn();
    }, []);

    if (loading) {
        return (
            <div className="container text-center">
                <h3>Loading...</h3>
            </div>
        );
    }

    return (
        <Routes>
            <Route
                path="/"
                element={
                    userDetails ? (
                        <Navigate to="/dashboard" />
                    ) : (
                        <AppLayout>
                            <Home />
                        </AppLayout>
                    )
                }
            />
            <Route
                path="/login"
                element={
                    userDetails ? (
                        <Navigate to="/dashboard" />
                    ) : (
                        <AppLayout>
                            <Login />
                        </AppLayout>
                    )
                }
            />
            <Route
                path="/signup"
                element={
                    userDetails ? (
                        <Navigate to="/dashboard" />
                    ) : (
                        <AppLayout>
                            <Signup />
                        </AppLayout>
                    )
                }
            />

            <Route
                path="/dashboard"
                element={
                    userDetails ? (
                        <UserLayout>
                            <Groups />
                        </UserLayout>
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/groups/:groupId"
                element={
                    userDetails ? (
                        <UserLayout>
                            <GroupExpenses />
                        </UserLayout>
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/manage-users"
                element={
                    userDetails ? (
                        <ProtectedRoute roles={["admin"]}>
                            <UserLayout>
                                <ManageUsers />
                            </UserLayout>
                        </ProtectedRoute>
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/logout"
                element={userDetails ? <Logout /> : <Navigate to="/login" />}
            />

            <Route
                path="/unauthorized-access"
                element={
                    userDetails ? (
                        <UserLayout>
                            <UnauthorizedAccess />
                        </UserLayout>
                    ) : (
                        <AppLayout>
                            <UnauthorizedAccess />
                        </AppLayout>
                    )
                }
            />

            <Route
                path="/manage-payments"
                element={
                    userDetails ? (
                        <ProtectedRoute roles={["admin"]}>
                            <UserLayout>
                                <ManagePayments />
                            </UserLayout>
                        </ProtectedRoute>
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/manage-subscription"
                element={
                    userDetails ? (
                        <ProtectedRoute roles={["admin"]}>
                            <UserLayout>
                                <ManageSubscription />
                            </UserLayout>
                        </ProtectedRoute>
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />
        </Routes>
    );
}

export default App;