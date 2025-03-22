import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { client } from "@/api/openai";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function Pilot() {
  const [history, setHistory] = useState<string[]>([
    "Hello this is Rox. You personal helper for the website. How can I help you today?",
  ]);
  const [isListening, setListening] = useState<boolean>(false);
  const [isActive, setActive] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      try {
        setInputValue("");
        setLoading(true);
        setHistory((prevHistory) =>
          [...prevHistory, inputValue].slice(-5),
        );
        const response = await client.responses.create({
          model: "gpt-3.5-turbo",
          instructions: "You are a helpful assistant agent on the website",
          input: [{ role: "user", content: inputValue }],
        });
        console.log(response.output_text);
        setLoading(false);
        setHistory((prevHistory) =>
          [...prevHistory, response.output_text].slice(-5),
        );
      } catch (error) {
        console.error("Error fetching response:", error);
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [history]);

  return isActive ? (
    <div className="absolute top-0 right-0 max-h-[50dvh] max-w-[50dvw] p-4 flex flex-col overflow-hidden h-max w-max justify-center items-end">
      <motion.div
        className="w-[3rem] h-[3rem] rounded-full bg-blue-500 shadow-md mb-4 flex-shrink-0 flex-grow-0"
        animate={{ scale: isListening ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        ref={messagesEndRef}
        className="flex flex-col overflow-x-hidden overflow-y-auto"
        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
      >
        <style jsx>{`
          ::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {history.map((message, index) => (
          <div
            key={index}
            className={`flex ${index % 2 === 0 ? "justify-end text-gray-500" : "justify-start text-gray-600"} w-[50dvh] bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40`}
          >
            <p>{message}</p>
          </div>
        ))}
        {loading && <div
          className={`w-[50dvh] bg-white bg-opacity-20 backdrop-blur-lg shadow-md rounded-2xl p-3 text-md font-semibold mb-4 border border-white border-opacity-40`}
        >
          <Skeleton count={2} />
        </div>}
      </div>
      <form onSubmit={handleSubmit} className="w-full mt-4">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Type your message here..."
          value={inputValue}
          onChange={handleInputChange}
        />
      </form>
    </div>
  ) : null;
}
