import axios from "axios";

export const getDBData = async ({ tables, columns }: { tables: string[], columns: string[][] }) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post("http://localhost:8000/api/agent/getDBData", {
      "tables": tables,
      "columns": columns
    },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
