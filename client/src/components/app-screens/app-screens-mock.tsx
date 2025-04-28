import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Componente que renderiza telas mockadas do aplicativo com animações GSAP
 */
const AppScreensMock = () => {
  // Referências para animação com GSAP
  const appScreensRef = useRef<HTMLDivElement>(null);
  const calendarScreenRef = useRef<HTMLDivElement>(null);
  const tasksScreenRef = useRef<HTMLDivElement>(null);
  const timelineScreenRef = useRef<HTMLDivElement>(null);

  // Animação com GSAP para as telas do aplicativo
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animação das telas do aplicativo quando entram na visualização
            if (appScreensRef.current) {
              gsap.fromTo(
                calendarScreenRef.current,
                { y: 50, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "power3.out",
                  delay: 0.2,
                },
              );

              gsap.fromTo(
                tasksScreenRef.current,
                { y: 70, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "power3.out",
                  delay: 0.5,
                },
              );

              gsap.fromTo(
                timelineScreenRef.current,
                { y: 90, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.8,
                  ease: "power3.out",
                  delay: 0.8,
                },
              );

              // Animação dos dados dentro das telas
              gsap.to(".calendar-event", {
                backgroundColor: "rgba(241, 90, 89, 0.15)",
                stagger: 0.1,
                duration: 0.4,
                delay: 1,
                repeat: 1,
                yoyo: true,
              });

              gsap.to(".task-item-check", {
                scale: 1.2,
                stagger: 0.15,
                duration: 0.3,
                delay: 1.2,
                repeat: 1,
                yoyo: true,
              });

              gsap.to(".notification-dot", {
                scale: 1.5,
                stagger: 0.1,
                duration: 0.4,
                delay: 1.5,
                repeat: 1,
                yoyo: true,
              });
            }

            // Desconectar o observer após acionar a animação
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }, // Aciona quando 30% do elemento está visível
    );

    if (appScreensRef.current) {
      observer.observe(appScreensRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={appScreensRef}
      className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
    >
      {/* Tela de Timeline */}
      <div
        ref={timelineScreenRef}
        className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden flex flex-col h-[550px]"
      >
        {/* Header aplicativo */}
        <div className="bg-primary p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/logo-white.png"
              alt="Nós Juntos"
              className="h-8 drop-shadow-sm"
            />
          </div>
          <div className="flex items-center">
            <div className="text-white ml-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-white ml-2">MM</div>
          </div>
        </div>

        {/* Header da página */}
        <div className="bg-primary/10 p-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-sm">28 de abril 2025</div>
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <span>2 eventos</span> •
                <span className="flex items-center">
                  <Heart size={14} className="fill-primary" /> 2 compartilhados
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded text-blue-600 bg-blue-100">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="6"
                    width="18"
                    height="15"
                    rx="2"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3 10H21"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 3L7 7"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 3L17 7"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button className="w-6 h-6 flex items-center justify-center rounded text-gray-600">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="#666"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navegação de visualização */}
        </div>
        <div className="flex border-b ">
          <div
            className="flex bg-gray-100 rounded-lg p-1 my-2 ml-2"
            style={{ fontSize: 11 }}
          >
            <button
              className="px-2 p-1 text-sm bg-primary text-white rounded-md"
              style={{ fontSize: 11 }}
            >
              {" "}
              Dia
            </button>
            <button className="px-2 p-1 text-sm" style={{ fontSize: 11 }}>
              Semana
            </button>
            <button className="px-2 p-1  text-sm " style={{ fontSize: 11 }}>
              Mês
            </button>
            <button
              className="px-2  text-sm flex items-center"
              style={{ fontSize: 11 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 10H21"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 14H21"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 18H21"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 6H21"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Timeline
            </button>
          </div>
          <div className="flex-grow"></div>
          <button className="px-3 py-1.5 text-sm text-primary">Hoje</button>
        </div>

        <div className="p-3 flex-grow overflow-auto">
          {/* Seção Manhã */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z"
                    stroke="#FBBF24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-sm font-medium">Manhã</div>
              <div className="text-xs text-gray-500 ml-2">6h - 12h</div>
            </div>

            {/* Evento 1 */}
            <div className="ml-8 pl-4 border-l-2 border-orange-300 relative notification-dot">
              <div className="absolute -left-[0.3rem] top-1 h-2 w-2 rounded-full bg-orange-300"></div>
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">9:00</div>
                <div className="text-sm">10:00</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg mb-3">
                <div className="flex items-center">
                  <div className="mr-2">
                    <span className="text-lg">♥️</span>
                  </div>
                  <div>
                    <div className="font-medium">Tempo com Mozão</div>
                    <div className="text-xs text-gray-500">Compartilhado</div>
                    <div
                      className="flex items-center text-gray-700"
                      style={{ fontSize: 10 }}
                    >
                      <span
                        className="material-icons mr-1"
                        style={{ fontSize: 10 }}
                      >
                        repeat
                      </span>
                      <div>Diariamente</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evento 2 */}
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">9:00</div>
                <div className="text-sm">11:00</div>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg">
                <div className="flex flex-col">
                  <div className="font-medium">
                    Ir ao cartório para assinar documentos
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <svg
                      className="inline-block mr-1"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
                        stroke="#666"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
                        stroke="#666"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Na rua
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Compartilhado
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção Tarde */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 12L17 7M17 12V7H12M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-sm font-medium">Tarde</div>
              <div className="text-xs text-gray-500 ml-2">12h - 18h</div>
            </div>

            <div className="ml-8 pl-4 border-l-2 border-blue-300 py-4">
              <div className="text-xs text-gray-500 italic text-center">
                Nenhum evento neste período
              </div>
            </div>
          </div>

          {/* Seção Noite */}
          <div>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21.0672 11.8568L20.4253 11.469L21.0672 11.8568ZM12.1432 2.93276L11.7553 2.29085V2.29085L12.1432 2.93276ZM21.25 12C21.25 17.1086 17.1086 21.25 12 21.25V22.75C17.9371 22.75 22.75 17.9371 22.75 12H21.25ZM12 21.25C6.89137 21.25 2.75 17.1086 2.75 12H1.25C1.25 17.9371 6.06294 22.75 12 22.75V21.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75V1.25C6.06294 1.25 1.25 6.06294 1.25 12H2.75ZM15.75 4.46023C15.75 2.48431 17.8429 1.31717 19.5243 2.29085L20.1662 1.075C17.7132 -0.358983 14.25 1.41855 14.25 4.46023H15.75ZM21.7092 4.47572C22.6828 6.15708 21.5157 8.25 19.5398 8.25V9.75C22.5814 9.75 24.359 6.28676 23.275 3.83375L21.7092 4.47572ZM19.5243 2.29085C20.5295 2.90211 21.098 3.97055 20.7557 5.0491C20.4134 6.12765 19.3397 6.75 18.2215 6.75V8.25C20.2603 8.25 22.2866 6.94975 22.9371 4.71315C23.5877 2.47655 22.5685 0.125092 20.1662 1.075L19.5243 2.29085ZM12 2.75C13.7117 2.75 15.3219 3.22447 16.6881 4.08269L17.4319 2.76217C15.8261 1.75652 13.9567 1.25 12 1.25V2.75ZM14.25 4.46023C14.25 5.54843 13.6277 6.62188 12.5491 6.9643C11.4706 7.30672 10.4021 6.73825 9.79085 5.73315L8.57501 6.37505C9.52041 7.97365 11.3415 9.25 13.4425 9.25C16.4039 9.25 17.75 6.58139 17.75 4.46023H14.25ZM23.275 3.83375L21.7092 4.47572L20.4253 11.469L18.8596 12.112L20.4253 11.469L21.0672 11.8568C22.151 13.4853 21.8174 15.5092 20.4449 16.8816L21.5056 17.9424C23.397 16.051 23.9939 13.1547 22.4168 10.8449L23.275 3.83375ZM12.5312 3.57467L12.1432 2.93276L11.7553 2.29085L12.5312 3.57467ZM9.79085 5.73315C9.17959 4.72805 9.63542 3.35675 10.6557 2.82196L9.93685 1.43157C8.07499 2.39974 7.11516 4.7765 8.57501 6.37505L9.79085 5.73315ZM12.1432 2.93276C11.6255 2.10207 10.5771 1.76497 9.93685 1.43157L12.1432 2.93276Z"
                    fill="#8B5CF6"
                  />
                </svg>
              </div>
              <div className="text-sm font-medium">Noite</div>
              <div className="text-xs text-gray-500 ml-2">18h - 00h</div>
            </div>

            <div className="ml-8 pl-4 border-l-2 border-purple-300 py-4">
              <div className="text-xs text-gray-500 italic text-center">
                Nenhum evento neste período
              </div>
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="border-t py-2 px-6 flex justify-between">
          <button className="flex flex-col items-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="6"
                width="18"
                height="15"
                rx="2"
                stroke="#E74C3C"
                strokeWidth="1.5"
              />
              <path
                d="M3 10H21"
                stroke="#E74C3C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M7 3L7 7"
                stroke="#E74C3C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M17 3L17 7"
                stroke="#E74C3C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] text-primary">Agenda</span>
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <button className="flex flex-col items-center">
            <span className="material-icons text-[22px]">task_alt</span>

            <span className="text-[10px] text-gray-600">Tarefas</span>
          </button>
        </div>
      </div>
      {/* Tela do Calendário */}
      <div
        ref={calendarScreenRef}
        className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden flex flex-col h-[550px]"
      >
        {/* Header aplicativo */}
        <div className="bg-primary p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/logo-white.png"
              alt="Nós Juntos"
              className="h-8 drop-shadow-sm"
            />
          </div>
          <div className="flex items-center">
            <div className="text-white ml-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-white ml-2">MM</div>
          </div>
        </div>

        {/* Header mês atual */}
        <div className="bg-primary/10 p-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-sm">Mês atual (abril 2025)</div>
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <span>7 eventos</span> •
                <span className="flex items-center">
                  <Heart size={14} className="fill-primary" /> 7 compartilhados
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-6 h-6 flex items-center justify-center rounded text-gray-600">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="#666"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded text-blue-600 bg-blue-100">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="6"
                    width="18"
                    height="15"
                    rx="2"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M3 10H21"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 3L7 7"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 3L17 7"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navegação de visualização */}
        </div>
        <div className="flex border-b ">
          <div
            className="flex bg-gray-100 rounded-lg p-1 my-2 ml-2"
            style={{ fontSize: 11 }}
          >
            <button className="px-2 p-1 text-sm" style={{ fontSize: 11 }}>
              {" "}
              Dia
            </button>
            <button className="px-2 p-1 text-sm" style={{ fontSize: 11 }}>
              Semana
            </button>
            <button
              className="px-2 p-1  text-sm bg-primary text-white rounded-md"
              style={{ fontSize: 11 }}
            >
              Mês
            </button>
            <button
              className="px-2  text-sm flex items-center"
              style={{ fontSize: 11 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 10H21"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 14H21"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 18H21"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 6H21"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Timeline
            </button>
          </div>
          <div className="flex-grow"></div>
          <button className="px-3 py-1.5 text-sm text-primary">Hoje</button>
        </div>

        <div className="p-3 flex-grow">
          {/* Navegação do mês */}
          <div className="flex justify-between items-center mb-2">
            <button className="w-6 h-6 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="font-medium">abril 2025</div>
            <button className="w-6 h-6 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="#666"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Calendário */}
          <div className="calendar-event">
            <div className="grid grid-cols-7 gap-1">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs text-muted-foreground"
                >
                  {day}
                </div>
              ))}

              {/* Dias do mês - corresponde à captura de tela */}
              <div className="text-center text-xs py-2 text-gray-400">30</div>
              <div className="text-center text-xs py-2 text-gray-400">31</div>
              <div className="text-center text-xs py-2">1</div>
              <div className="text-center text-xs py-2">2</div>
              <div className="text-center text-xs py-2">3</div>
              <div className="text-center text-xs py-2">4</div>
              <div className="text-center text-xs py-2">5</div>

              <div className="text-center text-xs py-2">6</div>
              <div className="text-center text-xs py-2">7</div>
              <div className="text-center text-xs py-2">8</div>
              <div className="text-center text-xs py-2">9</div>
              <div className="text-center text-xs py-2">10</div>
              <div className="text-center text-xs py-2">11</div>
              <div className="text-center text-xs py-2">12</div>

              <div className="text-center text-xs py-2">13</div>
              <div className="text-center text-xs py-2">14</div>
              <div className="text-center text-xs py-2">15</div>
              <div className="text-center text-xs py-2">16</div>
              <div className="text-center text-xs py-2 relative">
                17
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px]">
                  3
                </div>
              </div>
              <div className="text-center text-xs py-2">18</div>
              <div className="text-center text-xs py-2">19</div>

              <div className="text-center text-xs py-2">20</div>
              <div className="text-center text-xs py-2 relative">
                21
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px]">
                  1
                </div>
              </div>
              <div className="text-center text-xs py-2">22</div>
              <div className="text-center text-xs py-2">23</div>
              <div className="text-center text-xs py-2">24</div>
              <div className="text-center text-xs py-2">25</div>
              <div className="text-center text-xs py-2">26</div>

              <div className="text-center text-xs py-2 relative">
                27
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px]">
                  3
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-300"></div>
              </div>
              <div className="text-center text-xs py-2 font-bold bg-primary/10 rounded-sm">
                28
              </div>
              <div className="text-center text-xs py-2">29</div>
              <div className="text-center text-xs py-2">30</div>
              <div className="text-center text-xs py-2 text-gray-400">1</div>
              <div className="text-center text-xs py-2 text-gray-400">2</div>
              <div className="text-center text-xs py-2 text-gray-400">3</div>
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="border-t py-2 px-6 flex justify-between">
          <button className="flex flex-col items-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="6"
                width="18"
                height="15"
                rx="2"
                stroke="#E74C3C"
                strokeWidth="1.5"
              />
              <path
                d="M3 10H21"
                stroke="#E74C3C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M7 3L7 7"
                stroke="#E74C3C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M17 3L17 7"
                stroke="#E74C3C"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] text-primary">Agenda</span>
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <button className="flex flex-col items-center">
            <span className="material-icons text-[22px]">task_alt</span>

            <span className="text-[10px] text-gray-600">Tarefas</span>
          </button>
        </div>
      </div>

      {/* Tela de Tarefas */}
      <div
        ref={tasksScreenRef}
        className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden flex flex-col h-[550px]"
      >
        {/* Header aplicativo */}
        <div className="bg-primary p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src="/logo-white.png"
              alt="Nós Juntos"
              className="h-8 drop-shadow-sm"
            />
          </div>
          <div className="flex items-center">
            <div className="text-white ml-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-white ml-2">MM</div>
          </div>
        </div>

        {/* Header de tarefas */}
        <div className="bg-primary/10 p-3">
          <div className="flex justify-between items-center">
            <div className="font-medium text-sm">Minhas tarefas</div>
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-primary/10 text-xs rounded-md text-primary flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 6H21M7 12H17M11 18H13"
                    stroke="#E74C3C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Filtros
              </button>
              <button className="px-2 py-1 bg-primary/10 text-xs rounded-md text-primary flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="#E74C3C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Nova
              </button>
            </div>
          </div>
        </div>
        <div className="flex mt-3 border-b">
          <button className="px-4 py-1.5 text-xs border-b-2 border-primary text-primary">
            Pendentes
          </button>
          <button className="px-4 py-1.5 text-xs text-gray-500">
            Concluídas
          </button>
          <button className="px-4 py-1.5 text-xs text-gray-500">Todas</button>
        </div>
        <div className="p-3 flex-grow">
          {/* Grupo de tarefas */}
          <div className="task-item-check mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.9999 5.99997L19.7999 12L11.9999 18M4.19995 12H19.7999"
                    stroke="#E74C3C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium text-sm">Tarefas Diárias</span>
              </div>
              <span className="bg-gray-200 px-1 rounded text-xs">3</span>
            </div>
          </div>

          {/* Lista de tarefas */}
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-start">
                <div className="task-item-check mt-1">
                  <div className="h-5 w-5 rounded border border-gray-300"></div>
                </div>
                <div className="ml-3">
                  <div className="font-medium">Tirar os lixos</div>
                  <div className="text-xs text-gray-500">
                    Tarefa diária: Tirar os lixos
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-primary text-white text-[10px] rounded-full flex items-center">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="ml-1">Hoje</span>
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full flex items-center">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.0206 7.21885C14.1545 7.63087 14.5385 7.90983 14.9717 7.90983H18.4329C19.4016 7.90983 19.8044 9.14945 19.0207 9.71885L16.2205 11.7533C15.87 12.0079 15.7234 12.4593 15.8572 12.8713L16.9268 16.1631C17.2261 17.0844 16.1717 17.8506 15.388 17.2812L12.5878 15.2467C12.2373 14.9921 11.7627 14.9921 11.4122 15.2467L8.61204 17.2812C7.82833 17.8506 6.77386 17.0844 7.0732 16.1631L8.14277 12.8713C8.27665 12.4593 8.12999 12.0079 7.7795 11.7533L4.97927 9.71885C4.19556 9.14945 4.59838 7.90983 5.56706 7.90983H9.0283C9.46148 7.90983 9.8455 7.63087 9.97937 7.21885L11.0489 3.92705Z"
                          stroke="#3B82F6"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <span className="ml-1">Baixa</span>
                    </span>
                  </div>
                </div>
                <div className="ml-auto">
                  <button className="text-gray-400">⋮</button>
                </div>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-start">
                <div className="task-item-check mt-1">
                  <div className="h-5 w-5 rounded border border-gray-300"></div>
                </div>
                <div className="ml-3">
                  <div className="font-medium">Lavar louça</div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full flex items-center">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.0206 7.21885C14.1545 7.63087 14.5385 7.90983 14.9717 7.90983H18.4329C19.4016 7.90983 19.8044 9.14945 19.0207 9.71885L16.2205 11.7533C15.87 12.0079 15.7234 12.4593 15.8572 12.8713L16.9268 16.1631C17.2261 17.0844 16.1717 17.8506 15.388 17.2812L12.5878 15.2467C12.2373 14.9921 11.7627 14.9921 11.4122 15.2467L8.61204 17.2812C7.82833 17.8506 6.77386 17.0844 7.0732 16.1631L8.14277 12.8713C8.27665 12.4593 8.12999 12.0079 7.7795 11.7533L4.97927 9.71885C4.19556 9.14945 4.59838 7.90983 5.56706 7.90983H9.0283C9.46148 7.90983 9.8455 7.63087 9.97937 7.21885L11.0489 3.92705Z"
                          stroke="#EF4444"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <span className="ml-1">Alta</span>
                    </span>
                  </div>
                </div>
                <div className="ml-auto">
                  <button className="text-gray-400">⋮</button>
                </div>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-start">
                <div className="task-item-check mt-1">
                  <div className="h-5 w-5 rounded border border-gray-300"></div>
                </div>
                <div className="ml-3">
                  <div className="font-medium">Limpar o robô aspirador</div>
                  <div className="text-xs text-gray-500">
                    Tarefa diária: Limpar o robô aspirador
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full flex items-center">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.0206 7.21885C14.1545 7.63087 14.5385 7.90983 14.9717 7.90983H18.4329C19.4016 7.90983 19.8044 9.14945 19.0207 9.71885L16.2205 11.7533C15.87 12.0079 15.7234 12.4593 15.8572 12.8713L16.9268 16.1631C17.2261 17.0844 16.1717 17.8506 15.388 17.2812L12.5878 15.2467C12.2373 14.9921 11.7627 14.9921 11.4122 15.2467L8.61204 17.2812C7.82833 17.8506 6.77386 17.0844 7.0732 16.1631L8.14277 12.8713C8.27665 12.4593 8.12999 12.0079 7.7795 11.7533L4.97927 9.71885C4.19556 9.14945 4.59838 7.90983 5.56706 7.90983H9.0283C9.46148 7.90983 9.8455 7.63087 9.97937 7.21885L11.0489 3.92705Z"
                          stroke="#3B82F6"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <span className="ml-1">Baixa</span>
                    </span>
                  </div>
                </div>
                <div className="ml-auto">
                  <button className="text-gray-400">⋮</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="border-t py-2 px-6 flex justify-between">
          <button className="flex flex-col items-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="6"
                width="18"
                height="15"
                rx="2"
                stroke="#666666"
                strokeWidth="1.5"
              />
              <path
                d="M3 10H21"
                stroke="#666666"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M7 3L7 7"
                stroke="#666666"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M17 3L17 7"
                stroke="#666666"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] text-gray-600">Agenda</span>
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <button className="flex flex-col items-center">
            <span className="material-icons text-[22px] text-primary">
              task_alt
            </span>

            <span className="text-[10px] text-primary">Tarefas</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppScreensMock;
