import React, { useState } from "react";
import { Calendar, CheckCheck, Home, LineChart, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Fab, Action } from "react-tiny-fab";
import "react-tiny-fab/dist/styles.css";

const BottomNavigation = () => {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const isActive = (path: string) => {
    return location === path;
  };
  const navigationItems = [
    { icon: Home, label: "Resumo", url: "/dashboard" },
    { icon: Calendar, label: "Agenda", url: "/calendar" },
    { icon: LineChart, label: "Insights", url: "/insights" },
    { icon: CheckCheck, label: "Tarefas", url: "/tasks" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100 shadow-md pb-6">
      <Fab
        icon={<PlusIcon />}
        alwaysShowTitle={true}
        mainButtonStyles={{
          background: "#ee5d60",
          color: "#ffffff",
        }}
        style={{
          margin: 0,

          right: "auto",
          left: "50%",
          bottom: "60px",
          transform: "translateX(-50%)",
        }}
      >
        <Action
          text="Adicionar Evento"
          style={{
            background: "#ff797b",
            color: "#ffffff",
          }}
          onClick={() => navigate("/calendar?newEvent=true")}
        >
          <Calendar />
        </Action>
        <Action
          text="Adicionar Tarefa"
          style={{
            background: "#ff797b",
            color: "#ffffff",
          }}
          onClick={() => navigate("/tasks?newTask=true")}
        >
          <CheckCheck />
        </Action>
      </Fab>
      <div className="container max-w-md mx-auto">
        <div className="flex justify-around py-1">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              className={cn(
                "flex flex-col items-center py-2 px-3 w-full relative",
                isActive(item.url) &&
                  "after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-8 after:h-1 after:bg-love after:rounded-t-full"
              )}
              onClick={() => navigate(item.url)}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive(item.url) ? "text-love" : "text-gray-500"
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  isActive(item.url) ? "text-love font-medium" : "text-gray-500"
                )}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;
