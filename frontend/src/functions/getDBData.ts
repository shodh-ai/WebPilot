import axios from "axios";

export const getDBData = async (tables: string[], columns: string[][]) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post("http://localhost:8000/api/agent/getDBData", {
            "user_id": token,
            "tables": tables,
            "columns": columns
        });
        return response.data;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};