"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Settings2,
  Radio,
  ChevronRight,
  ChevronLeft,
  X,
  Terminal,
  Database,
  Zap,
  Sliders,
  Cpu,
  Thermometer,
  Box,
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import type { GameState } from "@/components/OfficeCanvas";
import { Character, CharacterState } from "@/lib/office/worker/api/Character";
import { Pathfinding } from "@/lib/office/engine/Pathfinding";
import { SpriteLoader } from "@/lib/office/engine/SpriteLoader";

const OfficeCanvas = dynamic(
  () => import("@/components/OfficeCanvas").then((m) => m.OfficeCanvas),
  { ssr: false },
);
const ChatSidebar = dynamic(
  () => import("@/components/ChatSidebar").then((m) => m.ChatSidebar),
  { ssr: false },
);

const RAW_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const MAX_COLS = Math.max(...RAW_MAP.map((r) => r.length));

function createGrid() {
  const grid = RAW_MAP.map((row) => {
    const newRow = [...row];
    while (newRow.length < MAX_COLS) newRow.push(1);
    return newRow;
  });

  // Default desks to be added to grid
  const defaultDesks = [
    { x: 9, y: 10 },
    { x: 9, y: 13 },
    { x: 11, y: 10 },
    { x: 11, y: 13 },
    { x: 13, y: 10 },
    { x: 13, y: 13 },
    { x: 15, y: 10 },
    { x: 15, y: 13 },
    { x: 17, y: 10 },
    { x: 17, y: 13 },
    { x: 19, y: 10 },
    { x: 19, y: 13 },
  ];

  for (const desk of defaultDesks) {
    if (grid[desk.y] && grid[desk.y][desk.x] !== undefined) {
      grid[desk.y][desk.x] = 0; // Desks MUST be walkable for characters to sit AT them
    }
  }

  return grid;
}

export default function Page() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, any[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [showHireMenu, setShowHireMenu] = useState(false);
  const [recruitForm, setRecruitForm] = useState<{
    idx: number;
    name: string;
    profession: string;
    mbti: string;
    stance: string;
    bio: string;
    temperature: number;
    topP: number;
    topK: number;
  } | null>(null);
  const [showCabinetMenu, setShowCabinetMenu] = useState(false);
  const [cabinetLogs, setCabinetLogs] = useState<
    { message: string; timestamp: number; agent?: string; type?: string }[]
  >([]);
  const cabinetLogsRef = useRef<
    { message: string; timestamp: number; agent?: string; type?: string }[]
  >([]);
  const [logSearch, setLogSearch] = useState("");
  const [logAgentFilter, setLogAgentFilter] = useState("all");
  const [logDateRange, setLogDateRange] = useState({ start: "", end: "" });
  const [fileSearch, setFileSearch] = useState("");
  const [fileAuthorFilter, setFileAuthorFilter] = useState("all");
  const [broadcastPriority, setBroadcastPriority] = useState<
    "high" | "medium" | "low"
  >("medium");
  const [cabinetFiles, setCabinetFiles] = useState<
    { name: string; data: string; type: string; author: string }[]
  >([]);
  const cabinetFilesRef = useRef<
    { name: string; data: string; type: string; author: string }[]
  >([]);
  const uploadedFilesRef = useRef<
    Array<{ type: string; data: string; name: string }>
  >([]);
  const [characterList, setCharacterList] = useState<Character[]>([]);
  const [relayPendingFiles, setRelayPendingFiles] = useState<
    { name: string; data: string; type: string }[]
  >([]);

  const [isClient, setIsClient] = useState(false);
  const [cabinetTab, setCabinetTab] = useState<"logs" | "files">("logs");

  useEffect(() => {
    setIsClient(true);
    SpriteLoader.loadSheets().then(() => {
      setAssetsLoaded(true);
    });
  }, []);

  const gameStateRef = useRef<GameState>({
    characters: [],
    grid: createGrid(),
    selectedId: null,
    serverRoomPoint: { x: 3, y: 3 },
    meetingTableRoomPoint: { x: 10, y: 4 },
    desks: [
      { x: 9, y: 10 },
      { x: 9, y: 13 },
      { x: 11, y: 10 },
      { x: 11, y: 13 },
      { x: 13, y: 10 },
      { x: 13, y: 13 },
      { x: 15, y: 10 },
      { x: 15, y: 13 },
      { x: 17, y: 10 },
      { x: 17, y: 13 },
      { x: 19, y: 10 },
      { x: 19, y: 13 },
    ],
  });

  // Initial characters
  useEffect(() => {
    const chars = [
      new Character("c1", "Alice", 9, 10, "#EF4444", 0),
      new Character("c2", "Bob", 11, 10, "#3B82F6", 1),
    ];
    chars.forEach((c) => {
      c.aiConfig.autonomousLoop = true;
    });
    gameStateRef.current.characters = chars;
    setCharacterList([...chars]);
  }, []);

  // Make desks walls in grid so they can't path through them, only step on them
  useEffect(() => {
    const freshGrid = createGrid();

    // Meeting table collision area (matches the asset size)
    for (let my = 2; my <= 7; my++) {
      for (let mx = 9; mx <= 15; mx++) {
        if (freshGrid[my] && freshGrid[my][mx] !== undefined) {
          freshGrid[my][mx] = 1;
        }
      }
    }

    // Harden the central wall line
    for (let mx = 7; mx <= 22; mx++) {
      if (freshGrid[7]) freshGrid[7][mx] = 1;
    }

    // Reception desk area
    for (let my = 10; my <= 12; my++) {
      for (let mx = 1; mx <= 6; mx++) {
        if (freshGrid[my]) freshGrid[my][mx] = 1;
      }
    }

    // Bottom border
    for (let mx = 0; mx <= 22; mx++) {
      if (freshGrid[18]) freshGrid[18][mx] = 1;
    }

    gameStateRef.current.grid = freshGrid;
  }, []);

  const startRecruit = (spriteIdx: number, name: string) => {
    const mbtiTypes = [
      "INTJ",
      "INTP",
      "ENTJ",
      "ENTP",
      "INFJ",
      "INFP",
      "ENFJ",
      "ENFP",
      "ISTJ",
      "ISFJ",
      "ESTJ",
      "ESFJ",
      "ISTP",
      "ISFP",
      "ESTP",
      "ESFP",
    ];
    const professions = [
      "Data Analyst",
      "Security Expert",
      "Junior Dev",
      "Senior Engineer",
      "Product Manager",
      "Researcher",
    ];
    const stances = ["supportive", "opposing", "neutral", "observer"];

    const r_mbti = mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)];
    const r_prof = professions[Math.floor(Math.random() * professions.length)];
    const r_stance = stances[Math.floor(Math.random() * stances.length)];
    setRecruitForm({
      idx: spriteIdx,
      name,
      profession: r_prof,
      mbti: r_mbti,
      stance: r_stance,
      bio: `${name} is an AI ${r_prof} with ${r_mbti} personality. Known for being highly analytical and maintaining a ${r_stance} stance on general directives.`,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    });
  };

  const handleHireWorker = () => {
    if (!recruitForm) return;
    const {
      idx,
      name,
      profession,
      mbti,
      stance,
      bio,
      temperature,
      topP,
      topK,
    } = recruitForm;
    const state = gameStateRef.current;

    // Always spawn new hires at the bottom-center entrance
    let spawn = { x: 11, y: 18 };

    const newId = `c${Date.now()}`;
    const newChar = new Character(
      newId,
      name,
      spawn.x,
      spawn.y,
      "#ffffff",
      idx,
    );
    newChar.profession = profession;
    newChar.mbti = mbti;
    newChar.stance = stance;
    newChar.bio = bio;
    newChar.aiConfig = {
      temperature,
      topP,
      topK,
      model: "gemini-3-flash-preview",
      autonomousLoop: true,
    };

    state.characters.push(newChar);
    setCharacterList([...state.characters]);
    setShowHireMenu(false);
    setRecruitForm(null);
    setChats((prev) => ({ ...prev }));
  };

  const handleFireWorker = () => {
    if (!selectedAgentId) return;
    const state = gameStateRef.current;
    state.characters = state.characters.filter((c) => c.id !== selectedAgentId);
    setCharacterList([...state.characters]);
    state.selectedId = null;
    setSelectedAgentId(null);
    setChats((prev) => ({ ...prev }));
  };

  useEffect(() => {
    const handleFire = () => handleFireWorker();
    const handleGeneralTask = (e: any) => {
      const { task, agentId, priority, urgency } = e.detail;
      assignTaskToAgent(agentId, task, priority || "medium", urgency || 0.5);
    };
    const handleAddCabinetLog = (e: any) => {
      const logData =
        typeof e.detail === "string"
          ? { message: e.detail, timestamp: Date.now() }
          : { ...e.detail, timestamp: e.detail.timestamp || Date.now() };

      setCabinetLogs((prev) => {
        const next = [...prev, logData];
        cabinetLogsRef.current = next;
        return next;
      });
    };
    const handleAddCabinetFile = (e: any) => {
      setCabinetFiles((prev) => {
        const next = [...prev, e.detail];
        cabinetFilesRef.current = next;
        return next;
      });
    };
    const handleForceUpdate = () => {
      setCharacterList([...gameStateRef.current.characters]);
    };
    window.addEventListener("fireWorker", handleFire);
    window.addEventListener("assignGeneralTask", handleGeneralTask);
    window.addEventListener("addCabinetLog", handleAddCabinetLog);
    window.addEventListener("addCabinetFile", handleAddCabinetFile);
    window.addEventListener("forceUpdateUi", handleForceUpdate);
    return () => {
      window.removeEventListener("fireWorker", handleFire);
      window.removeEventListener("assignGeneralTask", handleGeneralTask);
      window.removeEventListener("addCabinetLog", handleAddCabinetLog);
      window.removeEventListener("addCabinetFile", handleAddCabinetFile);
      window.removeEventListener("forceUpdateUi", handleForceUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentId]);

  // Proactive discussion simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      const state = gameStateRef.current;
      const idleAgents = state.characters.filter(
        (c) => c.state === CharacterState.IDLE,
      );
      const normalIdleAgents: Character[] = []; // Disabled agents will only respond to direct commands now

      // Process autonomous agents proactively
      const now = Date.now();
      idleAgents.forEach((agent) => {
        const canStartCycle =
          agent.aiConfig?.autonomousLoop &&
          agent.taskQueue.length === 0 &&
          !agent.isProcessingTask &&
          agent.state !== CharacterState.PONDERING &&
          now - (agent.lastAutonomousCycle || 0) >
            (agent.autonomousCycleCooldown || 120000);

        if (canStartCycle) {
          agent.lastAutonomousCycle = now;
          // Conservative backoff for autonomous loop (3-6 minutes) to prevent rate limiting
          agent.autonomousCycleCooldown = 180000 + Math.random() * 180000;

          const memories = agent.memory
            .slice(0, 5)
            .map((m) => `[${m.type}]: ${m.content}`)
            .join("\\n");
          const taskPrompt = `[AUTONOMOUS CYCLE]: Review your goal ("${agent.currentGoal}"), recent memories:\\n${memories}\\nand history:\\n${cabinetLogsRef.current
            .slice(-5)
            .map((l) => l.message)
            .join(
              "\\n",
            )}\\n\\nBased on your profile, decide your next action. You may solve a task, interact, or self-reflect. If no external command is needed, use 'reply_only' to document your move.`;

          window.dispatchEvent(
            new CustomEvent("assignGeneralTask", {
              detail: {
                task: taskPrompt,
                agentId: agent.id,
              },
            }),
          );
        }
      });

      // Ensure there are idle agents and some history to comment on
      if (
        normalIdleAgents.length > 0 &&
        (cabinetLogsRef.current.length > 0 ||
          cabinetFilesRef.current.length > 0)
      ) {
        // Filter agents who are off cooldown
        const readyAgents = normalIdleAgents.filter(
          (a) =>
            now - (a.lastProactiveDiscussion || 0) >
            (a.proactiveDiscussionCooldown || 120000),
        );

        if (readyAgents.length > 0 && Math.random() < 0.25) {
          const randomAgent =
            readyAgents[Math.floor(Math.random() * readyAgents.length)];
          randomAgent.lastProactiveDiscussion = now;
          // Randomized cooldown for proactive discussion (4-8 minutes)
          randomAgent.proactiveDiscussionCooldown =
            240000 + Math.random() * 240000;

          const recentLogs = cabinetLogsRef.current
            .slice(-5)
            .map((l) => l.message)
            .join("\n");
          const recentFilesNames = cabinetFilesRef.current
            .slice(-3)
            .map((f) => f.name)
            .join(", ");

          const isSelfReflection = Math.random() < 0.3;
          let taskPrompt = "";

          if (isSelfReflection) {
            taskPrompt = `[INTERNAL MONOLOGUE]: Target: SELF. Ponder your current goal ("${randomAgent.currentGoal}") and recent interactions. Record a Cognito_Trace of your conclusion. Use 'reply_only'.`;
            randomAgent.state = CharacterState.PONDERING;
          } else {
            // Choose a target agent based on relationships or shared memory
            const otherAgents = state.characters.filter(
              (c) => c.id !== randomAgent.id,
            );
            let target =
              otherAgents[Math.floor(Math.random() * otherAgents.length)];

            // Try to find someone relevant
            const relList = Object.keys(randomAgent.relationships);
            if (relList.length > 0) {
              // Prefer someone with non-zero affinity
              const highStakesTargets = relList.filter(
                (name) =>
                  Math.abs(randomAgent.relationships[name].affinity) > 10,
              );
              if (highStakesTargets.length > 0 && Math.random() > 0.3) {
                const pickedName =
                  highStakesTargets[
                    Math.floor(Math.random() * highStakesTargets.length)
                  ];
                const pickedAgent = otherAgents.find(
                  (a) => a.name === pickedName,
                );
                if (pickedAgent) target = pickedAgent;
              }
            }

            taskPrompt = `[PROACTIVE COLLABORATION]: Target: ${target.name} (${target.profession}). Review office activity:\n${recentLogs}\n\nBased on your personality (${randomAgent.mbti}, ${randomAgent.stance}), initiate a discussion or critique involving ${target.name}. Keep it efficient.`;
          }

          window.dispatchEvent(
            new CustomEvent("assignGeneralTask", {
              detail: {
                task: taskPrompt,
                agentId: randomAgent.id,
                urgency: 0.4,
              },
            }),
          );
        }
      }
    }, 12000); // Check every 12 seconds
    return () => clearInterval(interval);
  }, []);

  const processNextTask = useCallback(
    async (agent: Character) => {
      if (agent.isProcessingTask || agent.taskQueue.length === 0) {
        if (agent.state !== CharacterState.WALK)
          agent.state = CharacterState.IDLE;
        return;
      }

      // Handle rate limit backoff
      if (agent.retryCooldown && Date.now() < agent.retryCooldown) {
        const wait = agent.retryCooldown - Date.now();
        setTimeout(() => processNextTask(agent), wait + 500);
        return;
      }

      // Sophisticated Prioritization
      const pWeights = { high: 200, medium: 100, low: 20 };

      // Filter tasks with met dependencies OR background tasks
      const readyTasks = agent.taskQueue.filter((t) => {
        if (!t.dependencies || t.dependencies.length === 0) return true;
        return t.dependencies.every((depId) =>
          agent.completedTaskIds.has(depId),
        );
      });

      if (readyTasks.length === 0) {
        agent.isProcessingTask = false;
        return;
      }

      readyTasks.sort((a, b) => {
        const priorityA = (a.priority || "medium") as keyof typeof pWeights;
        const priorityB = (b.priority || "medium") as keyof typeof pWeights;
        const scoreA =
          (pWeights[priorityA] || 100) +
          a.urgency * 150 -
          (agent.health < 40 ? 50 : 0);
        const scoreB =
          (pWeights[priorityB] || 100) +
          b.urgency * 150 -
          (agent.health < 40 ? 50 : 0);
        return scoreB - scoreA;
      });

      const taskItem = readyTasks[0];

      // Remove from queue
      const queueIdx = agent.taskQueue.findIndex((t) => t.id === taskItem.id);
      agent.taskQueue.splice(queueIdx, 1);

      const { task, resolve, reject, id: taskId } = taskItem;
      const agentId = agent.id;
      agent.isProcessingTask = true;

      setLoadingMap((prev) => ({ ...prev, [agentId]: true }));

      // Find assigned desk mapping from gameStateRef proximity or find a new free one
      const occupiedDesks = new Set(
        gameStateRef.current.characters
          .filter(
            (c) =>
              c.id !== agent.id &&
              (c.state === CharacterState.WORK || c.assignedDeskKey),
          )
          .map(
            (c) => c.assignedDeskKey || `${Math.floor(c.x)},${Math.floor(c.y)}`,
          ),
      );

      let assignedDesk = gameStateRef.current.desks.find(
        (d) =>
          agent.assignedDeskKey === `${d.x},${d.y}` ||
          (Math.abs(d.x - agent.x) < 2 && Math.abs(d.y - agent.y) < 2),
      );
      if (!assignedDesk) {
        assignedDesk = gameStateRef.current.desks.find(
          (d) => !occupiedDesks.has(`${d.x},${d.y}`),
        );
      }

      const originalDesk = assignedDesk
        ? { x: assignedDesk.x, y: assignedDesk.y }
        : { x: Math.floor(agent.x), y: Math.floor(agent.y) };

      if (assignedDesk) {
        agent.assignedDeskKey = `${assignedDesk.x},${assignedDesk.y}`;
      }

      const otherAgentsStatus = gameStateRef.current.characters
        .filter((c) => c.id !== agent.id)
        .slice(0, 4) // Limit to top 4 other agents to save tokens
        .map((c) => {
          const lastThought =
            (chats[c.id] || [])
              .filter(
                (m) =>
                  m.role === "system" && m.content.startsWith("[Thought]:"),
              )
              .slice(-1)[0]?.content || "[No data]";
          return `- ${c.name} (${c.profession}): ${c.state}, ${Math.round(c.health)}% HP, Goal: ${(c.currentGoal || "None").substring(0, 30)}... Analysis: ${lastThought.replace("[Thought]: ", "").substring(0, 60)}...`;
        })
        .join("\n");

      const cabFiles = cabinetFilesRef.current
        .slice(-3)
        .map(
          (f) => `- ${f.name} (by ${f.author}): ${f.data.substring(0, 60)}...`,
        )
        .join("\n");

      const formattedLogs = cabinetLogsRef.current
        .slice(-8)
        .map((l) => {
          const timeStr = new Date(l.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `[${timeStr}] ${l.agent ? l.agent + ": " : ""}${l.message.substring(0, 100)}`;
        })
        .join("\n");

      const runTask = async () => {
        // Character is AT the desk now
        agent.direction = 0; // face down
        agent.state = CharacterState.PONDERING;
        setLoadingMap((prev) => ({ ...prev, [agent.id]: true }));

        try {
          const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
          if (!apiKey) {
            throw new Error("Missing Gemini API Key");
          }
          const ai = new GoogleGenAI({ apiKey });
          const modelName = agent.aiConfig.model || "gemini-3-flash-preview";

          const aiPrompt = `[SYSTEM DEPLOYMENT: VIRTUAL WORKER SIMULATION]\nYou are ${agent.name}, an autonomous AI virtual worker running in an unbounded UNIX environment.\n\nROLE: ${agent.profession}, ${agent.mbti}, ${agent.stance}\nCURRENT GOAL: ${agent.currentGoal || "None. Wait for instructions."}\nBIO: ${agent.bio}\n\nENVIRONMENT:\n${otherAgentsStatus}\n\nRECENT LOGS:\n${formattedLogs}\n\nFILES:\n${cabFiles}\n\nEVENT/TASK:\n"${task}"\n\nIf you are stuck in an autonomous loop, analyze the command output and plan the next step. You have full shell execution access via the "command" field to read/write files, test code, run npm scripts, etc. If the overall task is fully complete, use action_type: "done".\n\nYou MUST output a valid JSON snippet matching this schema (with NO SURROUNDING MARKDOWN OR BACKTICKS):\n{\n  "thought_process": "Internal monologue, step-by-step reasoning",\n  "spoken_reply": "Message shown to user or team",\n  "action_type": "command" | "talk" | "done",\n  "command": "Shell command to run (if action_type is command)",\n  "save_memory": { "type": "fact|outcome", "content": "Knowledge to store" },\n  "update_goal": "Your current operating objective"\n}`;

          const parts: any[] = [{ text: aiPrompt }];

          // Grab recent uploaded files
          const recentFiles = uploadedFilesRef.current.slice(-2);
          for (const file of recentFiles) {
            if (file.type.startsWith("image/")) {
              parts.push({
                inlineData: {
                  data: file.data.split(",")[1],
                  mimeType: file.type,
                },
              });
            }
          }

          const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts }],
            config: {
              temperature: agent.aiConfig.temperature ?? 0.7,
              maxOutputTokens: 1000,
            },
          });

          const responseText = result.text || "Thinking...";

          agent.state = CharacterState.WORK;

          const jsonMatch = responseText.match(
            /```json.*?\n?(\{[\s\S]*?\})\n*.*?```/,
          );
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1]);

              if (parsed.thought_process) {
                setChats((prev) => ({
                  ...prev,
                  [agent.id]: [
                    ...(prev[agent.id] || []),
                    {
                      role: "system",
                      content: `[Thought]: ${parsed.thought_process}`,
                    },
                  ],
                }));
              }

              if (parsed.save_memory && parsed.save_memory.content) {
                agent.addMemory(
                  parsed.save_memory.type || "fact",
                  parsed.save_memory.content,
                );
              }

              if (parsed.update_goal) {
                agent.currentGoal = parsed.update_goal;
              }

              if (
                parsed.update_relationship &&
                parsed.update_relationship.target_worker
              ) {
                agent.updateRelationship(
                  parsed.update_relationship.target_worker,
                  parsed.update_relationship.affinity_change || 0,
                  parsed.update_relationship.note,
                );
              }

              if (parsed.action_type === "done") {
                responseText = parsed.spoken_reply || "Task completed.";
              } else if (parsed.action_type === "command" || parsed.command) {
                const cmd = parsed.command;
                const execRes = await fetch("/api/exec", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ command: cmd }),
                });
                const execData = await execRes.json();
                const output = execData.ok
                  ? execData.stdout
                  : execData.error + "\\n" + execData.stderr;
                window.dispatchEvent(
                  new CustomEvent("addCabinetLog", {
                    detail: `[${agent.name} Cmd Output]: ${output.substring(0, 100)}...`,
                  }),
                );
                responseText = parsed.spoken_reply || "Executed command.";

                if (agent.aiConfig?.autonomousLoop) {
                  setTimeout(() => {
                    assignTaskToAgent(
                      agent.id,
                      `[SYS] Command "${cmd}" output:\n${output}\nAnalyze it and proceed to the next step autonomously.`,
                      "high",
                    );
                  }, 3000);
                }
              } else {
                responseText = parsed.spoken_reply || responseText;
                if (agent.aiConfig?.autonomousLoop) {
                  setTimeout(() => {
                    assignTaskToAgent(
                      agent.id,
                      `[SYS] Proceeding... continue your autonomous task logic.`,
                      "medium",
                    );
                  }, 5000);
                }
              }
            } catch (e) {}
          }

          setLoadingMap((prev) => ({ ...prev, [agent.id]: false }));
          agent.state = CharacterState.IDLE;
          return { result: responseText };
        } catch (e: any) {
          setLoadingMap((prev) => ({ ...prev, [agent.id]: false }));

          const isQuotaError =
            e.message?.includes("429") ||
            e.message?.includes("RESOURCE_EXHAUSTED") ||
            e.message?.includes("usage limit");

          if (isQuotaError) {
            console.warn(
              `[QUOTA EXCEEDED] Agent ${agent.name} hitting rate limits.`,
            );

            // Re-queue the task and set backoff
            agent.taskQueue.unshift(taskItem);
            agent.retryCooldown = Date.now() + 30000; // 30 second penalty

            setChats((prev) => ({
              ...prev,
              [agent.id]: [
                ...(prev[agent.id] || []),
                {
                  role: "agent",
                  content: `[SYSTEM_NOTIFICATION]: Rate limit reached. I am pausing for 30s before retrying your request...`,
                },
              ],
            }));

            // We don't call setTimeout(processNextTask) here because finishTask will do it
          } else {
            setChats((prev) => ({
              ...prev,
              [agent.id]: [
                ...(prev[agent.id] || []),
                {
                  role: "agent",
                  content: `Processing Failure: ${e.message?.substring(0, 100)}`,
                },
              ],
            }));
          }

          agent.state = CharacterState.IDLE;
          return { result: `Error encountered during cycle.` };
        }
      };

      const targetDesk = { x: originalDesk.x, y: originalDesk.y };
      const finishTask = (res: any) => {
        agent.isProcessingTask = false;
        resolve(res);
        processNextTask(agent);
      };

      if (
        Math.abs(agent.x - targetDesk.x) < 0.1 &&
        Math.abs(agent.y - targetDesk.y) < 0.1
      ) {
        runTask().then(finishTask).catch(reject);
      } else {
        const p = Pathfinding.findPath(
          gameStateRef.current.grid,
          { x: Math.round(agent.x), y: Math.round(agent.y) },
          targetDesk,
        );
        if (p.length > 0) {
          agent.onReachDestination = () => {
            runTask().then(finishTask).catch(reject);
          };
          agent.setPath(p);
        } else {
          agent.x = targetDesk.x;
          agent.y = targetDesk.y;
          runTask().then(finishTask).catch(reject);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [setCharacterList],
  );

  const assignTaskToAgent = useCallback(
    (
      agentId: string,
      task: string,
      priority: "high" | "medium" | "low" = "medium",
      urgency: number = 0.5,
      dependencies: string[] = [],
      isBackground: boolean = false,
    ) => {
      setChats((prev) => ({
        ...prev,
        [agentId]: [
          ...(prev[agentId] || []),
          {
            role: "user",
            content: `[${isBackground ? "BG" : "MAIN"}|P:${priority.toUpperCase()}|U:${(urgency * 100).toFixed(0)}] ${task}`,
          },
        ],
      }));

      const agent = gameStateRef.current.characters.find(
        (c) => c.id === agentId,
      );
      if (!agent) return Promise.resolve(null);

      return new Promise((resolve, reject) => {
        const taskId = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        agent.taskQueue.push({
          id: taskId,
          task,
          priority,
          urgency,
          dependencies,
          isBackground,
          resolve,
          reject,
        });
        if (!agent.isProcessingTask) {
          processNextTask(agent);
        }
      });
    },
    [processNextTask],
  );

  const handleAssignTask = async (
    task: string,
    priority: "high" | "medium" | "low" = "medium",
  ) => {
    if (!selectedAgentId) return;
    assignTaskToAgent(selectedAgentId, task, priority);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        let logMsg = `[FILE UPLOADED]: ${file.name}\n`;

        const filePayload = { name: file.name, data: content, type: file.type };

        if (file.type.startsWith("image/")) {
          const base64Data = content.split(",")[1];
          uploadedFilesRef.current.push({
            type: file.type,
            data: base64Data,
            name: file.name,
          });
          logMsg += `(Image attached and available in shared vision context)`;
          window.dispatchEvent(
            new CustomEvent("addCabinetFile", {
              detail: { ...filePayload, author: "User" },
            }),
          );
        } else {
          uploadedFilesRef.current.push({
            type: "text/plain",
            data: content,
            name: file.name,
          });
          logMsg += `File Content Preview: ${content.substring(0, 1500)}${content.length > 1500 ? "..." : ""}`;
          window.dispatchEvent(
            new CustomEvent("addCabinetFile", {
              detail: { ...filePayload, type: "text/plain", author: "User" },
            }),
          );
        }

        if (hudTab === "relay") {
          setRelayPendingFiles((prev) => [...prev, filePayload]);
        }

        window.dispatchEvent(
          new CustomEvent("addCabinetLog", { detail: logMsg }),
        );
      };
      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const [hudTab, setHudTab] = useState<"dashboard" | "roster" | "relay">(
    "dashboard",
  );
  const [hudIsCollapsed, setHudIsCollapsed] = useState(false);

  // Telegram polling logic
  useEffect(() => {
    let lastUpdateId = 0;
    let isPolling = true;
    let abortController = new AbortController();
    let pollInterval = 15000; // Increased to 15s base

    const pollTelegram = async () => {
      if (!isPolling) return;

      // Stop polling if tab is not visible to save resources and prevent rate limits
      if (typeof document !== "undefined" && document.hidden) {
        setTimeout(pollTelegram, 5000);
        return;
      }

      try {
        const res = await fetch("/api/telegram/updates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offset: lastUpdateId + 1 }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          const isRateLimit =
            res.status === 429 || errText.toLowerCase().includes("rate");

          if (isRateLimit) {
            console.warn("Telegram polling rate limited. Backing off...");
            pollInterval = Math.min(pollInterval * 1.5, 60000); // Back off up to 1 minute
          } else {
            console.error("Failed to fetch Telegram updates:", errText);
          }

          if (isPolling) {
            setTimeout(pollTelegram, pollInterval);
          }
          return;
        }

        // Reset interval on success
        pollInterval = 15000;

        const data = await res.json();

        if (data.ok && data.result && data.result.length > 0) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            if (update.message && update.message.text) {
              const text = update.message.text as string;

              // Find an idle agent to assign the task to
              const state = gameStateRef.current;
              const availableAgent =
                state.characters.find((c) => c.state === CharacterState.IDLE) ||
                state.characters[0];

              if (availableAgent) {
                const chatId = update.message.chat.id;
                // Manager replies first to show activity
                fetch("/api/telegram/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `[SYSTEM]: Pesan diteruskan ke ${availableAgent.name}. Memproses...`,
                  }),
                }).catch(() => {});

                assignTaskToAgent(
                  availableAgent.id,
                  `[Remote Directive]: ${text}`,
                )
                  .then((res: any) => {
                    if (res && res.result) {
                      fetch("/api/telegram/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          chat_id: chatId,
                          text: `[${availableAgent.name}]: ${res.result}`,
                        }),
                      }).catch(() => {});
                    }
                  })
                  .catch((err) => console.error("Agent task failed:", err));
              }
            }
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
        console.warn("Telegram poll issue:", e.message);
      }

      if (isPolling) {
        setTimeout(pollTelegram, pollInterval); // Polling interval
      }
    };

    pollTelegram();
    return () => {
      isPolling = false;
      abortController.abort();
    };
  }, [assignTaskToAgent]);

  const selectedAgent =
    gameStateRef.current.characters.find((c) => c.id === selectedAgentId) ||
    null;

  if (!isClient) return null;

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-[#e0e0e0] font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0c10]/80 backdrop-blur-md shrink-0 z-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50"></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
            <span className="font-display font-medium tracking-[0.3em] text-xs text-white/90 uppercase">
              AUWORKER{" "}
              <span className="text-white/20 font-mono text-[9px] font-normal tracking-wide ml-2 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                v0.9.0-BETA
              </span>
            </span>
          </div>
          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2">
            <Activity size={10} className="text-white/20" />
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
              System_Integrity: 100%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
              Network_Stable
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-white/30 hover:text-white transition-colors">
              <Radio size={14} />
            </button>
            <button className="p-2 text-white/30 hover:text-white transition-colors">
              <Settings2 size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Responsive Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto] overflow-hidden relative">
        <main className="relative min-w-0 h-full overflow-hidden">
          {/* Unified Office Dashboard HUD */}
          <div
            className={`absolute top-6 left-6 w-full max-w-[420px] z-40 pointer-events-auto flex flex-col transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${hudIsCollapsed ? "-translate-x-[calc(100%-48px)]" : ""}`}
          >
            <motion.div
              initial={false}
              className="bg-[#0f1115]/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden flex flex-col group/hud"
            >
              {/* Soft Glow */}
              <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

              {/* Console Header */}
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between relative z-10 bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                    <Terminal size={18} className="text-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-sans text-[15px] font-semibold text-slate-100 tracking-tight">
                      Workspace
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
                        Online
                      </span>
                      <div className="w-1 h-1 bg-slate-700 rounded-full shrink-0"></div>
                      <span className="font-sans text-[11px] text-slate-400 font-medium">
                        {characterList.length} Active Staff
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setHudIsCollapsed(!hudIsCollapsed)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all rounded-lg"
                >
                  <ChevronRight
                    size={18}
                    className={`transition-transform duration-700 cubic-bezier(0.19,1,0.22,1) ${hudIsCollapsed ? "" : "rotate-180"}`}
                  />
                </button>
              </div>

              {!hudIsCollapsed && (
                <>
                  {/* Module Selector */}
                  <div className="flex p-2 bg-slate-900/40 border-b border-slate-800/60 gap-1.5 relative z-10">
                    {[
                      {
                        id: "dashboard",
                        label: "Monitor",
                        icon: <Activity size={14} />,
                      },
                      {
                        id: "roster",
                        label: "Directory",
                        icon: <Settings2 size={14} />,
                      },
                      {
                        id: "relay",
                        label: "Comms",
                        icon: <Radio size={14} />,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setHudTab(tab.id as any)}
                        className={`flex-1 py-2 flex items-center justify-center gap-2 font-sans text-[12px] font-medium transition-all relative rounded-lg ${
                          hudTab === tab.id
                            ? "text-white bg-slate-800 shadow-sm ring-1 ring-white/10"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                      >
                        <span className="relative z-10">{tab.icon}</span>
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-6 min-h-[480px] flex flex-col gap-6 relative">
                    <AnimatePresence mode="wait">
                      {hudTab === "dashboard" && (
                        <motion.div
                          key="dashboard"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.3, ease: "circOut" }}
                          className="flex flex-col gap-5"
                        >
                          {/* Main Stats */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
                              <span className="font-sans text-[11px] text-slate-400 font-medium tracking-wide block mb-2">
                                Ongoing Projects
                              </span>
                              <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-sans font-semibold text-white tracking-tight">
                                  {
                                    characterList.filter(
                                      (c) =>
                                        c.isProcessingTask ||
                                        c.state === CharacterState.WORK ||
                                        c.state === CharacterState.PONDERING,
                                    ).length
                                  }
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-indigo-400 font-medium">
                                    In Progress
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5">
                              <span className="font-sans text-[11px] text-slate-400 font-medium tracking-wide block mb-2">
                                Total Staff
                              </span>
                              <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-sans font-semibold text-white tracking-tight">
                                  {characterList.length < 10 ? "0" : ""}
                                  {characterList.length}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-emerald-400 font-medium">
                                    In Office
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Activity Grid */}
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                <span className="font-sans text-[11px] text-slate-400 font-medium tracking-wide">
                                  Staff Directory
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                              {characterList.map((c, i) => (
                                <motion.div
                                  key={c.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="group/node bg-slate-800/30 border border-slate-800/80 p-3.5 rounded-xl flex justify-between items-center transition-all hover:bg-slate-800/80 hover:border-slate-700"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="relative">
                                      <div
                                        className={`w-10 h-10 rounded-[12px] overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center shadow-inner`}
                                      >
                                        <div
                                          className="w-8 h-10 scale-[1.7] relative -top-0.5"
                                          style={{
                                            backgroundImage: `url(/char_${c.spriteIndex}.png)`,
                                            backgroundPosition: "16.66% 0%",
                                            backgroundSize: "700% 300%",
                                            imageRendering: "pixelated",
                                          }}
                                        />
                                      </div>
                                      {c.isProcessingTask && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                                      )}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[13px] font-semibold text-slate-100 tracking-tight">
                                        {c.name}
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        {c.profession}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-2 pr-2">
                                    <span
                                      className={`text-[10px] font-medium tracking-wide ${c.isProcessingTask ? "text-indigo-400" : "text-slate-500"}`}
                                    >
                                      {c.isProcessingTask ? "Working" : "Idle"}
                                    </span>
                                    {c.isProcessingTask && (
                                      <div className="flex gap-1">
                                        {Array.from({ length: 3 }).map(
                                          (_, idx) => (
                                            <div
                                              key={idx}
                                              className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"
                                              style={{
                                                animationDelay: `${idx * 150}ms`,
                                              }}
                                            ></div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Log Ticker */}
                          <div className="mt-auto pt-6 border-t border-slate-800/60 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Terminal size={12} />
                                <span className="font-sans text-[11px] font-medium tracking-wide">
                                  Office Log
                                </span>
                              </div>
                              <button
                                onClick={() => setShowCabinetMenu(true)}
                                className="text-[10px] font-medium text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                              >
                                Archives <ChevronRight size={10} />
                              </button>
                            </div>
                            <div className="bg-slate-800/30 border border-slate-800/60 p-4 rounded-xl relative overflow-hidden">
                              <div className="h-24 overflow-hidden relative font-sans text-[11px] leading-relaxed">
                                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#13161f] to-transparent pointer-events-none z-10"></div>
                                <div className="space-y-2 text-slate-400">
                                  {cabinetLogs.slice(-6).map((l, i) => (
                                    <div
                                      key={i}
                                      className="truncate hover:text-slate-200 transition-colors flex gap-3"
                                    >
                                      <span className="text-slate-500 shrink-0 tabular-nums">
                                        [
                                        {new Date(
                                          l.timestamp,
                                        ).toLocaleTimeString([], {
                                          hour12: false,
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                        ]
                                      </span>
                                      <span className="truncate">
                                        {l.message}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="text-slate-500 italic">
                                    Waiting for events...
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {hudTab === "roster" && (
                        <motion.div
                          key="roster"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "circOut" }}
                          className="flex flex-col gap-6"
                        >
                          <div className="flex justify-between items-center bg-[#090b0f] border border-white/5 p-6 rounded-xl relative overflow-hidden group/recruit shadow-sm">
                            <div className="absolute inset-0 bg-indigo-600/[0.02] opacity-0 group-hover/recruit:opacity-100 transition-opacity pointer-events-none"></div>
                            <div className="flex flex-col gap-1 relative z-10">
                              <span className="font-sans text-[12px] text-indigo-400 font-semibold tracking-wide">
                                Team Expansion
                              </span>
                              <span className="text-[10px] font-sans text-slate-500 font-medium">
                                Recruiting: Open Headcount
                              </span>
                            </div>
                            <button
                              onClick={() => setShowHireMenu(true)}
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-[12px] font-medium transition-all relative overflow-hidden group/btn shadow-[0_4px_10px_rgba(79,70,229,0.3)] active:scale-95 rounded-lg border border-indigo-500/50"
                            >
                              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 slant-glow"></div>
                              + Onboard Staff
                            </button>
                          </div>

                          <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {characterList.map((c, i) => (
                              <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => {
                                  gameStateRef.current.selectedId = c.id;
                                  setSelectedAgentId(c.id);
                                }}
                                className={`flex items-center gap-5 p-5 border cursor-pointer transition-all rounded-xl relative group/card shadow-sm ${
                                  selectedAgentId === c.id
                                    ? "bg-indigo-600/[0.05] border-indigo-500/30"
                                    : "bg-[#090b0f] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                                }`}
                              >
                                {selectedAgentId === c.id && (
                                  <motion.div
                                    layoutId="selectedCard"
                                    className="absolute inset-0 border border-indigo-500/30 rounded-xl"
                                    transition={{
                                      type: "spring",
                                      bounce: 0.2,
                                      duration: 0.6,
                                    }}
                                  />
                                )}

                                <div className="w-14 h-14 bg-black border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden group/sprite shrink-0 shadow-lg">
                                  <div
                                    className="w-10 h-10 scale-[2.2] relative top-1 transition-transform group-hover/sprite:scale-[2.4]"
                                    style={{
                                      backgroundImage: `url(/char_${c.spriteIndex}.png)`,
                                      backgroundPosition: "16.66% 0%",
                                      backgroundSize: "700% 300%",
                                      imageRendering: "pixelated",
                                    }}
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 h-1.5 transition-all bg-blue-500/30"></div>
                                </div>

                                <div className="flex-1 flex flex-col gap-1.5 relative z-10">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-display font-medium text-white/90 tracking-tight group-hover/card:text-white transition-colors">
                                      {c.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-colors ${selectedAgentId === c.id ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-white/5 text-white/20 border-white/5"}`}
                                      >
                                        {c.state}
                                      </span>
                                      {selectedAgentId === c.id && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[8px] font-mono text-blue-400/40 uppercase font-black tracking-[0.2em]">
                                      {c.profession}
                                    </span>
                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        className="h-full rounded-full bg-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                                      />
                                    </div>
                                  </div>

                                  {/* AI Settings Section */}
                                  <AnimatePresence>
                                    {selectedAgentId === c.id && (
                                      <motion.div
                                        initial={{
                                          height: 0,
                                          opacity: 0,
                                          marginTop: 0,
                                        }}
                                        animate={{
                                          height: "auto",
                                          opacity: 1,
                                          marginTop: 16,
                                        }}
                                        exit={{
                                          height: 0,
                                          opacity: 0,
                                          marginTop: 0,
                                        }}
                                        className="overflow-hidden bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col gap-4"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                          <Cpu
                                            size={10}
                                            className="text-blue-400"
                                          />
                                          <span className="text-[8px] font-mono font-black uppercase tracking-[0.3em] text-white/40">
                                            Neural_Model_Link
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                          <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                              <label className="text-[7px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                                                <Thermometer size={8} />{" "}
                                                Temperature
                                              </label>
                                              <span className="text-[10px] font-mono text-blue-400/80 font-bold">
                                                {c.aiConfig.temperature.toFixed(
                                                  1,
                                                )}
                                              </span>
                                            </div>
                                            <input
                                              type="range"
                                              min="0"
                                              max="1"
                                              step="0.1"
                                              value={c.aiConfig.temperature}
                                              onChange={(e) => {
                                                c.aiConfig.temperature =
                                                  parseFloat(e.target.value);
                                                setCharacterList([
                                                  ...gameStateRef.current
                                                    .characters,
                                                ]);
                                              }}
                                              className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500"
                                            />
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-2">
                                              <div className="flex items-center justify-between">
                                                <label className="text-[7px] font-mono text-white/20 uppercase tracking-widest">
                                                  Top_P
                                                </label>
                                                <span className="text-[9px] font-mono text-white/40">
                                                  {c.aiConfig.topP.toFixed(2)}
                                                </span>
                                              </div>
                                              <input
                                                type="range"
                                                min="0.1"
                                                max="1"
                                                step="0.05"
                                                value={c.aiConfig.topP}
                                                onChange={(e) => {
                                                  c.aiConfig.topP = parseFloat(
                                                    e.target.value,
                                                  );
                                                  setCharacterList([
                                                    ...gameStateRef.current
                                                      .characters,
                                                  ]);
                                                }}
                                                className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-white/20"
                                              />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                              <div className="flex items-center justify-between">
                                                <label className="text-[7px] font-mono text-white/20 uppercase tracking-widest">
                                                  Top_K
                                                </label>
                                                <span className="text-[9px] font-mono text-white/40">
                                                  {c.aiConfig.topK}
                                                </span>
                                              </div>
                                              <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                step="1"
                                                value={c.aiConfig.topK}
                                                onChange={(e) => {
                                                  c.aiConfig.topK = parseInt(
                                                    e.target.value,
                                                  );
                                                  setCharacterList([
                                                    ...gameStateRef.current
                                                      .characters,
                                                  ]);
                                                }}
                                                className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-white/20"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex flex-col gap-2">
                                            <label className="text-[7px] font-mono text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                                              <Box size={8} /> Deploy_Engine
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                              {[
                                                "gemini-3-flash-preview",
                                                "gemini-3.1-pro-preview",
                                                "gemini-3.1-flash-lite",
                                              ].map((m) => (
                                                <button
                                                  key={m}
                                                  onClick={() => {
                                                    c.aiConfig.model = m;
                                                    setCharacterList([
                                                      ...gameStateRef.current
                                                        .characters,
                                                    ]);
                                                  }}
                                                  className={`px-3 py-1.5 rounded-md border font-mono text-[8px] transition-all ${
                                                    c.aiConfig.model === m
                                                      ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                                                      : "bg-white/5 border-white/5 text-white/20 hover:text-white/40"
                                                  }`}
                                                >
                                                  {m
                                                    .replace("gemini-", "")
                                                    .toUpperCase()}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {hudTab === "relay" && (
                        <motion.div
                          key="relay"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "circOut" }}
                          className="flex flex-col gap-6"
                        >
                          <div className="bg-[#151619] border border-[#2A2B32] p-5 rounded-xl flex flex-col relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.15)] group/relaypanel">
                            {/* Background hardware lines */}
                            <div
                              className="absolute inset-0 opacity-[0.03] pointer-events-none"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 4px)",
                              }}
                            ></div>

                            {/* Header block with solid dividers */}
                            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2A2B32] relative z-10">
                              <div className="flex flex-col gap-1.5">
                                <label className="font-mono text-[11px] text-white uppercase tracking-[0.2em] font-medium flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-[#FF4444] rounded-full shadow-[0_0_8px_rgba(255,68,68,0.6)]"></span>
                                  Transmission Priority
                                </label>
                                <span className="text-[10px] text-[#8E9299] font-mono tracking-wider uppercase">
                                  Global_Grid_Directive / Config
                                </span>
                              </div>
                              <div className="flex p-0.5 bg-[#0D0E12] border border-[#2A2B32] rounded-md shadow-inner">
                                {(["high", "medium", "low"] as const).map(
                                  (p) => (
                                    <button
                                      key={p}
                                      onClick={() => setBroadcastPriority(p)}
                                      className={`px-5 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all rounded-[4px] ${
                                        broadcastPriority === p
                                          ? "bg-[#2A2B32] text-white shadow-sm"
                                          : "text-[#8E9299] hover:text-[#E6E6E6]"
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>

                            {/* Payload Block */}
                            <div className="space-y-4 relative z-10 mb-6">
                              <div className="flex items-center justify-between ml-1">
                                <label className="font-mono text-[10px] text-[#8E9299] uppercase tracking-widest flex items-center gap-2">
                                  Payload_Construction // INPUT
                                </label>
                                <span className="font-mono text-[9px] text-[#8E9299] tracking-widest">
                                  [CTRL+ENTER] TO SYNC
                                </span>
                              </div>
                              <div className="relative group/input">
                                <textarea
                                  placeholder="Construct Global Protocol... (System awaits instruction)"
                                  className="w-full bg-[#0D0E12] border border-[#2A2B32] rounded-lg p-5 text-[13px] h-36 focus:outline-none focus:border-[#4A4B52] text-white font-mono leading-relaxed transition-all placeholder:text-[#8E9299]/50 shadow-inner resize-none"
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" &&
                                      (e.ctrlKey || e.metaKey)
                                    ) {
                                      const text = (
                                        e.target as HTMLTextAreaElement
                                      ).value;
                                      if (text.trim()) {
                                        characterList.forEach((c, idx) => {
                                          setTimeout(() => {
                                            assignTaskToAgent(
                                              c.id,
                                              text,
                                              broadcastPriority,
                                            );
                                          }, idx * 1000);
                                        });
                                        (
                                          e.target as HTMLTextAreaElement
                                        ).value = "";
                                        window.dispatchEvent(
                                          new CustomEvent("addCabinetLog", {
                                            detail: `[GLOBAL_RELAY]: Directive Transmitted to Grid (P:${broadcastPriority.toUpperCase()})`,
                                          }),
                                        );
                                      }
                                    }
                                  }}
                                />
                                {/* Sub-label inside input */}
                                <div className="absolute right-3 bottom-3 flex items-center gap-2 opacity-50 pointer-events-none group-focus-within/input:opacity-100 transition-opacity">
                                  <kbd className="font-mono text-[9px] border border-[#2A2B32] rounded px-1 text-[#8E9299]">
                                    RDY
                                  </kbd>
                                </div>
                              </div>
                            </div>

                            {/* Hardware status block */}
                            <div className="p-4 bg-[#0D0E12] border border-[#2A2B32] rounded-lg flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 border border-dashed border-[#8E9299]/50 rounded-full flex items-center justify-center text-[#8E9299]">
                                  <Radio size={16} />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[11px] font-medium text-white uppercase tracking-widest font-mono">
                                    Neural Broadcaster
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.4)]"></div>
                                    <span className="text-[9px] text-[#8E9299] uppercase tracking-widest font-mono">
                                      Mode: Global_Burst_Ready
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex -space-x-1 pl-4 border-l border-[#2A2B32]">
                                {characterList.slice(0, 4).map((c, i) => (
                                  <div
                                    key={i}
                                    className="w-8 h-8 border border-[#2A2B32] bg-[#151619] overflow-hidden relative rounded-full shadow-sm hover:-translate-y-1 transition-transform cursor-help group/mini"
                                    title={c.name}
                                  >
                                    <div
                                      className="w-full h-full scale-[2.2] relative top-1"
                                      style={{
                                        backgroundImage: `url(/char_${c.spriteIndex}.png)`,
                                        backgroundPosition: "16.66% 0%",
                                        backgroundSize: "700% 300%",
                                        imageRendering: "pixelated",
                                      }}
                                    />
                                  </div>
                                ))}
                                {characterList.length > 4 && (
                                  <div className="w-8 h-8 bg-[#2A2B32] border border-[#151619] rounded-full flex items-center justify-center font-mono text-[9px] text-white">
                                    +{characterList.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          <OfficeCanvas
            gameStateData={gameStateRef.current}
            onSelectAgent={(id) => {
              gameStateRef.current.selectedId = id;
              setSelectedAgentId(id);
            }}
            onCabinetClick={() => setShowCabinetMenu(true)}
          />
        </main>

        {/* Sidebar Container */}
        <div className="absolute top-0 right-0 h-full z-50">
          <ChatSidebar
            agent={selectedAgent}
            allAgents={gameStateRef.current.characters}
            onClose={() => {
              gameStateRef.current.selectedId = null;
              setSelectedAgentId(null);
            }}
            onAssignTask={handleAssignTask}
            messages={selectedAgentId ? chats[selectedAgentId] || [] : []}
            isLoading={selectedAgentId ? !!loadingMap[selectedAgentId] : false}
          />
        </div>

        {/* Hire Menu Overlay */}
        <AnimatePresence>
          {showHireMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#020305]/90 backdrop-blur-xl z-[100] flex items-center justify-center pointer-events-auto p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-[500px] bg-[#0c0e12]/95 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] p-8 font-sans text-[#e0e0e0] rounded-[2.5rem] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/[0.03] rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex justify-between items-center mb-8 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>
                    <h2 className="font-display text-[13px] font-medium uppercase tracking-[0.4em] text-white/90">
                      {recruitForm ? "Employee Data" : "Select Candidate"}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowHireMenu(false);
                      setRecruitForm(null);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {!recruitForm ? (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-4 relative">
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const names = [
                          "Alice",
                          "Bob",
                          "Charlie",
                          "Diana",
                          "Eve",
                          "Frank",
                        ];
                        return (
                          <motion.button
                            key={idx}
                            whileHover={{ y: -4 }}
                            onClick={() => startRecruit(idx, names[idx])}
                            className="bg-[#090b0f] border border-white/5 hover:border-indigo-500/30 p-5 rounded-3xl transition-all flex flex-col items-center gap-4 group shadow-sm"
                          >
                            <div className="w-20 h-20 bg-black/40 border border-white/5 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center shadow-inner group-hover:bg-indigo-500/10 transition-colors">
                              <div
                                className="w-12 h-16 relative top-1 transition-transform duration-500 group-hover:scale-110"
                                style={{
                                  backgroundImage: `url(/char_${idx}.png)`,
                                  backgroundPosition: "16.66% 0%",
                                  backgroundSize: "700% 300%",
                                  backgroundRepeat: "no-repeat",
                                  imageRendering: "pixelated",
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-indigo-400 transition-colors">
                              {names[idx]}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans font-medium text-center p-4 bg-[#090b0f] rounded-2xl border border-white/5 shadow-inner">
                      Select a candidate to onboard into the workspace.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 font-sans text-[12px] relative z-10 text-slate-200">
                    <div className="flex items-center gap-6 mb-2">
                      <div className="w-24 h-24 bg-[#090b0f] border border-white/5 rounded-3xl overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                        <div
                          className="w-14 h-20 relative top-1"
                          style={{
                            backgroundImage: `url(/char_${recruitForm.idx}.png)`,
                            backgroundPosition: "16.66% 0%",
                            backgroundSize: "700% 300%",
                            backgroundRepeat: "no-repeat",
                            imageRendering: "pixelated",
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-slate-400 mb-2 text-[10px] uppercase tracking-wide font-semibold">
                          Name
                        </label>
                        <input
                          type="text"
                          value={recruitForm.name}
                          onChange={(e) =>
                            setRecruitForm({
                              ...recruitForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full bg-[#090b0f] border border-white/10 rounded-2xl px-5 py-3 text-slate-200 text-sm focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-2 text-[10px] uppercase tracking-wide font-semibold">
                          Profession
                        </label>
                        <input
                          type="text"
                          value={recruitForm.profession}
                          onChange={(e) =>
                            setRecruitForm({
                              ...recruitForm,
                              profession: e.target.value,
                            })
                          }
                          className="w-full bg-[#090b0f] border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-2 text-[10px] uppercase tracking-wide font-semibold">
                          Personality Type
                        </label>
                        <input
                          type="text"
                          value={recruitForm.mbti}
                          onChange={(e) =>
                            setRecruitForm({
                              ...recruitForm,
                              mbti: e.target.value,
                            })
                          }
                          className="w-full bg-[#090b0f] border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-[10px] uppercase tracking-wide font-semibold">
                        Work Philosophy
                      </label>
                      <input
                        type="text"
                        value={recruitForm.stance}
                        onChange={(e) =>
                          setRecruitForm({
                            ...recruitForm,
                            stance: e.target.value,
                          })
                        }
                        className="w-full bg-[#090b0f] border border-white/10 rounded-xl px-4 py-2.5 focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-[10px] uppercase tracking-wide font-semibold">
                        Bio / Notes
                      </label>
                      <textarea
                        value={recruitForm.bio}
                        onChange={(e) =>
                          setRecruitForm({
                            ...recruitForm,
                            bio: e.target.value,
                          })
                        }
                        className="w-full bg-[#090b0f] border border-white/10 rounded-xl px-4 py-3 resize-none h-20 focus:border-indigo-500/50 outline-none transition-all font-sans leading-relaxed shadow-inner"
                      />
                    </div>
                    <div className="space-y-4 pt-4 border-t border-white/5 mt-2">
                      <label className="block text-slate-400 text-[10px] uppercase tracking-wide font-semibold">
                        Model Parameters
                      </label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-white/40">
                            <span>Temp</span>
                            <span className="text-white/80">
                              {recruitForm.temperature.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.05"
                            value={recruitForm.temperature}
                            onChange={(e) =>
                              setRecruitForm({
                                ...recruitForm,
                                temperature: parseFloat(e.target.value),
                              })
                            }
                            className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-white/40">
                            <span>Top P</span>
                            <span className="text-white/80">
                              {recruitForm.topP.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={recruitForm.topP}
                            onChange={(e) =>
                              setRecruitForm({
                                ...recruitForm,
                                topP: parseFloat(e.target.value),
                              })
                            }
                            className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-white/40">
                            <span>Top K</span>
                            <span className="text-white/80">
                              {recruitForm.topK}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={recruitForm.topK}
                            onChange={(e) =>
                              setRecruitForm({
                                ...recruitForm,
                                topK: parseInt(e.target.value),
                              })
                            }
                            className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <button
                        onClick={handleHireWorker}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all uppercase tracking-[0.3em] text-[11px] shadow-lg shadow-indigo-600/20 active:scale-[0.98] hover:shadow-indigo-500/40 border border-white/5 hover:border-white/20"
                      >
                        Hire Worker
                      </button>
                      <button
                        onClick={() => setRecruitForm(null)}
                        className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 font-bold py-4 rounded-2xl transition-all uppercase tracking-[0.3em] text-[11px] border border-white/5 active:scale-[0.98]"
                      >
                        Abort
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCabinetMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#020305]/95 backdrop-blur-2xl z-[100] flex items-center justify-center pointer-events-auto p-4"
            >
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                className="w-full max-w-[900px] h-[700px] bg-[#0c0e12]/90 border border-white/10 shadow-[0_50px_120px_rgba(0,0,0,0.9)] flex flex-col rounded-[3rem] relative overflow-hidden"
              >
                <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/[0.02] rounded-full blur-[120px] pointer-events-none"></div>

                <div className="p-10 pb-6 flex justify-between items-center relative">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-white/20 rounded-full border border-white/40"></div>
                    <h2 className="font-display text-sm font-medium uppercase tracking-[0.5em] text-white/90">
                      Filing Cabinet
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowCabinetMenu(false)}
                    className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex gap-4 px-10 pb-4 border-b border-white/5 relative">
                  {[
                    {
                      id: "logs",
                      label: "Activity_Logs",
                      icon: <Terminal size={14} />,
                    },
                    {
                      id: "files",
                      label: "Documents",
                      icon: <Database size={14} />,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCabinetTab(tab.id as any)}
                      className={`flex items-center gap-3 px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.3em] transition-all rounded-2xl border ${
                        cabinetTab === tab.id
                          ? "text-white bg-emerald-600/10 border-emerald-500/30 shadow-inner"
                          : "text-white/20 hover:text-white/50 border-transparent hover:bg-white/5"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-10 pt-8 scrollbar-thin grid-bg">
                  <div className="space-y-4">
                    {cabinetTab === "logs" ? (
                      <div className="space-y-6">
                        {/* Advanced Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.03] border border-white/10 p-6 rounded-[2rem]">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-sans font-medium text-slate-500 ml-4">
                              Search Query
                            </span>
                            <div className="relative">
                              <Terminal
                                size={12}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20"
                              />
                              <input
                                type="text"
                                placeholder="Search records..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="w-full bg-[#090b0f] border border-white/5 rounded-xl pl-12 pr-6 py-3.5 text-xs text-slate-300 outline-none focus:border-emerald-500/30 transition-all shadow-inner"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-sans font-medium text-slate-500 ml-4">
                              Staff Member
                            </span>
                            <select
                              value={logAgentFilter}
                              onChange={(e) =>
                                setLogAgentFilter(e.target.value)
                              }
                              className="w-full bg-[#090b0f] border border-white/5 rounded-xl px-6 py-3.5 text-xs text-slate-300 outline-none focus:border-emerald-500/30 transition-all appearance-none shadow-inner"
                            >
                              <option value="all">Entire Office</option>
                              {characterList.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-sans font-medium text-slate-500 ml-4">
                              Date Range
                            </span>
                            <div className="flex gap-2">
                              <input
                                type="date"
                                value={logDateRange.start}
                                onChange={(e) =>
                                  setLogDateRange({
                                    ...logDateRange,
                                    start: e.target.value,
                                  })
                                }
                                className="flex-1 bg-[#090b0f] border border-white/5 rounded-xl px-4 py-3.5 text-[11px] text-slate-300 outline-none focus:border-emerald-500/30 transition-all shadow-inner"
                              />
                              <input
                                type="date"
                                value={logDateRange.end}
                                onChange={(e) =>
                                  setLogDateRange({
                                    ...logDateRange,
                                    end: e.target.value,
                                  })
                                }
                                className="flex-1 bg-[#090b0f] border border-white/5 rounded-xl px-4 py-3.5 text-[11px] text-slate-300 outline-none focus:border-emerald-500/30 transition-all shadow-inner"
                              />
                            </div>
                          </div>
                        </div>

                        {cabinetLogs.filter((log) => {
                          const matchesSearch = log.message
                            .toLowerCase()
                            .includes(logSearch.toLowerCase());
                          const matchesAgent =
                            logAgentFilter === "all" ||
                            (log.agent && log.agent === logAgentFilter) ||
                            log.message
                              .toLowerCase()
                              .includes(logAgentFilter.toLowerCase());

                          let matchesDate = true;
                          if (logDateRange.start) {
                            const start = new Date(
                              logDateRange.start,
                            ).getTime();
                            if (log.timestamp < start) matchesDate = false;
                          }
                          if (logDateRange.end) {
                            const end =
                              new Date(logDateRange.end).getTime() + 86400000;
                            if (log.timestamp > end) matchesDate = false;
                          }

                          return matchesSearch && matchesAgent && matchesDate;
                        }).length === 0 ? (
                          <div className="h-[300px] flex flex-col items-center justify-center gap-6 opacity-20">
                            <Terminal size={48} />
                            <span className="font-mono uppercase tracking-[0.5em] text-xs">
                              No_Activity_Matches
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {cabinetLogs
                              .filter((log) => {
                                const matchesSearch = log.message
                                  .toLowerCase()
                                  .includes(logSearch.toLowerCase());
                                const matchesAgent =
                                  logAgentFilter === "all" ||
                                  (log.agent && log.agent === logAgentFilter) ||
                                  log.message
                                    .toLowerCase()
                                    .includes(logAgentFilter.toLowerCase());

                                let matchesDate = true;
                                if (logDateRange.start) {
                                  const start = new Date(
                                    logDateRange.start,
                                  ).getTime();
                                  if (log.timestamp < start)
                                    matchesDate = false;
                                }
                                if (logDateRange.end) {
                                  const end =
                                    new Date(logDateRange.end).getTime() +
                                    86400000;
                                  if (log.timestamp > end) matchesDate = false;
                                }

                                return (
                                  matchesSearch && matchesAgent && matchesDate
                                );
                              })
                              .map((log, i) => (
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  key={i}
                                  className="p-8 glass-card rounded-[2.5rem] group flex gap-8 items-start border border-white/5 transition-all duration-300 hover:border-blue-500/20 hover:bg-white/[0.02]"
                                >
                                  <div className="flex flex-col items-center gap-3 shrink-0 pt-2">
                                    <div className="w-12 h-12 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center text-[10px] font-mono text-white/30 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all duration-500">
                                      {new Date(
                                        log.timestamp,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                    <div className="w-px flex-1 bg-gradient-to-b from-blue-500/20 to-transparent"></div>
                                  </div>
                                  <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`text-[10px] font-mono font-bold uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${
                                            log.agent
                                              ? "bg-blue-400/10 border-blue-400/20 text-blue-400"
                                              : "bg-white/10 border-white/10 text-white/40"
                                          }`}
                                        >
                                          {log.agent || "SYSTEM_CORE"}
                                        </span>
                                        <div className="h-4 w-px bg-white/5"></div>
                                        <div className="flex items-center gap-2">
                                          <Activity
                                            size={10}
                                            className="text-white/10"
                                          />
                                          <span
                                            className="text-[10px] font-mono text-white/10 uppercase tracking-widest"
                                            suppressHydrationWarning
                                          >
                                            {new Date(
                                              log.timestamp,
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-[8px] font-mono text-white/5 uppercase tracking-[0.4em]">
                                        Secure_Packet_{i + 1024}
                                      </div>
                                    </div>
                                    <div className="relative">
                                      <p className="font-mono text-[13px] text-white/50 leading-relaxed group-hover:text-white/90 transition-colors uppercase tracking-tight">
                                        <span className="text-blue-500/40 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          ►
                                        </span>
                                        {log.message}
                                      </p>
                                    </div>
                                    {log.message.includes("[BROADCAST]") && (
                                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-2 flex items-center gap-3">
                                        <Radio
                                          size={12}
                                          className="text-blue-400 animate-pulse"
                                        />
                                        <span className="text-[10px] font-mono text-blue-400/60 uppercase tracking-widest font-bold">
                                          NetworkWideDistributionActive
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* File Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.03] border border-white/10 p-6 rounded-[2rem]">
                          <div className="flex flex-col gap-2">
                            <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/20 font-bold ml-4">
                              Vault_Search
                            </span>
                            <div className="relative">
                              <Database
                                size={12}
                                className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20"
                              />
                              <input
                                type="text"
                                placeholder="Lookup assets..."
                                value={fileSearch}
                                onChange={(e) => setFileSearch(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-white outline-none focus:border-blue-500/30 transition-all font-mono"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/20 font-bold ml-4">
                              Author_Protocol
                            </span>
                            <select
                              value={fileAuthorFilter}
                              onChange={(e) =>
                                setFileAuthorFilter(e.target.value)
                              }
                              className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-3.5 text-xs text-white outline-none focus:border-blue-500/30 transition-all font-mono appearance-none"
                            >
                              <option value="all">ALL_AUTHORS</option>
                              <option value="User">USER_CORE</option>
                              {characterList.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {cabinetFiles.filter((f) => {
                          const matchesSearch =
                            f.name
                              .toLowerCase()
                              .includes(fileSearch.toLowerCase()) ||
                            f.data
                              .toLowerCase()
                              .includes(fileSearch.toLowerCase());
                          const matchesAuthor =
                            fileAuthorFilter === "all" ||
                            f.author === fileAuthorFilter;
                          return matchesSearch && matchesAuthor;
                        }).length === 0 ? (
                          <div className="h-[300px] flex flex-col items-center justify-center gap-6 opacity-20">
                            <Database size={48} />
                            <span className="font-mono uppercase tracking-[0.5em] text-xs">
                              No_Assets_Match
                            </span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {cabinetFiles
                              .filter((f) => {
                                const matchesSearch =
                                  f.name
                                    .toLowerCase()
                                    .includes(fileSearch.toLowerCase()) ||
                                  f.data
                                    .toLowerCase()
                                    .includes(fileSearch.toLowerCase());
                                const matchesAuthor =
                                  fileAuthorFilter === "all" ||
                                  f.author === fileAuthorFilter;
                                return matchesSearch && matchesAuthor;
                              })
                              .map((f, i) => (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  key={i}
                                  className="p-6 glass-card rounded-[2rem] group relative overflow-hidden"
                                >
                                  <div className="text-[10px] font-mono uppercase font-bold text-blue-400 mb-4 border-b border-white/10 pb-4 flex items-center justify-between text-glow">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full glow-blue"></div>
                                      <span>{f.name}</span>
                                    </div>
                                    <span className="text-white/10 font-normal">
                                      S_AUTH/{f.author}
                                    </span>
                                  </div>
                                  {f.type && f.type.startsWith("image/") ? (
                                    <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center p-3 group-hover:border-blue-500/20 transition-all shadow-2xl">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={f.data}
                                        alt={f.name}
                                        className="max-w-full h-auto max-h-48 rounded-xl object-contain transition-transform duration-500 group-hover:scale-105"
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-white/40 break-all bg-black/50 p-5 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed group-hover:text-white/60 transition-colors h-48 overflow-y-auto scrollbar-thin">
                                      {f.data}
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
