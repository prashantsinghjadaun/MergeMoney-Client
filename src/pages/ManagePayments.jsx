import { useEffect, useState } from "react";
import axios from 'axios';
import { serverEndpoint } from '../config/appConfig';

const CREDITS_PACK = [
    {
        price: 1,
        credits: 10
    },
    {
        price: 4,
        credits: 50
    },
    {
        price: 7,
        credits: 100
    },
];

function ManagePayments() {
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [userProfile, setUserProfile] = useState(null);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const getUserProfile = async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/profile/get-user-info`,
                { withCredentials: true }
            );
            setUserProfile(response.data.user);
        } catch (error) {
            console.log(error);
            setErrors({ message: 'Unable to fetch user profile' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUserProfile();
    }, []);

    const paymentResponseHandler = async (credits, payment) => {
        try {
            const response = await axios.post(
                `${serverEndpoint}/payments/verify-order`,
                {
                    razorpay_order_id: payment.razorpay_order_id,
                    razorpay_payment_id: payment.razorpay_payment_id,
                    razorpay_signature: payment.razorpay_signature,
                    credits: credits
                },
                { withCredentials: true }
            );
            setUserProfile(response.data.user);
            setMessage(`Payment success, ${credits} credits are credited to your account`);
            setErrors({});
        } catch (error) {
            console.log(error);
            setErrors({ message: error.response?.data?.message || 'Unable to process payment request, contact customer service' });
        }
    };

    const handlePayment = async (credits) => {
        try {
            setLoading(true);
            setErrors({});

            // Check if Razorpay is loaded
            if (!window.Razorpay) {
                console.error('Razorpay script not loaded');
                setErrors({ message: 'Razorpay is not loaded. Please refresh the page.' });
                setLoading(false);
                return;
            }

            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            console.log('Razorpay Key:', razorpayKey ? 'Set (length: ' + razorpayKey.length + ')' : 'NOT SET');

            if (!razorpayKey) {
                console.error('VITE_RAZORPAY_KEY_ID environment variable is not set');
                setErrors({ message: 'Razorpay configuration is missing. Please add VITE_RAZORPAY_KEY_ID to .env file.' });
                setLoading(false);
                return;
            }

            const orderResponse = await axios.post(
                `${serverEndpoint}/payments/create-order`,
                { credits: credits },
                { withCredentials: true }
            );

            const order = orderResponse.data.order;
            console.log('Order created:', order);

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency,
                name: 'MergeMoney',
                description: `Purchase ${credits} credits`,
                order_id: order.id,
                theme: {
                    color: '#3399cc'
                },
                handler: (response) => {
                    console.log('Payment handler response:', response);
                    paymentResponseHandler(credits, response);
                },
                prefill: {
                    email: userProfile?.email || '',
                    name: userProfile?.name || ''
                },
                modal: {
                    ondismiss: () => {
                        console.log('Payment modal dismissed');
                        setLoading(false);
                    }
                }
            };

            console.log('Opening Razorpay with options:', options);
            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Payment error:', error);
            setErrors({ message: error.response?.data?.message || error.message || 'Unable to process the payment request' });
            setLoading(false);
        }
    };

    if (loading && !userProfile) {
        return (
            <div className="container p-5 text-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container p-5">
            {errors.message && (
                <div className="alert alert-danger" role="alert">
                    {errors.message}
                </div>
            )}

            {message && (
                <div className="alert alert-success" role="alert">
                    {message}
                </div>
            )}

            <h2 className="mb-4">Manage Payments</h2>
            <p className="mb-4"><strong>Current Credit Balance: </strong><span className="badge bg-primary fs-6">{userProfile?.credits || 0}</span></p>

            <div className="row g-3">
                {CREDITS_PACK.map((credit, index) => (
                    <div key={index} className="col-md-4">
                        <div className="card border shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title">{credit.credits} Credits</h5>
                                <p className="card-text">Purchase {credit.credits} credits for INR {credit.price}</p>
                                <button
                                    className="btn btn-primary w-100"
                                    onClick={() => { handlePayment(credit.credits); }}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Buy Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ManagePayments;