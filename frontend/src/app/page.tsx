"use client";

import NavigationMenuBar from "@/components/nav";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      <NavigationMenuBar />
      <div className="flex flex-col overflow-x-hidden overflow-y-auto h-min-screen w-screen p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              year: "2024",
              title: "The complete guide to OKRs",
              description: "How to make objectives and key results work for your company."
            },
            {
              year: "2024",
              title: "Enhancement in Customer Engagement",
              description: "With the aim of optimizing customer interactions and boosting brand loyalty, the team at Preline leveraged Mailchimp's powerful tools and expertise to deliver exceptional results."
            },
            {
              year: "2023",
              title: "How Google Assistant now helps you record stories for kids",
              description: "Google is constantly updating its consumer AI, Google Assistant, with new features."
            }
          ].map((item, index) => (
            <Card key={index} className="p-6 border border-gray-200 rounded-xl dark:border-neutral-700">
              <p className="mb-2 text-sm text-gray-500 dark:text-neutral-500">{item.year}</p>
              <h5 className="font-medium text-sm text-gray-800 dark:text-neutral-200">{item.title}</h5>
              <p className="mt-1 text-sm text-gray-500 dark:text-neutral-500">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
