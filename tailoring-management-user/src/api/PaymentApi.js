import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export async function recordPayment(itemId, paymentAmount) {
    try {
        const response = await axios.post(`${BASE_URL}/orders/items/${itemId}/payment`, {
            paymentAmount: paymentAmount
        }, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Record payment error:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Error recording payment"
        };
    }
}

