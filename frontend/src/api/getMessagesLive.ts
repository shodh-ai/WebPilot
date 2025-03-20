export const subscribeToMessages = (
  onMessage: (data: any) => void,
  onError?: (error: any) => void
) => {
  const token = localStorage.getItem("token");

  const eventSource = new EventSource(
    `http://localhost:8000/api/messages/get_live?token=${token}`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received data:", data);
    onMessage(data);
  };

  eventSource.onerror = (error) => {
    console.error("SSE connection error:", error);
    if (onError) onError(error);
    eventSource.close();
  };

  return eventSource;
};
