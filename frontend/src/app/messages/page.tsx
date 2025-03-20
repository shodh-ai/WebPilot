"use client";
import { useState, useEffect, FormEvent } from "react";
import NavigationMenuBar from "@/components/nav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/api/getMessages";
import { getUsers } from "@/api/getUsers";
import { sendMessage } from "@/api/sendMessage";
import { subscribeToMessages } from "@/api/getMessagesLive";
import { getUserIdFromToken } from "@/utils/jwt";

export default function MessagePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);

  useEffect(() => {
    const decodedUserId = getUserIdFromToken();
    if (!decodedUserId) {
      console.error("User not authenticated");
      setLoading(false);
      return;
    }
    setUserId(decodedUserId);

    async function fetchInitialData() {
      try {
        const [users, msgs] = await Promise.all([getUsers(), getMessages()]);
        setAllUsers(users);
        setMessages(msgs.messages);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const derivedFromMessages = Array.from(
      new Set(messages.map((msg) => (msg.sender === userId ? msg.reciver : msg.sender)))
    );
    setChatParticipants((prev) => Array.from(new Set([...prev, ...derivedFromMessages])));
  }, [messages, userId]);

  useEffect(() => {
    if (selectedChat && userId) {
      const filtered = messages.filter(
        (msg) =>
          (msg.sender === selectedChat && msg.reciver === userId) ||
          (msg.reciver === selectedChat && msg.sender === userId)
      );
      setChatMessages(filtered);
    } else {
      setChatMessages([]);
    }
  }, [selectedChat, messages, userId]);

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!selectedChat || newMessage.trim() === "") return;
  
    try {
      const result = await sendMessage(selectedChat, newMessage);
      if (result?.messageData) {
        setMessages((prev) => [
          ...prev,
          {
            id: result.messageUserData.id,
            sender: userId,
            reciver: selectedChat,
            created_at: new Date().toISOString(),
            message: result.messageData,
          },
        ]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message", err);
    }
  }
  
  useEffect(() => {
    if (!userId) return;
  
    const eventSource = subscribeToMessages((newMessageData) => {
      console.log("New message received:", newMessageData); // Log all details of the new message
      setMessages((prev) => [...prev, newMessageData]);
    });
  
    return () => eventSource.close();
  }, [userId]);
  

  if (!userId) return <div className="p-4">Authenticating...</div>;

  const userIdToEmail = Object.fromEntries(allUsers.map((user) => [user.user_id, user.mail]));

  const filteredUsers = allUsers.filter((u) =>
    u.mail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleUserSelect(userId: string) {
    if (!chatParticipants.includes(userId)) setChatParticipants([...chatParticipants, userId]);
    setSelectedChat(userId);
  }

  return (
    <>
      <NavigationMenuBar />
      <div className="flex h-screen w-screen p-4">
        <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="mt-2">
              {filteredUsers.map((user) => (
                <Card
                  key={user.user_id}
                  onClick={() => handleUserSelect(user.user_id)}
                  className="p-2 my-2 cursor-pointer hover:bg-gray-100"
                >
                  {user.mail}
                </Card>
              ))}
            </div>
          )}
          <h2 className="text-xl font-bold my-4">Chats</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            chatParticipants.map((participant) => (
              <Card
                key={participant}
                onClick={() => setSelectedChat(participant)}
                className={`p-4 mb-2 cursor-pointer ${selectedChat === participant ? "bg-blue-100" : ""}`}
              >
                {userIdToEmail[participant] || participant}
              </Card>
            ))
          )}
        </div>

        <div className="w-2/3 p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Chat</h2>
          <div className="flex-1 overflow-y-auto mb-4">
            {selectedChat && chatMessages.length
              ? chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-2 ${msg.sender === userId ? "text-right" : "text-left"}`}
                  >
                    <p
                      className={`inline-block p-2 rounded-lg ${
                        msg.sender === userId ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.message.message}
                    </p>
                  </div>
                ))
              : "No messages."}
          </div>
          {selectedChat && (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <Button type="submit">Send</Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
