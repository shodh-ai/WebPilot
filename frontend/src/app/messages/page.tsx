"use client";
import { useState, useEffect, FormEvent } from "react";
import NavigationMenuBar from "@/components/nav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/api/getMessages";
import { getUsers } from "@/api/getUsers";
import { sendMessage } from "@/api/sendMessage";
import axios from "axios";

const CONSTANT_USER_ID = "719e481e-76fb-4938-8f06-0de7ae9f4e70";

export default function MessagePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Store all users here
  const [allUsers, setAllUsers] = useState<any[]>([]);
  // Track search input
  const [searchTerm, setSearchTerm] = useState("");
  // Track the final list of chat participants shown in the left pane
  const [chatParticipants, setChatParticipants] = useState<string[]>([]);

  // ----------------------------------------------------------------------------
  // 1) Fetch all users + messages on page load
  // ----------------------------------------------------------------------------
  useEffect(() => {
    async function fetchAllUsers() {
      try {
        const users = await getUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    }

    async function fetchMessages() {
      try {
        // This is your existing function that fetches messages.
        // In your code, it's currently calling the same endpoint that returns users,
        // but presumably you'll change that to your actual "get messages" endpoint.
        const msgs = await getMessages();
        setMessages(msgs);
      } catch (err) {
        console.error("Error fetching messages", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllUsers();
    fetchMessages();
  }, []);

  // ----------------------------------------------------------------------------
  // 2) Build a map from user_id -> mail for easy display
  // ----------------------------------------------------------------------------
  const userIdToEmail: Record<string, string> = {};
  allUsers.forEach((user) => {
    userIdToEmail[user.user_id] = user.mail;
  });

  // ----------------------------------------------------------------------------
  // 3) Maintain the chat participants
  //    - We derive participants from the messages themselves (like you did),
  //      but also let the user add new ones from search
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // Derive participants from existing messages
    const derivedFromMessages = Array.from(
      new Set(
        messages.map((msg) =>
          msg.sender === CONSTANT_USER_ID ? msg.reciver : msg.sender
        )
      )
    );
    // Combine derived participants with any we manually added
    const combined = Array.from(new Set([...chatParticipants, ...derivedFromMessages]));
    setChatParticipants(combined);
  }, [messages]);

  // ----------------------------------------------------------------------------
  // 4) Update the chat message list whenever selectedChat changes
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (selectedChat) {
      const filtered = messages.filter(
        (msg) =>
          (msg.sender === selectedChat && msg.reciver === CONSTANT_USER_ID) ||
          (msg.reciver === selectedChat && msg.sender === CONSTANT_USER_ID)
      );
      setChatMessages(filtered);
    } else {
      setChatMessages([]);
    }
  }, [selectedChat, messages]);

  // ----------------------------------------------------------------------------
  // 5) Sending a new message
  // ----------------------------------------------------------------------------
  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!selectedChat || newMessage.trim() === "") return;

    try {
      const result = await sendMessage(newMessage);
      if (result && result.messageData) {
        // Add the new message to local state
        setMessages((prev) => [
          ...prev,
          {
            id: result.messageUserData.id,
            sender: CONSTANT_USER_ID,
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

  // ----------------------------------------------------------------------------
  // 6) Search functionality
  // ----------------------------------------------------------------------------
  // Filter the full user list by the search term
  const filteredUsers = allUsers.filter((u) =>
    u.mail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // When a user from the search results is selected, add them to the chat list
  function handleUserSelect(userId: string) {
    if (!chatParticipants.includes(userId)) {
      setChatParticipants([...chatParticipants, userId]);
    }
    setSelectedChat(userId);
  }

  // ----------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------
  return (
    <>
      <NavigationMenuBar />
      <div className="flex h-screen w-screen p-4">
        {/* Left Pane */}
        <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
          {/* Search Bar */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Filtered user results */}
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
          </div>

          {/* Chat Participant List */}
          <h2 className="text-xl font-bold mb-4">Chats</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            chatParticipants.map((participant) => (
              <Card
                key={participant}
                onClick={() => setSelectedChat(participant)}
                className={`p-4 mb-2 cursor-pointer ${
                  selectedChat === participant ? "bg-blue-100" : ""
                }`}
              >
                <p className="font-medium">
                  {userIdToEmail[participant] || participant}
                </p>
              </Card>
            ))
          )}
        </div>

        {/* Right Pane */}
        <div className="w-2/3 p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Chat</h2>
          <div className="flex-1 overflow-y-auto mb-4">
            {selectedChat ? (
              chatMessages.length > 0 ? (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 ${
                      msg.sender === CONSTANT_USER_ID
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <p
                      className={`inline-block p-2 rounded-lg ${
                        msg.sender === CONSTANT_USER_ID
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.message.message}
                    </p>
                  </div>
                ))
              ) : (
                <p>No messages in this chat.</p>
              )
            ) : (
              <p>Select a chat from the left pane or search above.</p>
            )}
          </div>

          {selectedChat && (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">Send</Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
