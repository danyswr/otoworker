"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Character, CharacterState } from "@/lib/office/worker/api/Character";
import {
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Brain,
  Radio,
  Dna,
  Zap,
  Send,
  Settings2,
  Trash2,
  Activity,
  Target,
  AlertTriangle,
  Terminal,
} from "lucide-react";

interface Message {
  role: "user" | "agent" | "system";
  content: string;
}

interface ChatSidebarProps {
  agent: Character | null;
  allAgents?: Character[];
  onClose: () => void;
  onAssignTask: (task: string, priority: "high" | "medium" | "low") => void;
  messages: Message[];
  isLoading: boolean;
}

export function ChatSidebar({
  agent,
  allAgents = [],
  onClose,
  onAssignTask,
  messages,
  isLoading,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "profile" | "core">(
    "chat",
  );
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    profession: "",
    mbti: "",
    stance: "",
    bio: "",
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
  });
  const [goalOverrideInput, setGoalOverrideInput] = useState("");
  const [isOverridingGoal, setIsOverridingGoal] = useState(false);
  const [isEditingNetwork, setIsEditingNetwork] = useState(false);
  const [networkTargetName, setNetworkTargetName] = useState("");
  const [networkAffinity, setNetworkAffinity] = useState(0);
  const [networkNotes, setNetworkNotes] = useState("");
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryFilter, setMemoryFilter] = useState<
    "all" | "interaction" | "fact" | "outcome"
  >("all");

  // Reset form when agent changes
  useEffect(() => {
    if (agent) {
      setEditData({
        name: agent.name,
        profession: agent.profession,
        mbti: agent.mbti,
        stance: agent.stance,
        bio: agent.bio,
        temperature: agent.aiConfig?.temperature ?? 0.7,
        topP: agent.aiConfig?.topP ?? 0.9,
        topK: agent.aiConfig?.topK ?? 40,
      });
      setIsEditingProfile(false);
      setGoalOverrideInput(agent.currentGoal || "");
      setIsOverridingGoal(false);
    }
  }, [agent]);

  const handleGoalOverride = () => {
    if (agent && goalOverrideInput.trim()) {
      const oldGoal = agent.currentGoal;
      agent.currentGoal = goalOverrideInput.trim();
      window.dispatchEvent(new CustomEvent("forceUpdateUi"));
      window.dispatchEvent(
        new CustomEvent("addCabinetLog", {
          detail: `[ADMIN_OVERRIDE]: ${agent.name}'s priority directive modified by Command Center. PREVIOUS: "${oldGoal || "NONE"}" NEW: "${agent.currentGoal}"`,
        }),
      );
      setIsOverridingGoal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAssignTask(input.trim(), priority);
    setInput("");
  };

  const saveProfile = () => {
    if (agent) {
      agent.name = editData.name;
      agent.profession = editData.profession;
      agent.mbti = editData.mbti;
      agent.stance = editData.stance;
      agent.bio = editData.bio;
      if (!agent.aiConfig)
        agent.aiConfig = {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          model: "gemini-3-flash-preview",
        };
      agent.aiConfig.temperature = editData.temperature;
      agent.aiConfig.topP = editData.topP;
      agent.aiConfig.topK = editData.topK;
      setIsEditingProfile(false);
      window.dispatchEvent(new CustomEvent("forceUpdateUi"));
    }
  };

  const handleTerminate = () => {
    if (agent) {
      const event = new CustomEvent("fireWorker");
      window.dispatchEvent(event);
      setShowTerminateConfirm(false);
      onClose();
    }
  };

  const handleSaveNetworkNode = () => {
    if (agent && networkTargetName) {
      if (!agent.relationships) {
        agent.relationships = {};
      }
      if (!agent.relationships[networkTargetName]) {
        agent.relationships[networkTargetName] = {
          affinity: networkAffinity,
          notes: networkNotes,
        };
      } else {
        agent.relationships[networkTargetName].affinity = networkAffinity;
        agent.relationships[networkTargetName].notes = networkNotes;
      }
      setIsEditingNetwork(false);
      setNetworkTargetName("");
      setNetworkAffinity(0);
      setNetworkNotes("");
      window.dispatchEvent(new CustomEvent("forceUpdateUi"));
    }
  };

  const tabs = [
    { id: "chat", label: "Link", icon: <Radio size={14} /> },
    { id: "profile", label: "Intel", icon: <User size={14} /> },
    { id: "core", label: "Core", icon: <Brain size={14} /> },
  ] as const;

  const sidebarVariants = {
    hidden: { x: 420, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 280,
        damping: 28,
        mass: 1.1,
      },
    },
    exit: { x: 420, opacity: 0, transition: { duration: 0.25 } },
  };

  return (
    <>
      <AnimatePresence>
        {isMinimized && agent && (
          <motion.button
            key="minimized-toggle"
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className="fixed right-4 top-12 z-[100] glass-panel rounded-2xl p-3 pl-5 text-foreground-muted hover:text-foreground backdrop-blur-xl shadow-2xl transition-all duration-300 group flex items-center gap-3.5 cursor-pointer hover:bg-surface-elevated/40 border-primary/10 hover:border-primary/25"
          >
            <ChevronLeft
              size={15}
              className="group-hover:-translate-x-1.5 transition-transform text-primary/60 group-hover:text-primary/100"
            />
            <div className="flex items-center gap-3 border-l border-white/[0.08] pl-3">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono uppercase tracking-wider text-primary/50 leading-tight">
                  Active
                </span>
                <span className="text-[12px] font-semibold font-display text-foreground leading-tight">
                  {agent.name}
                </span>
              </div>
              <div className="w-8 h-8 bg-surface rounded-xl overflow-hidden relative flex items-center justify-center border border-white/[0.08] shadow-lg">
                <div
                  className="w-6 h-8 scale-[1.5]"
                  style={{
                    backgroundImage: `url(/char_${agent.spriteIndex}.png)`,
                    backgroundPosition: "16.666% 0%",
                    backgroundSize: "700% 300%",
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                  }}
                />
                <div
                  className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-surface shadow-md ${agent?.state === CharacterState.WORK ? "bg-success status-pulse" : agent?.state === CharacterState.IDLE ? "bg-foreground-muted/60" : "bg-primary"}`}
                ></div>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isMinimized && !!agent && (
          <motion.div
            key="sidebar"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={sidebarVariants}
            className="fixed right-2 sm:right-4 top-2 sm:top-4 bottom-2 sm:bottom-4 w-[calc(100%-16px)] sm:w-[420px] md:w-[420px] lg:w-[440px] glass-panel flex flex-col font-sans text-foreground z-[100] rounded-2xl sm:rounded-3xl overflow-hidden gradient-border max-h-screen shadow-2xl"
          >
            <div className="flex flex-col h-full overflow-hidden bg-transparent">
              <>
                {/* Profile Header */}
                <div className="px-6 pt-6 pb-4 relative shrink-0 flex flex-col gap-5 border-b border-white/[0.05]">
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex gap-4">
                      <div className="relative group shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary/20 via-surface-elevated to-surface border border-primary/20 rounded-2xl overflow-hidden relative flex items-center justify-center z-10 shadow-lg backdrop-blur-md glow-blue">
                          <div
                            className="w-10 h-12 scale-[1.5] translate-y-1"
                            style={{
                              backgroundImage: `url(/char_${agent.spriteIndex}.png)`,
                              backgroundPosition: "16.666% 0%",
                              backgroundSize: "700% 300%",
                              backgroundRepeat: "no-repeat",
                              imageRendering: "pixelated",
                            }}
                          />
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[2.5px] z-20 shadow-md ${agent?.state === CharacterState.WORK ? "bg-success border-surface status-pulse" : agent?.state === CharacterState.IDLE ? "bg-foreground-muted/70 border-surface" : "bg-primary border-surface status-pulse"}`}
                        ></div>
                      </div>
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <h2 className="text-[17px] font-bold font-display tracking-tight text-foreground mb-1 flex items-center gap-2 flex-wrap">
                          {agent.name}
                          <span
                            className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${agent?.state === CharacterState.WORK ? "text-success bg-success/10 border border-success/20" : "text-foreground-muted bg-white/[0.04] border border-white/[0.08]"}`}
                          >
                            {agent.state}
                          </span>
                        </h2>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-primary/80 font-medium tracking-wide">
                            {agent.profession}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1.5 shadow-inner">
                      <button
                        onClick={() => setShowTerminateConfirm(true)}
                        className="p-1.5 text-foreground-muted/70 hover:text-error hover:bg-error/15 rounded-lg transition-all duration-200 hover:glow-blue"
                        title="Terminate"
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1.5 text-foreground-muted/70 hover:text-foreground hover:bg-primary/10 rounded-lg transition-all duration-200"
                        title="Minimize"
                      >
                        <ChevronRight size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={onClose}
                        className="p-1.5 text-foreground-muted/70 hover:text-foreground hover:bg-primary/10 rounded-lg transition-all duration-200"
                        title="Close"
                      >
                        <X size={14} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>

                  {/* Premium Tabs */}
                  <div className="flex gap-2.5">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <motion.button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 border tab-pill ${
                            isActive
                              ? "tab-pill-active bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                              : "bg-white/[0.03] border-white/[0.06] text-foreground-muted/70 hover:text-foreground-muted hover:bg-white/[0.05] hover:border-white/[0.1]"
                          }`}
                        >
                          <div className={`transition-colors ${isActive ? "text-primary drop-shadow-md" : "text-foreground-muted/60"}`}>
                            {tab.icon}
                          </div>
                          <span className={`text-[11px] font-semibold tracking-wide transition-colors ${isActive ? "text-primary" : ""}`}>
                            {tab.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Main Tab View */}
                <div className="flex-1 flex flex-col min-h-0 bg-transparent relative">
                  {/* Terminate Confirmation Overlay */}
                  <AnimatePresence>
                    {showTerminateConfirm && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-[#0a0c10]/95 backdrop-blur-md p-8 flex flex-col items-center justify-center text-center"
                      >
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.9, opacity: 0, y: 20 }}
                          className="w-full max-w-xs space-y-8"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                              <AlertTriangle size={32} />
                            </div>
                            <div>
                              <h3 className="text-lg font-display text-white uppercase tracking-[0.2em] mb-2 font-bold">
                                Terminate_Employment
                              </h3>
                              <p className="text-[11px] font-mono text-foreground-muted/50 leading-relaxed uppercase tracking-widest">
                                Permanently fire{" "}
                                <span className="text-red-400 font-bold">
                                  {agent?.name}
                                </span>
                                ? This action is irreversible.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <button
                              onClick={handleTerminate}
                              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-mono text-[10px] font-bold uppercase tracking-[0.3em] transition-all shadow-[0_10px_30px_rgba(220,38,38,0.2)] active:scale-95 border border-white/10"
                            >
                              Confirm_Firing
                            </button>
                            <button
                              onClick={() => setShowTerminateConfirm(false)}
                              className="w-full py-4 bg-white/5 hover:bg-white/10 text-foreground-muted/65 rounded-2xl font-mono text-[10px] uppercase tracking-[0.3em] transition-all border border-white/5"
                            >
                              Abort_Command
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {activeTab === "profile" && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-6"
                      >
                        {isEditingProfile ? (
                          <div className="flex flex-col gap-5">
                            <div className="space-y-4">
                              {[
                                { label: "Identifier", key: "name" },
                                { label: "Role", key: "profession" },
                                { label: "Logic_Type", key: "mbti" },
                                { label: "Priority_Stance", key: "stance" },
                              ].map((field) => (
                                <div key={field.key} className="space-y-1.5">
                                  <label className="text-[10px] font-medium text-slate-400 pl-1">
                                    {field.label}
                                  </label>
                                  <input
                                    type="text"
                                    value={(editData as any)[field.key]}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        [field.key]: e.target.value,
                                      })
                                    }
                                    className="w-full glass-input rounded-lg px-4 py-2.5 text-xs text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30 focus-ring outline-none transition-all placeholder:text-foreground-muted/40 shadow-inner"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-medium text-slate-400 capitalize pl-1">
                                Neural Background
                              </label>
                              <textarea
                                value={editData.bio}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    bio: e.target.value,
                                  })
                                }
                                className="w-full glass-input rounded-lg px-4 py-2.5 text-xs text-foreground h-24 resize-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 focus-ring outline-none transition-all placeholder:text-foreground-muted/40 shadow-inner"
                              />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                              <label className="text-[10px] font-medium text-slate-400 capitalize pl-1">
                                AI Parameters
                              </label>

                              <div className="bg-surface/40 border border-white/10 rounded-lg p-4 space-y-5">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Creativity (Temp)</span>
                                    <span className="text-white/90">
                                      {editData.temperature.toFixed(2)}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.05"
                                    value={editData.temperature}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        temperature: parseFloat(e.target.value),
                                      })
                                    }
                                    className="w-full accent-blue-500 bg-white/10 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.8)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Nucleus (Top P)</span>
                                    <span className="text-white/90">
                                      {editData.topP.toFixed(2)}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={editData.topP}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        topP: parseFloat(e.target.value),
                                      })
                                    }
                                    className="w-full accent-blue-500 bg-white/10 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.8)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Top K</span>
                                    <span className="text-white/90">
                                      {editData.topK}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={editData.topK}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        topK: parseInt(e.target.value),
                                      })
                                    }
                                    className="w-full accent-blue-500 bg-white/10 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.8)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={saveProfile}
                                className="flex-1 bg-white text-black hover:bg-gray-200 font-semibold py-2.5 rounded-md transition-all active:scale-[0.98] text-[11px] shadow-sm"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => setIsEditingProfile(false)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-md transition-all text-[11px] active:scale-[0.98] font-medium border border-white/5"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-end -mb-4 relative z-10">
                              <button
                                onClick={() => setIsEditingProfile(true)}
                                className="text-[10px] font-medium text-blue-400 hover:text-white px-3 py-1.5 bg-surface/40 rounded-lg border border-white/10 transition-colors shadow-sm"
                              >
                                Edit Profile
                              </button>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-px bg-white/[0.03] rounded-2xl overflow-hidden border border-white/[0.04]">
                              {[
                                {
                                  label: "Identifier",
                                  val: agent?.name || "Unknown",
                                },
                                {
                                  label: "Function",
                                  val: agent?.profession || "N/A",
                                },
                                {
                                  label: "Logic_Class",
                                  val: agent?.mbti || "N/A",
                                },
                                {
                                  label: "Ethos_Stance",
                                  val: agent?.stance || "N/A",
                                },
                                {
                                  label: "AI_Model",
                                  val: (
                                    agent?.aiConfig?.model ||
                                    "gemini-3-flash-preview"
                                  ).replace("gemini-", ""),
                                },
                              ].map((item, i) => (
                                <div
                                  key={i}
                                  className={`bg-surface/80 p-4 flex flex-col gap-1.5 ${item.label === "AI_Model" ? "col-span-2" : ""}`}
                                >
                                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                                    {item.label}
                                  </span>
                                  <span className="text-[11px] font-semibold text-white/85 uppercase tracking-wide truncate">
                                    {item.val}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Profile Bio */}
                            <div className="bg-white/[0.015] border border-white/[0.04] rounded-2xl p-4 relative group">
                              <div className="absolute inset-0 bg-indigo-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                              <p className="text-[11px] text-foreground-muted/60 leading-relaxed font-sans italic relative z-10">
                                {agent.bio ||
                                  "Encrypted dossier. No background signal detected."}
                              </p>
                            </div>

                            {/* Vital Signs */}
                            <div className="space-y-4 pt-2">
                              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                <Activity
                                  size={12}
                                  className="text-slate-500"
                                />
                                <span className="text-[10px] font-medium text-slate-400 capitalize tracking-wide">
                                  Neural Vitals
                                </span>
                              </div>

                              <div className="space-y-3.5">
                                {[
                                  {
                                    label: "System_Integrity",
                                    val: agent.health,
                                    color: "bg-[#10B981]",
                                  },
                                  {
                                    label: "Intelligence_Rating",
                                    val: agent.intelligence,
                                    color: "bg-indigo-500",
                                  },
                                ].map((stat, i) => (
                                  <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between items-end text-[9px] font-mono tracking-widest">
                                      <span className="text-foreground-muted/50 uppercase">
                                        {stat.label}
                                      </span>
                                      <span className="text-white/90 font-bold">
                                        {Math.round(stat.val)}%
                                      </span>
                                    </div>
                                    <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stat.val}%` }}
                                        className={`h-full ${stat.color} rounded-full`}
                                      ></motion.div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* AI Parameters Controls */}
                            <div className="space-y-4 pt-2 border-t border-white/10 mt-6">
                              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                <Settings2
                                  size={12}
                                  className="text-slate-500"
                                />
                                <span className="text-[10px] font-medium text-slate-400 capitalize tracking-wide">
                                  AI Parameter Matrix
                                </span>
                                <span className="ml-auto text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1.5 uppercase font-bold tracking-wider shadow-sm">
                                  <Zap size={8} />
                                  {agent.aiConfig?.model ||
                                    "gemini-3-flash-preview"}
                                </span>
                              </div>
                              <div className="space-y-5 bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner hover:border-white/10 transition-colors">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                    <span>Creativity (Temp)</span>
                                    <span className="text-white/90 font-mono">
                                      {(
                                        agent.aiConfig?.temperature ?? 0.7
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.05"
                                    value={agent.aiConfig?.temperature ?? 0.7}
                                    onChange={(e) => {
                                      if (!agent.aiConfig)
                                        agent.aiConfig = {
                                          temperature: 0.7,
                                          topP: 0.9,
                                          topK: 40,
                                          model: "gemini-3-flash-preview",
                                        };
                                      agent.aiConfig.temperature = parseFloat(
                                        e.target.value,
                                      );
                                      window.dispatchEvent(
                                        new CustomEvent("forceUpdateUi"),
                                      );
                                    }}
                                    className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(99,102,241,0.9)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-90 transition-all"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                    <span>Nucleus Sampling (Top P)</span>
                                    <span className="text-white/90 font-mono">
                                      {(agent.aiConfig?.topP ?? 0.9).toFixed(2)}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={agent.aiConfig?.topP ?? 0.9}
                                    onChange={(e) => {
                                      if (!agent.aiConfig)
                                        agent.aiConfig = {
                                          temperature: 0.7,
                                          topP: 0.9,
                                          topK: 40,
                                          model: "gemini-3-flash-preview",
                                        };
                                      agent.aiConfig.topP = parseFloat(
                                        e.target.value,
                                      );
                                      window.dispatchEvent(
                                        new CustomEvent("forceUpdateUi"),
                                      );
                                    }}
                                    className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(99,102,241,0.9)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-90 transition-all"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                    <span>Top K</span>
                                    <span className="text-white/90 font-mono">
                                      {agent.aiConfig?.topK ?? 40}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={agent.aiConfig?.topK ?? 40}
                                    onChange={(e) => {
                                      if (!agent.aiConfig)
                                        agent.aiConfig = {
                                          temperature: 0.7,
                                          topP: 0.9,
                                          topK: 40,
                                          model: "gemini-3-flash-preview",
                                        };
                                      agent.aiConfig.topK = parseInt(
                                        e.target.value,
                                      );
                                      window.dispatchEvent(
                                        new CustomEvent("forceUpdateUi"),
                                      );
                                    }}
                                    className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(99,102,241,0.9)] [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-90 transition-all"
                                  />
                                </div>
                                <div className="space-y-2 pt-3 border-t border-white/5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-white/90 font-medium tracking-wide">
                                        Autonomous Loop (Auto-Drive)
                                      </span>
                                      <span className="text-[9px] text-slate-500">
                                        Continuously self-prompt with output
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (!agent.aiConfig)
                                          agent.aiConfig = {
                                            temperature: 0.7,
                                            topP: 0.9,
                                            topK: 40,
                                            model: "gemini-3-flash-preview",
                                            autonomousLoop: false,
                                          };
                                        agent.aiConfig.autonomousLoop =
                                          !agent.aiConfig.autonomousLoop;
                                        window.dispatchEvent(
                                          new CustomEvent("forceUpdateUi"),
                                        );
                                      }}
                                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${agent.aiConfig?.autonomousLoop ? "bg-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.6)]" : "bg-white/10 border border-white/5"}`}
                                    >
                                      <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${agent.aiConfig?.autonomousLoop ? "translate-x-4" : "translate-x-0.5"}`}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Cognitive Buffer */}
                            <div className="space-y-4 pt-2 border-t border-white/10 mt-6">
                              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-3 h-3 text-emerald-500"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                                      />
                                    </svg>
                                    <span className="text-[10px] font-medium text-slate-400 capitalize tracking-wide">
                                      Cognitive Buffer
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-foreground-muted/60 bg-surface/40 px-1.5 py-0.5 rounded">
                                      {(agent.memory || []).length} TRACES
                                    </span>
                                    {agent.memory &&
                                      agent.memory.length > 0 && (
                                        <span className="text-[9px] font-mono text-emerald-500/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                          LATEST:{" "}
                                          {new Date(
                                            Math.max(
                                              ...agent.memory.map(
                                                (m: any) => m.timestamp,
                                              ),
                                            ),
                                          ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    agent.memory = [];
                                    window.dispatchEvent(
                                      new CustomEvent("forceUpdateUi"),
                                    );
                                  }}
                                  className="text-[9px] font-medium text-emerald-500 hover:text-white hover:bg-emerald-500/20 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md transition-all shadow-sm flex items-center gap-1.5 h-7"
                                >
                                  Flush Buffer
                                </button>
                              </div>

                              <div className="flex flex-col gap-2 pb-2">
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    placeholder="Search traces..."
                                    value={memorySearch}
                                    onChange={(e) =>
                                      setMemorySearch(e.target.value)
                                    }
                                    className="flex-1 bg-surface/40 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
                                  />
                                  <select
                                    value={memoryFilter}
                                    onChange={(e) =>
                                      setMemoryFilter(e.target.value as any)
                                    }
                                    className="bg-surface/40 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-emerald-500/50 [&>option]:bg-[#09090b] outline-none"
                                  >
                                    <option value="all">All Types</option>
                                    <option value="interaction">
                                      Interaction
                                    </option>
                                    <option value="fact">Fact</option>
                                    <option value="outcome">Outcome</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto scrollbar-thin pr-2 pb-4">
                                {!(agent.memory && agent.memory.length > 0) ? (
                                  <div className="text-center py-6 text-[10px] text-white/30 italic">
                                    Buffer empty
                                  </div>
                                ) : (
                                  [...(agent.memory || [])]
                                    .filter(
                                      (mem) =>
                                        memoryFilter === "all" ||
                                        mem.type === memoryFilter,
                                    )
                                    .filter(
                                      (mem) =>
                                        !memorySearch ||
                                        mem.content
                                          .toLowerCase()
                                          .includes(memorySearch.toLowerCase()),
                                    )
                                    .sort((a, b) => b.timestamp - a.timestamp)
                                    .map((mem) => (
                                      <div
                                        key={mem.id}
                                        className="bg-black/30 border border-white/5 rounded-lg p-3 flex flex-col gap-1.5 shadow-sm"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span
                                            className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                              mem.type === "interaction"
                                                ? "bg-blue-500/10 text-blue-500"
                                                : mem.type === "fact"
                                                  ? "bg-amber-500/10 text-amber-500"
                                                  : "bg-emerald-500/10 text-emerald-500"
                                            }`}
                                          >
                                            {mem.type}
                                          </span>
                                          <span className="text-[9px] text-white/30">
                                            {new Date(
                                              mem.timestamp,
                                            ).toLocaleTimeString()}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                                          {mem.content}
                                        </p>
                                      </div>
                                    ))
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}

                    {activeTab === "core" && (
                      <motion.div
                        key="core"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-6"
                      >
                        {/* Priority Directive */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                              <Zap size={12} className="text-amber-500" />
                              <span className="text-[10px] font-medium text-slate-400 capitalize flex items-center gap-1.5">
                                System Priority
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setIsOverridingGoal(!isOverridingGoal)
                              }
                              className={`text-[9px] font-medium transition-all px-2 py-1 rounded-md border ${
                                isOverridingGoal
                                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              {isOverridingGoal ? "Cancel" : "Manual Override"}
                            </button>
                          </div>

                          {isOverridingGoal ? (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-red-500/5 border border-red-500/30 rounded-xl p-5 space-y-4 relative overflow-hidden"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Terminal size={12} className="text-red-500" />
                                <span className="text-[10px] text-red-500 capitalize font-semibold tracking-wide">
                                  Neural Injection
                                </span>
                              </div>
                              <textarea
                                value={goalOverrideInput}
                                onChange={(e) =>
                                  setGoalOverrideInput(e.target.value)
                                }
                                placeholder="Enter new core directive..."
                                className="w-full bg-black/60 border border-red-500/20 rounded-lg p-3 text-xs text-white h-20 resize-none focus:border-red-500/50 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                              />
                              <button
                                onClick={handleGoalOverride}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-semibold transition-all active:scale-[0.98] shadow-sm"
                              >
                                Execute Directive
                              </button>
                              <p className="text-[9px] text-red-500/60 text-center mt-2 capitalize font-medium">
                                Warning: Manual state manipulation
                              </p>
                            </motion.div>
                          ) : agent.currentGoal ? (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 relative group shadow-sm">
                              <div className="flex justify-between items-center mb-3 border-b border-amber-500/20 pb-2">
                                <span className="text-[10px] text-amber-500 capitalize font-medium flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>{" "}
                                  Active Directive
                                </span>
                              </div>
                              <p className="text-sm text-white/90 leading-relaxed font-sans">
                                {agent.currentGoal}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsOverridingGoal(true)}
                              className="w-full py-8 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all group shadow-sm bg-black/20"
                            >
                              <Zap
                                size={20}
                                className="opacity-50 group-hover:opacity-100"
                              />
                              <span className="text-[11px] font-medium capitalize">
                                Initialize Directive
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Autonomous Mode Toggle */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                              <Activity
                                size={12}
                                className={
                                  agent.aiConfig.autonomousLoop
                                    ? "text-emerald-500"
                                    : "text-slate-500"
                                }
                              />
                              <span className="text-[10px] font-medium text-slate-400 capitalize flex items-center gap-1.5">
                                Orchestration Mode
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                agent.aiConfig.autonomousLoop =
                                  !agent.aiConfig.autonomousLoop;
                                window.dispatchEvent(
                                  new CustomEvent("forceUpdateUi"),
                                );
                              }}
                              className={`w-10 h-5 rounded-full relative transition-colors ${
                                agent.aiConfig.autonomousLoop
                                  ? "bg-emerald-500"
                                  : "bg-slate-700"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${
                                  agent.aiConfig.autonomousLoop
                                    ? "left-[22px]"
                                    : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>

                          <div
                            className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                              agent.aiConfig.autonomousLoop
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-black/20 border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-bold tracking-wide uppercase ${
                                  agent.aiConfig.autonomousLoop
                                    ? "text-emerald-400"
                                    : "text-slate-400"
                                }`}
                              >
                                {agent.aiConfig.autonomousLoop
                                  ? "Autonomous Orchestrator"
                                  : "Manual Drone"}
                              </span>
                            </div>
                            <p
                              className={`text-[10px] leading-relaxed ${
                                agent.aiConfig.autonomousLoop
                                  ? "text-emerald-500/70"
                                  : "text-slate-500"
                              }`}
                            >
                              {agent.aiConfig.autonomousLoop
                                ? "Agent proactively analyzes context, generates its own tasks, and acts as an independent orchestrator."
                                : "Agent only responds to direct interventions and assignments. Requires manual orchestration."}
                            </p>
                          </div>
                        </div>

                        {/* Relationship Map */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                              <Radio size={12} className="text-slate-500" />
                              <span className="text-[10px] font-medium text-slate-400 capitalize flex items-center gap-1.5">
                                Network Topology
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-medium text-slate-500">
                                {Object.keys(agent.relationships || {}).length}{" "}
                                Nodes
                              </span>
                              <button
                                onClick={() =>
                                  setIsEditingNetwork(!isEditingNetwork)
                                }
                                className={`text-[9px] font-medium transition-all px-2 py-1 rounded-md border ${
                                  isEditingNetwork
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                {isEditingNetwork ? "Done" : "Manage"}
                              </button>
                            </div>
                          </div>

                          {isEditingNetwork && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 gap-3 flex flex-col mb-4"
                            >
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-foreground-muted/60 uppercase tracking-widest font-semibold flex justify-between">
                                  <span>Target Node</span>
                                </label>
                                <select
                                  value={networkTargetName}
                                  onChange={(e) => {
                                    setNetworkTargetName(e.target.value);
                                    if (
                                      agent.relationships &&
                                      agent.relationships[e.target.value]
                                    ) {
                                      setNetworkAffinity(
                                        agent.relationships[e.target.value]
                                          .affinity,
                                      );
                                      setNetworkNotes(
                                        agent.relationships[e.target.value]
                                          .notes,
                                      );
                                    } else {
                                      setNetworkAffinity(0);
                                      setNetworkNotes("");
                                    }
                                  }}
                                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-blue-500/50 outline-none transition-all"
                                >
                                  <option value="">Select agent...</option>
                                  {allAgents
                                    .filter((a) => a.id !== agent.id)
                                    .map((a) => (
                                      <option key={a.id} value={a.name}>
                                        {a.name}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              {networkTargetName && (
                                <div className="flex flex-col gap-3">
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-foreground-muted/60 uppercase tracking-widest font-semibold flex justify-between">
                                      <span>Affinity: {networkAffinity}%</span>
                                    </label>
                                    <input
                                      type="range"
                                      min="-100"
                                      max="100"
                                      value={networkAffinity}
                                      onChange={(e) =>
                                        setNetworkAffinity(
                                          parseInt(e.target.value),
                                        )
                                      }
                                      className="w-full accent-blue-500"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] text-foreground-muted/60 uppercase tracking-widest font-semibold flex justify-between">
                                      <span>Interaction Notes</span>
                                    </label>
                                    <textarea
                                      value={networkNotes}
                                      onChange={(e) =>
                                        setNetworkNotes(e.target.value)
                                      }
                                      placeholder="Manual contextual override..."
                                      className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-white h-16 resize-none focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                                    />
                                  </div>
                                  <button
                                    onClick={handleSaveNetworkNode}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition-all active:scale-[0.98]"
                                  >
                                    Update Connection
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}

                          <div className="flex flex-col gap-3">
                            {Object.keys(agent.relationships || {}).length ===
                            0 ? (
                              <div className="text-center py-10 text-[10px] font-medium text-slate-500 capitalize">
                                No connections detected
                              </div>
                            ) : (
                              Object.entries(agent.relationships || {}).map(
                                ([name, rel], i) => (
                                  <motion.div
                                    key={i}
                                    variants={{
                                      hidden: { opacity: 0, y: 10 },
                                      visible: { opacity: 1, y: 0 },
                                    }}
                                    className="flex flex-col gap-2.5 bg-surface/40 border border-white/5 rounded-xl p-4 shadow-sm"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center font-display text-sm text-foreground-muted/60 shadow-inner">
                                          {name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs font-semibold text-white/90 truncate">
                                            {name}
                                          </span>
                                          <span
                                            className={`text-[10px] font-medium transition-all ${rel.affinity > 0 ? "text-emerald-500" : rel.affinity < 0 ? "text-red-500" : "text-slate-400"}`}
                                          >
                                            Sync: {rel.affinity > 0 ? "+" : ""}
                                            {rel.affinity}%
                                          </span>
                                        </div>
                                      </div>
                                      {isEditingNetwork && (
                                        <button
                                          onClick={() => {
                                            setNetworkTargetName(name);
                                            setNetworkAffinity(rel.affinity);
                                            setNetworkNotes(rel.notes);
                                          }}
                                          className="text-white/30 hover:text-white p-1 rounded-md bg-white/5 transition-colors"
                                          title="Edit Connection"
                                        >
                                          <Settings2 size={12} />
                                        </button>
                                      )}
                                    </div>

                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden flex relative ring-1 ring-white/5">
                                      <div className="absolute left-1/2 top-0 h-full w-px bg-white/20 z-10"></div>
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                          width: `${Math.abs(rel.affinity) / 2}%`,
                                          left:
                                            rel.affinity >= 0 ? "50%" : "auto",
                                          right:
                                            rel.affinity < 0 ? "50%" : "auto",
                                        }}
                                        className={`h-full ${rel.affinity >= 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"} absolute transition-all duration-700`}
                                      ></motion.div>
                                    </div>

                                    <p className="text-[10px] text-slate-400 line-clamp-1 italic font-sans pl-1.5 border-l-2 border-white/10 mt-1">
                                      {rel.notes ||
                                        "No recent signal overlap recorded."}
                                    </p>
                                  </motion.div>
                                ),
                              )
                            )}
                          </div>
                        </div>

                        {/* Memory Buffer */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                              <Brain size={12} className="text-slate-500" />
                              <span className="text-[10px] font-medium text-slate-400 capitalize">
                                Cognitive Buffer
                              </span>
                            </div>
                            <button className="text-[10px] font-medium text-red-500/60 hover:text-red-500 capitalize transition-all">
                              Flush
                            </button>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {!agent.memory || agent.memory.length === 0 ? (
                              <div className="text-center py-10 text-[10px] font-medium text-slate-500 capitalize">
                                Empty heuristic set
                              </div>
                            ) : (
                              agent.memory
                                .slice(-8)
                                .reverse()
                                .map((m, i) => {
                                  const relevance =
                                    typeof agent.calculateMemoryRelevance ===
                                    "function"
                                      ? agent.calculateMemoryRelevance(
                                          m,
                                          Date.now(),
                                        )
                                      : 0;
                                  const relevancePercent = Math.min(
                                    100,
                                    Math.max(0, (relevance / 100) * 100),
                                  );
                                  return (
                                    <motion.div
                                      key={i}
                                      variants={{
                                        hidden: { opacity: 0, y: 10 },
                                        visible: { opacity: 1, y: 0 },
                                      }}
                                      className="text-[11px] text-white/80 bg-surface/40 p-4 rounded-xl border border-white/5 relative group hover:border-blue-500/30 transition-colors shadow-sm"
                                    >
                                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500/20 group-hover:bg-blue-500 transition-colors rounded-r-sm"></div>
                                      <div className="text-[9px] text-slate-500 font-medium mb-1.5 flex justify-between items-center capitalize">
                                        <div className="flex items-center gap-2">
                                          <span>
                                            Buffer ID {agent.memory.length - i}
                                          </span>
                                          <div
                                            className="w-16 h-1 bg-white/10 rounded-full overflow-hidden"
                                            title={`Relevance: ${Math.round(relevance)}`}
                                          >
                                            <div
                                              className="h-full bg-blue-500/80 transition-all"
                                              style={{
                                                width: `${relevancePercent}%`,
                                              }}
                                            ></div>
                                          </div>
                                        </div>
                                        <span className="group-hover:text-blue-400 transition-colors">
                                          {m.type || "Raw"}
                                        </span>
                                      </div>
                                      <div className="leading-relaxed font-sans">
                                        {m.content}
                                      </div>
                                    </motion.div>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "chat" && (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col bg-transparent"
                      >
                        <div className="px-5 py-4 bg-surface/50 border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                              <Activity size={14} className="text-primary" strokeWidth={1.8} />
                            </div>
                            <span className="text-[12px] text-foreground font-bold font-display uppercase tracking-wide">
                              Conversation
                            </span>
                          </div>
                          <span className="text-[9px] text-foreground-muted/60 font-mono bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] font-semibold">
                            {messages.length} messages
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 relative scroll-smooth">
                          <div className="flex-1"></div>
                          <AnimatePresence>
                            {messages.length === 0 ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="m-auto text-center py-16 flex flex-col items-center gap-5"
                              >
                                <div className="w-16 h-16 border border-primary/30 rounded-2xl flex items-center justify-center bg-primary/10 gap-2 shadow-md glow-blue">
                                  <Radio size={26} className="text-primary/70" strokeWidth={1.5} />
                                </div>
                                <div className="text-[13px] font-medium text-foreground-muted/80 leading-relaxed max-w-[220px]">
                                  Start a conversation with {agent?.name}. Send messages to chat or assign tasks.
                                </div>
                              </motion.div>
                            ) : (
                              messages.map((m, i) => {
                                const isAutoCycle = m.content.includes(
                                  "[AUTONOMOUS CYCLE]:",
                                );
                                let cleanedContent = m.content.replace(
                                  /^\[.*?\]\s*/,
                                  "",
                                );

                                if (m.role === "user" && isAutoCycle) {
                                  return (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="w-full flex flex-col items-center my-3"
                                    >
                                      <div className="px-3.5 py-1.5 bg-primary/15 border border-primary/30 rounded-full flex items-center gap-2 shadow-md hover:border-primary/50 transition-all">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_6px_rgba(99,102,241,0.8)]"></div>
                                        <span className="text-[10px] text-primary/90 font-bold uppercase tracking-widest">
                                          Autonomous Action
                                        </span>
                                      </div>
                                    </motion.div>
                                  );
                                }

                                return (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className="w-full flex flex-col"
                                  >
                                    {m.role === "user" ? (
                                      <div className="flex flex-col items-end pl-10 mb-2">
                                        <div className="px-4 py-3 bg-gradient-to-br from-primary/20 to-secondary/15 border border-primary/30 text-foreground font-sans text-[13px] rounded-2xl rounded-tr-md relative leading-relaxed max-w-[88%] break-words shadow-md hover:border-primary/40 transition-all duration-300">
                                          {cleanedContent}
                                        </div>
                                      </div>
                                    ) : m.role === "system" ? (
                                      <div className="flex flex-col items-start px-4 py-3 w-full border border-primary/20 bg-primary/8 rounded-2xl rounded-tl-md relative my-2 backdrop-blur-md hover:border-primary/30 transition-all duration-300">
                                        <div className="text-[10px] text-primary/90 font-bold mb-1.5 flex items-center gap-2 uppercase tracking-wider">
                                          <Brain size={11} strokeWidth={2} />
                                          System
                                        </div>
                                        <div className="text-slate-300/80 font-sans text-[12px] leading-relaxed break-words whitespace-pre-wrap">
                                          {m.content.replace("[Thought]: ", "")}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-start pr-10 mb-2">
                                        <div className="px-4 py-3 bg-surface/60 border border-white/[0.08] text-foreground font-sans text-[13px] rounded-2xl rounded-tl-md relative group shadow-md backdrop-blur-md hover:border-primary/20 transition-all duration-300">
                                          <div className="text-[10px] text-primary font-bold mb-1.5 flex items-center gap-2 tracking-wider uppercase">
                                            {agent?.name || "Agent"}
                                          </div>
                                          <div className="leading-relaxed whitespace-pre-wrap break-words text-foreground-muted/95">
                                            {cleanedContent}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })
                            )}
                          </AnimatePresence>
                          {isLoading && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="px-3.5 py-2.5 bg-primary/12 border border-primary/25 text-primary/90 text-[11px] font-bold rounded-xl flex items-center gap-2.5 w-fit uppercase tracking-wide"
                            >
                              <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                ></div>
                              </div>
                              {agent?.name} is thinking...
                            </motion.div>
                          )}
                        </div>

                        {/* Input Region */}
                        <form
                          onSubmit={handleSubmit}
                          className="p-3 sm:p-5 bg-gradient-to-t from-surface to-transparent border-t border-white/[0.08] relative z-10 shrink-0"
                        >
                          <div className="glass-card border border-primary/20 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col gap-2.5 sm:gap-3 transition-all focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/30">
                            <textarea
                              className="w-full bg-transparent p-3 text-[13px] min-h-[44px] max-h-32 focus:outline-none text-foreground font-sans resize-none placeholder:text-foreground-muted/50 transition-all font-medium leading-relaxed"
                              placeholder="Chat with your agent... Type a message or assign a task"
                              value={input}
                              onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = (e.target.scrollHeight) + 'px';
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSubmit(e as any);
                                }
                              }}
                            />
                            
                            <div className="flex items-center justify-between px-2">
                              <div className="flex items-center gap-2">
                                {["low", "medium", "high"].map((p) => (
                                  <motion.button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p as any)}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-3 py-1.5 text-[8px] font-bold rounded-lg transition-all uppercase tracking-wider ${
                                      priority === p
                                        ? p === "high" ? "bg-error/20 text-error border border-error/30 shadow-md"
                                        : p === "medium" ? "bg-warning/20 text-warning border border-warning/30 shadow-md"
                                        : "bg-primary/20 text-primary border border-primary/30 shadow-md"
                                        : "text-foreground-muted/60 hover:text-foreground-muted/90 hover:bg-white/[0.05] border border-white/[0.08]"
                                    }`}
                                  >
                                    {p}
                                  </motion.button>
                                ))}
                              </div>
                              <motion.button
                                type="submit"
                                disabled={!input.trim() || !agent}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all font-semibold shadow-md ${
                                  !input.trim() || !agent
                                    ? "bg-white/[0.05] text-foreground-muted/40 cursor-not-allowed"
                                    : "bg-gradient-to-br from-primary/80 to-primary text-foreground shadow-lg hover:shadow-xl hover:from-primary hover:to-primary-dark active:scale-95"
                                }`}
                              >
                                <Send size={15} strokeWidth={2.5} />
                              </motion.button>
                            </div>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
