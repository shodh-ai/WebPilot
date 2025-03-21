export const getMessages = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:8000/api/messages/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  return response.json();
};
