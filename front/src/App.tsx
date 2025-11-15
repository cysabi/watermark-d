import { useCallback, useReducer, useState } from "react";

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
                            <div
                                className={`${message.author === "me" ? "bg-emerald-500/20 text-emerald-950 rounded-tr-none" : "bg-stone-200 text-stone-800 rounded-tl-none"} p-3 rounded-2xl max-w-md`}
                            >
                                {message.text}
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
            <div className="py-2 flex gap-2 justify-end text-sm">
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

const calculateWater = (text: string) => {
    return text.length * 20;
};

export default App;
