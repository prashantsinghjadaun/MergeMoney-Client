import React from "react";
import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="bg-white">
            <header className="py-5 mb-5 bg-light border-bottom">
                <div className="container py-5">
                    <div className="row align-items-center">
                        <div className="col-lg-6 text-center text-lg-start">
                            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-2 mb-3 fw-bold">
                                All-in-One Finance Manager
                            </span>
                            <h1 className="display-3 fw-bold text-dark mb-4">
                                Stop tracking twice. <br />
                                <span className="text-primary">
                                    Start Merging.
                                </span>
                            </h1>
                            <p className="lead text-muted mb-5">
                                The first app that bridges the gap between
                                splitting bills with friends and tracking your
                                personal wealth. One transaction, zero
                                double-entry.
                            </p>
                            <div className="d-flex justify-content-center justify-content-lg-start gap-3">
                                <Link
                                    to="/signup"
                                    className="btn btn-primary btn-lg px-5 rounded-pill shadow fw-bold"
                                >
                                    Get Started
                                </Link>
                                <Link
                                    to="/login"
                                    className="btn btn-outline-secondary btn-lg px-5 rounded-pill"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-6 d-none d-lg-block">
                            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                                <div className="bg-dark p-3 d-flex gap-2">
                                    <div
                                        className="rounded-circle bg-danger"
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                        }}
                                    ></div>
                                    <div
                                        className="rounded-circle bg-warning"
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                        }}
                                    ></div>
                                    <div
                                        className="rounded-circle bg-success"
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                        }}
                                    ></div>
                                </div>
                                <div className="card-body p-4 bg-white text-center">
                                    <h6 className="text-muted text-uppercase small">
                                        Net Worth This Month
                                    </h6>
                                    <h2 className="fw-bold">₹75,400.00</h2>
                                    <div className="mt-3 p-3 bg-light rounded-3 text-start border-start border-primary border-4">
                                        <div className="d-flex justify-content-between fw-bold">
                                            <span>Goa Trip Split</span>
                                            <span className="text-danger">
                                                -₹2,500
                                            </span>
                                        </div>
                                        <small className="text-muted">
                                            Auto-synced to Personal Spending
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <section id="features" className="container py-5">
                <div className="text-center mb-5">
                    <h2 className="fw-bold h1">Why MergeMoney is Different</h2>
                    <p
                        className="text-muted mx-auto"
                        style={{ maxWidth: "600px" }}
                    >
                        We believe your share of a group expense IS a personal
                        expense. We handle the math so you don't have to.
                    </p>
                </div>

                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="card h-100 border-0 shadow-sm p-4 rounded-4 hover-shadow transition">
                            <div
                                className="bg-primary bg-opacity-10 text-primary p-3 rounded-3 d-inline-block mb-3"
                                style={{ width: "fit-content" }}
                            >
                                <i className="bi bi-people-fill fs-3"></i>
                            </div>
                            <h4 className="fw-bold">Smart Bill Splitting</h4>
                            <p className="text-muted">
                                Create groups for trips, rent, or dinners.
                                Invite friends and split costs with one click.
                            </p>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card h-100 border-0 shadow-sm p-4 rounded-4">
                            <div
                                className="bg-success bg-opacity-10 text-success p-3 rounded-3 d-inline-block mb-3"
                                style={{ width: "fit-content" }}
                            >
                                <i className="bi bi-person-check-fill fs-3"></i>
                            </div>
                            <h4 className="fw-bold">Personal Spending</h4>
                            <p className="text-muted">
                                Your share of group expenses automatically flows
                                into your personal ledger. No more manual entry.
                            </p>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card h-100 border-0 shadow-sm p-4 rounded-4">
                            <div
                                className="bg-info bg-opacity-10 text-info p-3 rounded-3 d-inline-block mb-3"
                                style={{ width: "fit-content" }}
                            >
                                <i className="bi bi-graph-up-arrow fs-3"></i>
                            </div>
                            <h4 className="fw-bold">Wealth & Investments</h4>
                            <p className="text-muted">
                                Track Mutual Funds, Stocks, and Crypto alongside
                                your daily coffee spend. See the big picture.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-dark text-white py-5 mt-5">
                <div className="container py-5">
                    <div className="row align-items-center">
                        <div className="col-lg-6">
                            <h2 className="display-5 fw-bold mb-4 text-primary">
                                Master Your Wealth.
                            </h2>
                            <p className="fs-5 opacity-75 mb-4">
                                Categorize your life three levels deep (Grocery{" "}
                                {">"} Food {">"} Essentials). Track your income
                                sources and watch your "Excess Money" grow month
                                over month.
                            </p>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <i className="bi bi-check2-circle text-primary me-2"></i>{" "}
                                    Real-time Dashboard Statistics
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-check2-circle text-primary me-2"></i>{" "}
                                    Custom Date Range Reporting
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-check2-circle text-primary me-2"></i>{" "}
                                    Secure Replica-Set Transactions
                                </li>
                            </ul>
                        </div>
                        <div className="col-lg-6 text-center">
                            <div className="p-5 bg-white bg-opacity-10 rounded-5 border border-white border-opacity-10">
                                <h1 className="display-1 fw-bold">100%</h1>
                                <p className="text-uppercase fw-bold letter-spacing-1">
                                    Unified Data
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container py-5 my-5 text-center">
                <div className="py-5 bg-primary rounded-5 text-white shadow-lg">
                    <h2 className="display-5 fw-bold mb-3">
                        Ready to simplify your finances?
                    </h2>
                    <p className="lead mb-4 opacity-75">
                        Join thousands of users managing their wealth smarter
                        with MergeMoney.
                    </p>
                    <Link
                        to="/signup"
                        className="btn btn-light btn-lg px-5 rounded-pill fw-bold shadow"
                    >
                        Create Your Account
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Home;