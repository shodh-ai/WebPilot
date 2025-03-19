"use client";

import { useState } from "react";
import NavigationMenuBar from "@/components/nav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { z } from "zod";
import { toast } from "sonner";
import { addTicket } from "@/api/sendTicket";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  department: z.string().min(1, { message: "Department is required" }),
  details: z.string().min(10, { message: "Details must be at least 10 characters" }),
});

type FormData = {
  email: string;
  department: string;
  details: string;
};

type Errors = Partial<Record<keyof FormData, string[]>>;

export default function Ticket() {
  const [formData, setFormData] = useState<FormData>({ email: "", department: "", details: "" });
  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors = result.error.flatten().fieldErrors as Errors;
      setErrors(formattedErrors);
    } else {
      setErrors({});
      setFormData({ email: "", department: "", details: "" });
      console.log("Form submitted", formData);
      addTicket(formData.email, formData.department, formData.details)
        .then((success) => {
          if (success) {
            toast.success("Your inquiry has been sent successfully");
          } else {
            toast.error("Failed to send your inquiry. Please try again later");
          }
        })
        .catch((error) => {
          console.error("Error sending inquiry:", error);
          toast.error("Failed to send your inquiry. Please try again later");
        }
        );
    }
  };

  return (
    <>
      <NavigationMenuBar />
      <div className="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
        <div className="max-w-2xl lg:max-w-5xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white">Contact us</h1>
            <p className="mt-1 text-gray-600 dark:text-neutral-400">We would love to talk about how we can help you.</p>
          </div>
          <div className="mt-12 grid items-center lg:grid-cols-2 gap-6 lg:gap-16">
            <Card className="flex flex-col border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 dark:border-neutral-700">
              <h2 className="mb-8 text-xl font-semibold text-gray-800 dark:text-neutral-200">Fill in the form</h2>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  <div>
                    <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email[0]}</p>}
                  </div>
                  <div>
                    <Input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} />
                    {errors.department && <p className="text-red-500 text-sm">{errors.department[0]}</p>}
                  </div>
                  <div>
                    <Textarea rows={4} name="details" placeholder="Details" value={formData.details} onChange={handleChange} />
                    {errors.details && <p className="text-red-500 text-sm">{errors.details[0]}</p>}
                  </div>
                </div>
                <div className="mt-4 grid">
                  <Button type="submit" className="w-full">Send inquiry</Button>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-500 dark:text-neutral-500">We will get back to you in 1-2 business days.</p>
                </div>
              </form>
            </Card>
            <div className="divide-y divide-gray-200 dark:divide-neutral-800">
              <div className="flex gap-x-7 py-6">
                <svg className="shrink-0 size-6 mt-1.5 text-gray-800 dark:text-neutral-200" xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx={12} cy={12} r={10} />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <div className="grow">
                  <h3 className="font-semibold text-gray-800 dark:text-neutral-200">Knowledgebase</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">We are here to help with any questions or code.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
