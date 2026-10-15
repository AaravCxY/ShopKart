import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Home() {
    const [customer, setCustomer] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const getLoggedInCustomer = async () => {
            try {
                const response = await api.get("/customers/me");
                setCustomer(response.data);
            } catch (error) {
                navigate("/login");
            }
        };

        getLoggedInCustomer();
    }, [navigate]);

    if (customer === null) {
        return (
            <div>
                <Navbar />
                <div className="form-box">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <div className="form-box">
                <h2>Welcome, {customer.fullName}</h2>
                <p>Name: {customer.fullName}</p>
                <p>Email: {customer.email}</p>
                <p>Phone: {customer.phone}</p>
                <p>
                    <Link to="/products">Go to Products</Link>
                </p>
            </div>
        </div>
    );
}

export default Home;
