import { useCallback, useReducer, useState, type SVGProps } from "react";

type Message = {
    author: "me" | "them";
    text: string;
    water: number;
};

type Action =
    | { type: "send"; message: string }
    | { type: "recieve"; text: string; water: number }
    | { type: "newChat" };

function App() {
    const [state, dispatch] = useReducer(
        (state, action: Action) => {
            switch (action.type) {
                case "send": {
                    const water = calculateWater(action.message);

                    // send to backend
                    return {
                        ...state,
                        waterChat: state.waterChat + water,
                        waterAccount: state.waterAccount + water,
                        chatLog: [
                            ...state.chatLog,
                            {
                                author: "me" as const,
                                text: action.message,
                                water,
                            },
                        ],
                    };
                }
                case "recieve": {
                    const water = action.water;

                    return {
                        ...state,
                        waterChat: state.waterChat + water,
                        waterAccount: state.waterAccount + water,
                        chatLog: [
                            ...state.chatLog,
                            {
                                author: "them" as const,
                                text: action.text,
                                water: action.water,
                            },
                        ],
                    };
                }
                case "newChat": {
                    return { ...state, chatLog: [], waterChat: 0 };
                }
                default: {
                    return state;
                }
            }
        },
        {
            waterAccount: 0,
            waterChat: 0,
            chatLog: [
                {
                    author: "me",
                    text: "super minimal tailwind markup for a minimal messages like chat log",
                    water: 4,
                },
                {
                    author: "them",
                    text: `Hello! Creating a super minimal chat log using Tailwind CSS is a great idea for a clean interface.

                    Here is a very minimal and reusable structure with Tailwind classes. It focuses on clarity, and you can easily drop this into any Tailwind project.

                    💬 Minimal Chat Log Markup

                    This example shows two messages: one from the user (right-aligned, primary color) and one from the other person (left-aligned, light gray).`,
                    water: 4,
                },
                {
                    author: "me",
                    text: "super minimal tailwind markup for a minimal messages like chat log",
                    water: 4,
                },
            ] as Message[],
        },
    );

    return (
        <div className="flex flex-col gap-8 p-8 max-w-4xl w-full mx-auto h-screen shadow-inner">
            <div className="flex flex-col flex-1 overflow-scroll gap-8">
                {state.chatLog.map((message) => {
                    return (
                        <div
                            className={`flex ${message.author === "me" ? "justify-end" : "justify-start"}`}
                        >
                            <div className="flex flex-col">
                                <div
                                    className={`flex gap-1 py-1 bg-emerald-500/20 border-2 border-emerald-500 rounded-lg items-center ${message.author === "me" ? "justify-end" : "justify-start"}`}
                                >
                                    <Droplets
                                        className="text-emerald-500"
                                        water="the following prompt used ~3.4ml"
                                    />
                                </div>
                                <div
                                    className={`${message.author === "me" ? "bg-emerald-500/20 text-emerald-950 rounded-tr-none max-w-md" : "text-lg max-w-lg"} p-3 rounded-2xl`}
                                >
                                    {message.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <Input dispatch={dispatch} />
        </div>
    );
}

const Input = ({
    dispatch,
}: {
    dispatch: React.ActionDispatch<[action: Action]>;
}) => {
    const [inputValue, setInputValue] = useState("");
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                setInputValue("");
                dispatch({ type: "send", message: inputValue });
            }}
        >
            <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border-emerald-600/50 border-2"
                placeholder="ask..."
            />
            <div className="py-2 flex gap-2 text-sm">
                <div className="flex items-center gap-1">
                    This chat has drank an equivelant of
                    <Droplets className="text-emerald-500" water={"3.4ml"} /> of
                    water
                </div>
                <div className="mx-auto" />
                <button className="bg-green-600 text-white rounded px-2 py-1 uppercase tracking-wide">
                    send
                </button>
                <button className="bg-green-600 text-white rounded px-2 py-1 uppercase tracking-wide">
                    new chat
                </button>
            </div>
        </form>
    );
};

const Droplets = (props) => (
    <div className="flex gap-1 items-center">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-droplets-icon lucide-droplets"
            {...props}
        >
            <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
            <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
        </svg>
        <div className="font-semibold">{props.water}</div>
    </div>
);

const calculateWater = (text: string) => {
    return text.length * 20;
};

export default App;
