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
            <div className="text-white font-semibold">
              Nós Juntos
            </div>
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
                    d="M21.0009 12.79C20.8428 14.4922 20.2066 16.1144 19.1631 17.4668C18.1195 18.8192 16.7101 19.8458 15.0944 20.4265C13.4788 21.0073 11.7307 21.1181 10.0501 20.7461C8.36961 20.3741 6.82762 19.5345 5.6127 18.3196C4.39778 17.1047 3.55818 15.5627 3.18619 13.8822C2.81419 12.2016 2.92489 10.4534 3.50567 8.83774C4.08645 7.22208 5.11301 5.8127 6.46538 4.76916C7.81775 3.72562 9.43997 3.08945 11.1422 2.93127C10.1866 4.16371 9.7369 5.70577 9.87384 7.25273C10.0108 8.79969 10.7264 10.2294 11.8823 11.2877C13.0382 12.346 14.5493 12.9615 16.1211 12.9957C17.6929 13.0298 19.2317 12.4804 20.4322 11.46C20.646 11.8896 20.8237 12.3352 20.9631 12.793L21.0009 12.79Z"
                    stroke="#9333EA"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="text-sm font-medium">Noite</div>
              <div className="text-xs text-gray-500 ml-2">18h - 23h</div>
            </div>

            <div className="ml-8 pl-4 border-l-2 border-purple-300 relative">
              <div className="absolute -left-[0.3rem] top-1 h-2 w-2 rounded-full bg-purple-300"></div>
              <div className="flex justify-between mb-1">
                <div className="text-sm font-medium">20:00</div>
                <div className="text-sm">21:00</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg mb-3">
                <div className="flex items-center">
                  <div className="mr-2">🍿</div>
                  <div>
                    <div className="font-medium">Sessão de filme</div>
                    <div className="text-xs text-gray-500">Em casa</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tela de Tarefas Domésticas */}
      <div
        ref={tasksScreenRef}
        className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden flex flex-col h-[550px]"
      >
        {/* Header aplicativo */}
        <div className="bg-primary p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-white font-semibold">
              Nós Juntos
            </div>
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
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">Tarefas Domésticas</h1>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto">
          <button className="px-3 py-1 bg-primary text-white text-sm rounded-full">
            Todas
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            Minhas
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            Do parceiro
          </button>
          <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            Atrasadas
          </button>
        </div>

        {/* Lista de tarefas */}
        <div className="p-4 flex-grow overflow-auto">
          {/* Grupo: Hoje */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3">HOJE</h2>
            <div className="space-y-3">
              {/* Tarefa 1 */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center task-item-check"></div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900">
                      Lavar louça do jantar
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>Até 22:00</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                      M
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarefa 2 */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center task-item-check">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900 line-through text-gray-500">
                      Levar o lixo para fora
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="M20 6L9 17L4 12"></path>
                      </svg>
                      <span>Concluída às 18:30</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center text-xs text-white">
                      J
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarefa 3 */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-5 h-5 border-2 border-primary rounded-full flex items-center justify-center task-item-check"></div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900">
                      Preparar café da manhã especial
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full mr-2">
                        Recorrente
                      </span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>07:00</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center text-xs text-white">
                      J
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grupo: Amanhã */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3">AMANHÃ</h2>
            <div className="space-y-3">
              {/* Tarefa 1 */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center"></div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900">
                      Limpar banheiro
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>Qualquer hora</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                      M
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarefa 2 */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center"></div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium text-gray-900">
                      Fazer compras do mês
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mr-2">
                        Compartilhada
                      </span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span>10:00</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <div className="flex -space-x-1">
                      <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white ring-2 ring-white">
                        M
                      </div>
                      <div className="h-6 w-6 rounded-full bg-rose-500 flex items-center justify-center text-xs text-white ring-2 ring-white">
                        J
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tela de Calendário */}
      <div
        ref={calendarScreenRef}
        className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden flex flex-col h-[550px]"
      >
        {/* Header aplicativo */}
        <div className="bg-primary p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-white font-semibold">
              Nós Juntos
            </div>
          </div>
          <div className="flex items-center">
            <div className="relative text-white ml-2">
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
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-white notification-dot"></div>
            </div>
            <div className="text-white ml-2">MM</div>
          </div>
        </div>

        {/* Header do calendário */}
        <div className="p-3 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </button>
              <h1 className="text-lg font-medium mx-2">Abril 2025</h1>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <button className="px-2 py-1 text-xs text-primary bg-primary/10 rounded">
              Hoje
            </button>
          </div>

          {/* Seletor de visualização */}
          <div className="flex mt-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button className="px-3 py-1 text-xs">Dia</button>
              <button className="px-3 py-1 text-xs">Semana</button>
              <button className="px-3 py-1 text-xs bg-primary text-white rounded">
                Mês
              </button>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <div className="flex-grow">
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7 text-center py-2 border-b text-xs font-medium">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Grade do calendário */}
          <div className="grid grid-cols-7 grid-rows-5 h-[calc(100%-2.5rem)]">
            {/* Linha 1 */}
            <div className="border-b border-r p-1 text-gray-400 text-xs">
              <div className="text-right mb-1">30</div>
            </div>
            <div className="border-b border-r p-1 text-gray-400 text-xs">
              <div className="text-right mb-1">31</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">1</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">2</div>
              <div className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] mb-1 calendar-event">
                Reunião trabalho
              </div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">3</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">4</div>
            </div>
            <div className="border-b p-1 text-xs">
              <div className="text-right mb-1">5</div>
            </div>

            {/* Linha 2 */}
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">6</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">7</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">8</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">9</div>
              <div className="px-1 py-0.5 bg-pink-100 text-pink-800 rounded text-[10px] mb-1 calendar-event">
                Aniversário mamãe
              </div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">10</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">11</div>
            </div>
            <div className="border-b p-1 text-xs">
              <div className="text-right mb-1">12</div>
              <div className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] mb-1 calendar-event flex items-center">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.8401 4.60987C20.3294 4.09888 19.7229 3.69352 19.0555 3.41696C18.388 3.14039 17.6726 2.99805 16.9501 2.99805C16.2276 2.99805 15.5122 3.14039 14.8448 3.41696C14.1773 3.69352 13.5709 4.09888 13.0601 4.60987L12.0001 5.66987L10.9401 4.60987C9.90843 3.57818 8.50915 2.99858 7.05012 2.99858C5.59109 2.99858 4.19181 3.57818 3.16012 4.60987C2.12843 5.64156 1.54883 7.04084 1.54883 8.49987C1.54883 9.95891 2.12843 11.3582 3.16012 12.3899L4.22012 13.4499L12.0001 21.2299L19.7801 13.4499L20.8401 12.3899C21.3511 11.8791 21.7565 11.2727 22.033 10.6052C22.3096 9.93777 22.4519 9.22236 22.4519 8.49987C22.4519 7.77738 22.3096 7.06198 22.033 6.39452C21.7565 5.72706 21.3511 5.12063 20.8401 4.60987Z"
                    stroke="#9333EA"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Jantar romântico
              </div>
            </div>

            {/* Linha 3 */}
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">13</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">14</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">15</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">16</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">17</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">18</div>
            </div>
            <div className="border-b p-1 text-xs">
              <div className="text-right mb-1">19</div>
            </div>

            {/* Linha 4 */}
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">20</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">21</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">22</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">23</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">24</div>
            </div>
            <div className="border-b border-r p-1 text-xs">
              <div className="text-right mb-1">25</div>
            </div>
            <div className="border-b p-1 text-xs">
              <div className="text-right mb-1">26</div>
              <div className="px-1 py-0.5 bg-pink-100 text-pink-800 rounded text-[10px] mb-1 calendar-event flex items-center">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.8401 4.60987C20.3294 4.09888 19.7229 3.69352 19.0555 3.41696C18.388 3.14039 17.6726 2.99805 16.9501 2.99805C16.2276 2.99805 15.5122 3.14039 14.8448 3.41696C14.1773 3.69352 13.5709 4.09888 13.0601 4.60987L12.0001 5.66987L10.9401 4.60987C9.90843 3.57818 8.50915 2.99858 7.05012 2.99858C5.59109 2.99858 4.19181 3.57818 3.16012 4.60987C2.12843 5.64156 1.54883 7.04084 1.54883 8.49987C1.54883 9.95891 2.12843 11.3582 3.16012 12.3899L4.22012 13.4499L12.0001 21.2299L19.7801 13.4499L20.8401 12.3899C21.3511 11.8791 21.7565 11.2727 22.033 10.6052C22.3096 9.93777 22.4519 9.22236 22.4519 8.49987C22.4519 7.77738 22.3096 7.06198 22.033 6.39452C21.7565 5.72706 21.3511 5.12063 20.8401 4.60987Z"
                    stroke="#EC4899"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Ir ao cinema
              </div>
            </div>

            {/* Linha 5 */}
            <div className="border-r p-1 text-xs bg-blue-50 rounded-bl">
              <div className="text-right mb-1 font-bold">27</div>
            </div>
            <div className="border-r p-1 text-xs bg-primary/10">
              <div className="text-right mb-1 font-bold text-primary">28</div>
              <div className="px-1 py-0.5 bg-green-100 text-green-800 rounded text-[10px] mb-1 calendar-event">
                Viagem
              </div>
            </div>
            <div className="border-r p-1 text-xs">
              <div className="text-right mb-1">29</div>
            </div>
            <div className="border-r p-1 text-xs">
              <div className="text-right mb-1">30</div>
            </div>
            <div className="border-r p-1 text-gray-400 text-xs">
              <div className="text-right mb-1">1</div>
            </div>
            <div className="border-r p-1 text-gray-400 text-xs">
              <div className="text-right mb-1">2</div>
            </div>
            <div className="p-1 text-gray-400 text-xs rounded-br">
              <div className="text-right mb-1">3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppScreensMock;