import axios from "axios";
import { useEffect, useState } from "react";
import { serverEndpoint } from "../config/appConfig";

const PLAN_IDS = {
    // Add more attributes as and when you need it.
    UNLIMITED_MONTHLY: {
        planName: 'Unlimited Monthly',
        price: 5,
        frequency: 'monthly'
    },

    UNLIMITED_YEARLY: {
        planName: 'Unlimited Yearly',
        price: 50,
        frequency: 'yearly'
    }
};

function ManageSubscription() {
    const [userProfile, setUserProfile] = useState(null);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);

    const getUserProfile = async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/profile/get-user-info`,
                { withCredentials: true }
            );

            setUserProfile(response.data.user);
        } catch (error) {
            console.log(error);
            setErrors({ message: 'Unable to fetch subscription data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUserProfile();
    }, []);

    const rzpResponseHandler = async (response) => {
        try {
            setLoading(true);

            const captureSubsResponse = await axios.post(
                `${serverEndpoint}/payments/capture-subscription`,
                { subscriptionId: response.razorpay_subscription_id },
                { withCredentials: true }
            );

            setUserProfile(captureSubsResponse.data.user);
        } catch (error) {
            console.log(error);
            setErrors({ message: 'Unable to capture subscription details, contact customer service' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planName) => {
        try {
            setLoading(true);

            const createSubscriptionResponse = await axios.post(
                `${serverEndpoint}/payments/create-subscription`,
                { plan_name: planName },
                { withCredentials: true }
            );

            const subscription = createSubscriptionResponse.data.subscription;
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                name: PLAN_IDS[planName],
                description: `Pay INR ${PLAN_IDS[planName].price} ${PLAN_IDS[planName].frequency}`,
                subscription_id: subscription.id,
                theme: { color: '#3399cc'},
                handler: (response) => { rzpResponseHandler(response); },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.log(error);
            setErrors({ message: 'Unable to process subscription request' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container p-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const notSubscribedStatus = [undefined, 'completed', 'cancelled'];
    const showSubscription = notSubscribedStatus.includes(userProfile?.subscription?.status);

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

            {showSubscription && (
                <>
                    {Object.keys(PLAN_IDS).map(key => (
                        <div className="col-auto border m-2 p-2" key={key}>
                            <h4>{PLAN_IDS[key].planName}</h4>
                            <p>Pay INR {PLAN_IDS[key].price} {PLAN_IDS[key].frequency}</p>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => { handleSubscribe(key); }}
                            >
                                Subscribe
                            </button>
                        </div>
                    ))}
                </>
            )}

            {!showSubscription && (
                <>
                    <div className="col-auto border m-2 p-2">
                        Plan ID: {userProfile.subscription.planId} <br/>
                        Subscription ID: {userProfile.subscription.subscriptionId} <br/>
                        Subscription Status: {userProfile.subscription.status}
                    </div>
                </>
            )}
        </div>
    );
}

export default ManageSubscription;