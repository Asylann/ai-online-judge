import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
	BookOpen,
	Lock,
	CheckCircle2,
	Play,
	Sparkles,
	Award,
	Layers,
	ArrowRight,
	AlertCircle,
	Terminal,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

interface ProblemWithStatus {
	id: string;
	title: string;
	description: string;
	difficulty: string;
	difficulty_score: number;
	ast_complexity_score?: number;
	sequential_order: number;
	is_locked: boolean;
	is_solved: boolean;
}

interface Module {
	id: string;
	title: string;
	description: string;
	sequential_order: number;
	problems: ProblemWithStatus[];
}

const mockModules: Module[] = [
	{
		id: "b1000000-0000-4000-a000-000000000001",
		title: "Module 1: Foundations & Core Arrays",
		description:
			"Master basic array traversal, indexing, digit reversal, and stack invariants.",
		sequential_order: 1,
		problems: [
			{
				id: "a8f9a993-79ee-4e3b-ac66-f34ca8e70b12",
				title: "Adding all listed numbers",
				description:
					"Sum N space-separated integers on standard input and return the result.",
				difficulty: "easy",
				difficulty_score: 1.5,
				sequential_order: 1,
				is_locked: false,
				is_solved: true,
			},
			{
				id: "a0000000-0000-4000-a000-000000000001",
				title: "Two Sum — Optimal Structural Indexing",
				description:
					"Given an array of integers nums and an integer target, return indices of the two numbers.",
				difficulty: "easy",
				difficulty_score: 1.2,
				sequential_order: 2,
				is_locked: false,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000002",
				title: "Palindrome Number — Digit Reversal AST",
				description:
					"Determine if x is a palindrome integer without converting to string representation where possible.",
				difficulty: "easy",
				difficulty_score: 1.5,
				sequential_order: 3,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000003",
				title: "Valid Parentheses — Stack Invariants",
				description:
					"Determine if bracket sequence is valid by verifying strict stack push/pop balance.",
				difficulty: "easy",
				difficulty_score: 1.8,
				sequential_order: 4,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000004",
				title: "Maximum Subarray — Kadane's Algorithm",
				description:
					"Find the contiguous subarray with the largest sum and return its total in O(N) time.",
				difficulty: "medium",
				difficulty_score: 1.9,
				sequential_order: 5,
				is_locked: true,
				is_solved: false,
			},
		],
	},
	{
		id: "b1000000-0000-4000-a000-000000000002",
		title: "Module 2: Data Structures & Structural AST Patterns",
		description:
			"Explore binary tree height balance, sliding windows, hash mapping, and bottom-up dynamic programming.",
		sequential_order: 2,
		problems: [
			{
				id: "a0000000-0000-4000-a000-000000000005",
				title: "Balanced Binary Tree — AST Recursion Depth",
				description:
					"Check if a binary tree is height-balanced by measuring recursive left and right tree depths.",
				difficulty: "medium",
				difficulty_score: 2.3,
				sequential_order: 1,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000006",
				title: "Longest Substring Without Repeating Characters",
				description:
					"Use the sliding window structural pattern to find the longest unique substring length.",
				difficulty: "medium",
				difficulty_score: 2.6,
				sequential_order: 2,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000007",
				title: "Group Anagrams — Structural Hash Mapping",
				description:
					"Group a list of strings into anagram sets sorted by character frequency signatures.",
				difficulty: "medium",
				difficulty_score: 2.9,
				sequential_order: 3,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000008",
				title: "Coin Change — Dynamic Programming Bottom-Up",
				description:
					"Return the fewest coins required to make the target amount using iterative table building.",
				difficulty: "medium",
				difficulty_score: 3.2,
				sequential_order: 4,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000009",
				title: "0/1 Knapsack Optimization — ZPD Challenge",
				description:
					"Select items with weights and values to maximize total value without exceeding capacity W.",
				difficulty: "hard",
				difficulty_score: 3.5,
				sequential_order: 5,
				is_locked: true,
				is_solved: false,
			},
		],
	},
	{
		id: "b1000000-0000-4000-a000-000000000003",
		title: "Module 3: Advanced Algorithms & Graph Topological Ordering",
		description:
			"Tackle Kahn's topological sort, merge K lists with priority queues, monotonic stacks, and bitwise N-Queens backtracking.",
		sequential_order: 3,
		problems: [
			{
				id: "a0000000-0000-4000-a000-000000000010",
				title: "Course Schedule — Topological Sort (Kahn's Algorithm)",
				description:
					"Determine if all courses can be finished by finding directed acyclic ordering among prerequisites.",
				difficulty: "hard",
				difficulty_score: 3.8,
				sequential_order: 1,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000011",
				title: "Merge K Sorted Lists — Priority Queue / Divide & Conquer",
				description:
					"Efficiently merge K sorted linked lists into a single sorted list using min-heaps.",
				difficulty: "hard",
				difficulty_score: 4.1,
				sequential_order: 2,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000012",
				title: "Trapping Rain Water — Two Pointer Monotonic Stack",
				description:
					"Compute total trapped rainwater units across an elevation bar map in O(N) time.",
				difficulty: "hard",
				difficulty_score: 4.4,
				sequential_order: 3,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000013",
				title: "N-Queens — Backtracking with Bitwise Optimization",
				description:
					"Place N chess queens on an N×N board such that no two attack each other using bit masks.",
				difficulty: "hard",
				difficulty_score: 4.8,
				sequential_order: 4,
				is_locked: true,
				is_solved: false,
			},
			{
				id: "a0000000-0000-4000-a000-000000000014",
				title: "Alien Dictionary — Graph Topological Ordering",
				description:
					"Derive the character ordering of an alien language from lexicographically sorted words.",
				difficulty: "hard",
				difficulty_score: 5.2,
				sequential_order: 5,
				is_locked: true,
				is_solved: false,
			},
		],
	},
];

export default function ModulesPage() {
	const { user, isAuthenticated, authReady } = useAuth();
	const [modules, setModules] = useState<Module[]>(mockModules);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		if (!authReady) return;

		const fetchModules = async () => {
			try {
				const response = await axios.get(`${API_URL}/modules`);
				const modData = response.data;
				if (modData && Array.isArray(modData) && modData.length > 0) {
					setModules(modData);
				}
			} catch (err) {
				console.warn(
					"Could not fetch modules from backend API, using canonical curriculum progression.",
					err
				);
			} finally {
				setLoading(false);
			}
		};

		fetchModules();
	}, [authReady, isAuthenticated]);

	return (
		<div className="min-h-screen bg-ivory-100 text-slate-900 pb-20">
			{/* Hero Banner */}
			<section className="bg-gradient-to-b from-ivory-200/60 to-ivory-100 border-b border-slate-900/10 pt-12 pb-14">
				<div className="max-w-6xl mx-auto px-6">
					<motion.div
						initial={{ opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3 }}
						className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-600/10 border border-amber-600/20 text-xs font-mono tracking-wider text-amber-900 uppercase mb-4"
					>
						<Sparkles className="w-3.5 h-3.5 text-amber-700" />
						<span>Curriculum Learning Paths & ZPD Locking</span>
					</motion.div>

					<h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-slate-900">
						Structured Algorithmic Curriculum
					</h1>
					<p className="text-base sm:text-lg text-slate-600 max-w-3xl mt-3 font-sans leading-relaxed">
						Progress systematically through Professor Watanobe&apos;s pedagogical roadmap. 
						Each problem is locked until you master its prerequisite in your Zone of Proximal Development.
					</p>

					{!isAuthenticated && (
						<div className="mt-6 inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900/5 border border-slate-900/10 text-sm text-slate-700">
							<AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
							<span>
								You are viewing as a guest. <Link href="/login" className="font-semibold underline hover:text-amber-900">Sign in</Link> to save your progress and unlock advanced curriculum milestones.
							</span>
						</div>
					)}
				</div>
			</section>

			{/* Curriculum Modules Tree */}
			<section className="max-w-6xl mx-auto px-6 mt-10 space-y-12">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-20 space-y-4">
						<div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
						<p className="text-sm font-mono text-slate-500">Loading curriculum progression...</p>
					</div>
				) : (
					modules.map((mod, modIndex) => {
						const totalCount = mod.problems?.length || 0;
						const solvedCount = mod.problems?.filter((p) => p.is_solved).length || 0;
						const progressPct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

						return (
							<motion.div
								key={mod.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, delay: modIndex * 0.1 }}
								className="bg-ivory-100 rounded-2xl border border-slate-900/15 shadow-sm overflow-hidden"
							>
								{/* Module Header */}
								<div className="bg-ivory-200/60 px-6 py-5 border-b border-slate-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
									<div className="flex items-start space-x-3.5">
										<div className="w-10 h-10 rounded-xl bg-slate-900 text-ivory-100 flex items-center justify-center font-serif font-bold text-lg shrink-0 shadow-xs">
											{mod.sequential_order}
										</div>
										<div>
											<h2 className="text-xl font-serif font-semibold text-slate-900 tracking-tight flex items-center">
												{mod.title}
											</h2>
											<p className="text-xs text-slate-600 font-sans mt-1">
												{mod.description}
											</p>
										</div>
									</div>

									{/* Progress Pill */}
									<div className="flex flex-col md:items-end shrink-0">
										<div className="flex items-center space-x-2 text-xs font-mono font-medium text-slate-700">
											<span>{solvedCount} / {totalCount} Problems Completed</span>
											<span className="px-2 py-0.5 rounded-full bg-amber-600/10 text-amber-900 font-bold">
												{progressPct}%
											</span>
										</div>
										<div className="w-full md:w-48 h-2 bg-slate-900/10 rounded-full overflow-hidden mt-2">
											<div
												className="h-full bg-amber-600 transition-all duration-500 ease-out"
												style={{ width: `${progressPct}%` }}
											/>
										</div>
									</div>
								</div>

								{/* Problem Sequence List */}
								<div className="divide-y divide-slate-900/10">
									{mod.problems?.map((prob, probIdx) => {
										const isLocked = prob.is_locked;
										const isSolved = prob.is_solved;

										return (
											<div
												key={prob.id}
												className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
													isLocked
														? "bg-slate-900/[0.03] opacity-75 select-none"
														: isSolved
														? "bg-emerald-50/40 hover:bg-emerald-50/70"
														: "bg-ivory-100 hover:bg-ivory-200/50"
												}`}
											>
												<div className="flex items-start space-x-4">
													{/* Progression Status Icon */}
													<div className="mt-0.5 shrink-0">
														{isLocked ? (
															<div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 border border-slate-300">
																<Lock className="w-4 h-4" />
															</div>
														) : isSolved ? (
															<div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-300">
																<CheckCircle2 className="w-4 h-4" />
															</div>
														) : (
															<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 border border-amber-300 shadow-xs">
																<Play className="w-4 h-4 fill-amber-800 ml-0.5" />
															</div>
														)}
													</div>

													{/* Problem Info */}
													<div className="space-y-1">
														<div className="flex items-center flex-wrap gap-2">
															<span className="text-[11px] font-mono font-bold text-slate-500">
																Problem {prob.sequential_order}
															</span>
															<span
																className={`text-[10px] font-mono uppercase px-2 py-0.2 rounded font-semibold ${
																	prob.difficulty === "easy" || prob.difficulty_score < 2.0
																		? "bg-emerald-500/10 text-emerald-800 border border-emerald-500/20"
																		: prob.difficulty === "medium" || prob.difficulty_score < 3.5
																		? "bg-amber-500/10 text-amber-900 border border-amber-500/20"
																		: "bg-rose-500/10 text-rose-800 border border-rose-500/20"
																}`}
															>
																Score: {prob.difficulty_score.toFixed(1)}
															</span>

															{isLocked && (
																<span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-slate-200 text-slate-600 border border-slate-300 flex items-center">
																	<Lock className="w-3 h-3 mr-1" />
																	Prerequisite Required
																</span>
															)}
															{isSolved && (
																<span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 flex items-center">
																	<CheckCircle2 className="w-3 h-3 mr-1" />
																	Completed
																</span>
															)}
															{!isLocked && !isSolved && (
																<span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-amber-500/20 text-amber-950 border border-amber-500/30 animate-pulse">
																	Available — Next in ZPD
																</span>
															)}
														</div>

														<h3
															className={`text-base font-serif font-semibold tracking-tight ${
																isLocked ? "text-slate-500" : "text-slate-900"
															}`}
														>
															{prob.title}
														</h3>
														<p className="text-xs text-slate-600 font-sans line-clamp-2 max-w-2xl">
															{prob.description}
														</p>
													</div>
												</div>

												{/* Action Button */}
												<div className="shrink-0 flex items-center self-end sm:self-center">
													{isLocked ? (
														<div
															title="Solve and pass the previous problem in this sequence to unlock"
															className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-200/80 text-slate-500 text-xs font-mono font-semibold cursor-not-allowed border border-slate-300"
														>
															<Lock className="w-3.5 h-3.5" />
															<span>Locked</span>
														</div>
													) : (
														<Link
															href={`/problems/${prob.id}`}
															className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 shadow-sm ${
																isSolved
																	? "bg-ivory-200 border border-slate-900/20 text-slate-800 hover:bg-slate-900 hover:text-ivory-100"
																	: "bg-slate-900 text-ivory-100 hover:bg-amber-600 hover:text-white hover:scale-105"
															}`}
														>
															<span>{isSolved ? "Practice Again" : "Solve Challenge"}</span>
															<ArrowRight className="w-3.5 h-3.5" />
														</Link>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</motion.div>
						);
					})
				)}
			</section>
		</div>
	);
}
