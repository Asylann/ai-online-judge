-- ============================================================
-- AI Online Judge — PostgreSQL Schema (EDM-Optimized)
-- Phase 1 + Multi-Test-Case Extension
--
-- Runs automatically on first `docker-compose up` via:
--   PostgreSQL image entrypoint: /docker-entrypoint-initdb.d/
--
-- Design Philosophy (Watanobe Lab, EDM):
--   Every attempt is stored, not just pass/fail verdicts.
--   10 ranked test cases per problem (difficulty_rank 1=easiest, 10=hardest).
--   tests_passed/tests_total replace binary Accepted/WA for ZPD alignment.
--   failed_test_stdin gives the Virtual TA precise failure context.
-- ============================================================

-- Enable UUID generation via uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT '',
    role          VARCHAR(32)  NOT NULL DEFAULT 'student',
    created_at    TIMESTAMPTZ  DEFAULT now()
);

-- ── problems ──────────────────────────────────────────────────────────────────
-- stdin / expected_output here are the SAMPLE shown in the UI sidebar only.
-- Actual grading uses the test_cases table (10 cases per problem).
CREATE TABLE IF NOT EXISTS problems (
    id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    title            VARCHAR(255) NOT NULL,
    description      TEXT         NOT NULL,
    stdin            TEXT         DEFAULT '',   -- sample test shown in UI sidebar
    expected_output  TEXT         DEFAULT '',   -- sample output shown in UI sidebar
    difficulty_score FLOAT        DEFAULT 0.0,
    created_at       TIMESTAMPTZ  DEFAULT now()
);

-- ── test_cases ────────────────────────────────────────────────────────────────
-- 10 ranked test cases per problem. Difficulty increases with difficulty_rank.
-- The Executor runs all 10 sequentially (stops early on Compilation Error).
-- failed_test_stdin is stored in submissions for Virtual TA ZPD context.
CREATE TABLE IF NOT EXISTS test_cases (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id       UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    stdin            TEXT        NOT NULL,
    expected_output  TEXT        NOT NULL,
    difficulty_rank  INT         NOT NULL DEFAULT 1, -- 1=easiest, 10=hardest
    is_sample        BOOLEAN     DEFAULT FALSE,       -- TRUE = also shown in problem sidebar
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- ── submissions (core EDM table — effort-based, not binary) ───────────────────
-- Every submission attempt is recorded. Fields are populated progressively:
--   1. API Gateway  -> fills: user_id, problem_id, code_base64, language, status='Pending'
--   2. Judge Worker -> fills: status, tests_passed, tests_total, execution_time_ms, memory_kb,
--                             failed_test_stdin, failed_test_expected_output
--   3. AST Service  -> fills: ast_complexity_score, ast_snapshot
--   4. AI Tutor     -> fills: cognitive_effort_index, ai_hint_given, ai_hint_text
--
-- tests_passed/tests_total align with Zone of Proximal Development (ZPD):
--   "8/10 passed" is far more motivating than binary "Wrong Answer".
-- failed_test_stdin gives the Virtual TA the exact input that broke the student's code.
CREATE TABLE IF NOT EXISTS submissions (
  id                          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID        NOT NULL REFERENCES users(id),
  problem_id                  UUID        NOT NULL REFERENCES problems(id),
  code_base64                 TEXT        NOT NULL,   -- Always Base64 encoded (Critical Rule #1)
  language                    VARCHAR(32) NOT NULL,   -- 'cpp', 'python3', 'go', 'java'
  status                      VARCHAR(32) NOT NULL,   -- Accepted | WA | TLE | CE | MLE | RE | Pending
  -- Multi-test scoring (EDM) — breaks the binary pass/fail paradigm
  tests_passed                INT         DEFAULT 0,  -- number of test cases passed
  tests_total                 INT         DEFAULT 0,  -- total test cases run
  -- Failure context for Virtual TA Socratic hint generation
  failed_test_stdin           TEXT,                   -- stdin of the first test case that failed
  failed_test_expected_output TEXT,                   -- expected output of the first test that failed
  -- effort_based_metrics (Executor measurements inside isolate sandbox)
  execution_time_ms           INT,                    -- CPU time measured by the Executor
  memory_kb                   INT,                    -- Peak RAM measured by the Executor
  -- EDM / AST fields (populated by ast-service after Judge verdict)
  ast_complexity_score        FLOAT,                  -- gotreesitter structural complexity
  cognitive_effort_index      FLOAT,                  -- Composite effort metric (EDM)
  ast_snapshot                JSONB,                  -- Full AST dump for ML training corpus
  -- Virtual TA fields (populated by ai-tutor service on non-Accepted verdict)
  ai_hint_given               BOOLEAN     DEFAULT FALSE,
  ai_hint_text                TEXT,
  created_at                  TIMESTAMPTZ DEFAULT now()
);

-- Ensure all new EDM columns exist when migrating from older volume schemas
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tests_passed INT DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tests_total INT DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS failed_test_stdin TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS failed_test_expected_output TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'student';


-- ── Canonical ZPD Problem Set (14 Problems) ───────────────────────────────────
INSERT INTO problems (id, title, description, stdin, expected_output, difficulty_score) VALUES
(
  'a0000000-0000-4000-a000-000000000001',
  'Two Sum — Optimal Structural Indexing',
  E'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\n**Input format:** Line 1 = space-separated integers (the array). Line 2 = target integer.\n**Output format:** Two space-separated indices.\n\n### Example:\n**Input:**\n2 7 11 15\n9\n**Output:**\n0 1\n**Explanation:** nums[0] + nums[1] = 2 + 7 = 9',
  E'2 7 11 15\n9',
  '0 1',
  1.2
),
(
  'a0000000-0000-4000-a000-000000000002',
  'Palindrome Number — Digit Reversal AST',
  E'Given an integer `x`, determine if `x` is a palindrome (reads the same backward as forward).\nNegative numbers are never palindromes.\n\n**Input format:** A single integer.\n**Output format:** `true` or `false` (lowercase).\n\n### Example 1:\n**Input:** 121\n**Output:** true\n\n### Example 2:\n**Input:** -121\n**Output:** false',
  '121',
  'true',
  1.5
),
(
  'a0000000-0000-4000-a000-000000000003',
  'Valid Parentheses — Stack Invariants',
  E'Given a string containing only `(`, `)`, `{`, `}`, `[`, `]`, determine if it is valid.\nAn input string is valid if brackets are closed by the same type in the correct order.\n\n**Input format:** A single string of bracket characters.\n**Output format:** `true` or `false` (lowercase).\n\n### Example 1:\n**Input:** ()[]{}\n**Output:** true\n\n### Example 2:\n**Input:** ([)]\n**Output:** false',
  '()[]{}',
  'true',
  1.8
),
(
  'a0000000-0000-4000-a000-000000000004',
  'Maximum Subarray — Kadane''s Algorithm',
  E'Given an integer array `nums`, find the contiguous subarray with the largest sum, and return its sum.\nYour algorithm should run in O(N) time.\n\n**Input format:** Space-separated integers on one line.\n**Output format:** A single integer (the maximum subarray sum).\n\n### Example:\n**Input:** -2 1 -3 4 -1 2 1 -5 4\n**Output:** 6\n**Explanation:** [4,-1,2,1] has the largest sum = 6',
  '-2 1 -3 4 -1 2 1 -5 4',
  '6',
  1.9
),
(
  'a0000000-0000-4000-a000-000000000005',
  'Balanced Binary Tree — AST Recursion Depth',
  E'Determine if a binary tree (given in level-order with -1 for null nodes) is height-balanced.\nA tree is balanced if for every node, the depth of left and right subtrees differs by at most 1.\n\n**Input format:** Space-separated integers (level-order). -1 means null node.\n**Output format:** `true` or `false` (lowercase).\n\n### Example 1:\n**Input:** 3 9 20 -1 -1 15 7\n**Output:** true\n\n### Example 2:\n**Input:** 1 2 -1 3\n**Output:** false',
  '3 9 20 -1 -1 15 7',
  'true',
  2.3
),
(
  'a0000000-0000-4000-a000-000000000006',
  'Longest Substring Without Repeating Characters',
  E'Given a string `s`, find the length of the longest substring without repeating characters.\nUse the sliding window structural pattern.\n\n**Input format:** A single string.\n**Output format:** A single integer.\n\n### Example 1:\n**Input:** abcabcbb\n**Output:** 3\n\n### Example 2:\n**Input:** bbbbb\n**Output:** 1',
  'abcabcbb',
  '3',
  2.6
),
(
  'a0000000-0000-4000-a000-000000000007',
  'Group Anagrams — Structural Hash Mapping',
  E'Given a list of words on one line (space-separated), group the anagrams together.\nSort each group alphabetically. Sort groups by their first word alphabetically. Print each group on one line.\n\n**Input format:** Space-separated words on one line.\n**Output format:** One group per line, words within group sorted alphabetically, groups sorted by first word.\n\n### Example:\n**Input:** eat tea tan ate nat bat\n**Output:**\nate eat tea\nbat\nnat tan',
  'eat tea tan ate nat bat',
  E'ate eat tea\nbat\nnat tan',
  2.9
),
(
  'a0000000-0000-4000-a000-000000000008',
  'Coin Change — Dynamic Programming Bottom-Up',
  E'Given coins of different denominations and an amount, return the fewest coins needed to make the amount.\nReturn -1 if that amount cannot be made up.\n\n**Input format:** Line 1 = space-separated coin denominations. Line 2 = target amount.\n**Output format:** A single integer (-1 if impossible).\n\n### Example:\n**Input:**\n1 2 5\n11\n**Output:** 3\n**Explanation:** 5 + 5 + 1 = 3 coins',
  E'1 2 5\n11',
  '3',
  3.2
),
(
  'a0000000-0000-4000-a000-000000000009',
  '0/1 Knapsack Optimization — ZPD Challenge',
  E'Given N items with weights and values, find the maximum value you can fit in a knapsack of capacity W.\nEach item can only be used once (0/1 knapsack).\n\n**Input format:** Line 1 = N W. Next N lines = weight value pairs.\n**Output format:** A single integer (maximum value).\n\n### Example:\n**Input:**\n3 50\n10 60\n20 100\n30 120\n**Output:** 220\n**Explanation:** Items 2 and 3 (weight 50, value 220)',
  E'3 50\n10 60\n20 100\n30 120',
  '220',
  3.5
),
(
  'a0000000-0000-4000-a000-000000000010',
  'Course Schedule — Topological Sort (Kahn''s Algorithm)',
  E'Given numCourses courses and prerequisite pairs [a, b] (to take a, must first take b), return `true` if you can finish all courses, `false` if there is a cycle.\n\n**Input format:** Line 1 = numCourses numPrereqs. Next numPrereqs lines = "a b" pairs.\n**Output format:** `true` or `false` (lowercase).\n\n### Example 1:\n**Input:**\n2 1\n1 0\n**Output:** true\n\n### Example 2:\n**Input:**\n2 2\n1 0\n0 1\n**Output:** false (cycle detected)',
  E'2 1\n1 0',
  'true',
  3.8
),
(
  'a0000000-0000-4000-a000-000000000011',
  'Merge K Sorted Lists — Priority Queue / Divide & Conquer',
  E'Given k sorted lists, merge them into one sorted list.\n\n**Input format:** Line 1 = k (number of lists). Next k lines = space-separated integers for each sorted list.\n**Output format:** Space-separated integers (the merged sorted result).\n\n### Example:\n**Input:**\n3\n1 4 5\n1 3 4\n2 6\n**Output:** 1 1 2 3 4 4 5 6',
  E'3\n1 4 5\n1 3 4\n2 6',
  '1 1 2 3 4 4 5 6',
  4.1
),
(
  'a0000000-0000-4000-a000-000000000012',
  'Trapping Rain Water — Two Pointer Monotonic Stack',
  E'Given n non-negative integers representing an elevation map (bar width = 1), compute how much water it can trap.\n\n**Input format:** Space-separated integers on one line.\n**Output format:** A single integer (total trapped water units).\n\n### Example:\n**Input:** 0 1 0 2 1 0 1 3 2 1 2 1\n**Output:** 6',
  '0 1 0 2 1 0 1 3 2 1 2 1',
  '6',
  4.4
),
(
  'a0000000-0000-4000-a000-000000000013',
  'N-Queens — Backtracking with Bitwise Optimization',
  E'Place N chess queens on an N×N board so no two attack each other. Return the count of distinct solutions.\n\n**Input format:** A single integer N.\n**Output format:** A single integer (number of solutions).\n\n### Example 1:\n**Input:** 4\n**Output:** 2\n\n### Example 2:\n**Input:** 8\n**Output:** 92',
  '4',
  '2',
  4.8
),
(
  'a0000000-0000-4000-a000-000000000014',
  'Alien Dictionary — Graph Topological Ordering',
  E'Given words sorted lexicographically in an alien language (one word per line), derive the character ordering.\nReturn the characters in the derived order. Return empty string if invalid (cycle detected).\n\n**Input format:** One word per line.\n**Output format:** A single string of characters in derived alien order.\n\n### Example:\n**Input:**\nwrt\nwrf\ner\nett\nrftt\n**Output:** wertf',
  E'wrt\nwrf\ner\nett\nrftt',
  'wertf',
  5.2
),
(
  'a8f9a993-79ee-4e3b-ac66-f34ca8e70b12',
  'Adding all listed numbers',
  E'Given the count of numbers N on the first token, followed by N integers (separated by spaces or newlines across arbitrary lines), sum the N integers and output the total.\n\n**Input format:** First token = N (number of integers). Next N tokens = integers to be summed.\n**Output format:** A single integer equal to the sum of the N numbers.\n\n### Example:\n**Input:**\n5\n1 2 3 4 5\n**Output:** 15',
  E'5\n1 2 3 4 5',
  '15',
  1.5
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  stdin = EXCLUDED.stdin,
  expected_output = EXCLUDED.expected_output,
  difficulty_score = EXCLUDED.difficulty_score;

-- ── 10 Ranked Test Cases × 14 Problems = 140 Test Cases ──────────────────────
-- difficulty_rank: 1 = simplest edge case, 10 = most complex/tricky
-- is_sample=TRUE: also shown in the problem sidebar as the example
INSERT INTO test_cases (problem_id, stdin, expected_output, difficulty_rank, is_sample) VALUES

-- ═══ Problem 1: Two Sum ═══════════════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000001', E'2 7 11 15\n9',                        '0 1',  1, TRUE),
('a0000000-0000-4000-a000-000000000001', E'3 2 4\n6',                             '1 2',  2, FALSE),
('a0000000-0000-4000-a000-000000000001', E'3 3\n6',                               '0 1',  3, FALSE),
('a0000000-0000-4000-a000-000000000001', E'1 2 3 4 5\n9',                         '3 4',  4, FALSE),
('a0000000-0000-4000-a000-000000000001', E'0 4 3 0\n0',                           '0 3',  5, FALSE),
('a0000000-0000-4000-a000-000000000001', E'-1 -2 -3 -4 -5\n-8',                   '2 4',  6, FALSE),
('a0000000-0000-4000-a000-000000000001', E'1 5 3 2\n4',                           '2 3',  7, FALSE),
('a0000000-0000-4000-a000-000000000001', E'1 2 3 4 5 6 7 8 9 10\n19',             '8 9',  8, FALSE),
('a0000000-0000-4000-a000-000000000001', E'0 1 2\n1',                             '0 1',  9, FALSE),
('a0000000-0000-4000-a000-000000000001', E'100 200 300 400\n700',                  '2 3', 10, FALSE),

-- ═══ Problem 2: Palindrome Number ════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000002', '121',        'true',   1, TRUE),
('a0000000-0000-4000-a000-000000000002', '-121',       'false',  2, FALSE),
('a0000000-0000-4000-a000-000000000002', '10',         'false',  3, FALSE),
('a0000000-0000-4000-a000-000000000002', '0',          'true',   4, FALSE),
('a0000000-0000-4000-a000-000000000002', '1',          'true',   5, FALSE),
('a0000000-0000-4000-a000-000000000002', '11',         'true',   6, FALSE),
('a0000000-0000-4000-a000-000000000002', '1001',       'true',   7, FALSE),
('a0000000-0000-4000-a000-000000000002', '1000021',    'false',  8, FALSE),
('a0000000-0000-4000-a000-000000000002', '9',          'true',   9, FALSE),
('a0000000-0000-4000-a000-000000000002', '2147447412', 'true',  10, FALSE),

-- ═══ Problem 3: Valid Parentheses ════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000003', '()',          'true',   1, TRUE),
('a0000000-0000-4000-a000-000000000003', '()[]{}',      'true',   2, FALSE),
('a0000000-0000-4000-a000-000000000003', '(]',          'false',  3, FALSE),
('a0000000-0000-4000-a000-000000000003', '([)]',        'false',  4, FALSE),
('a0000000-0000-4000-a000-000000000003', '{[]}',        'true',   5, FALSE),
('a0000000-0000-4000-a000-000000000003', '(((',         'false',  6, FALSE),
('a0000000-0000-4000-a000-000000000003', ']',           'false',  7, FALSE),
('a0000000-0000-4000-a000-000000000003', '{[()]}',      'true',   8, FALSE),
('a0000000-0000-4000-a000-000000000003', '((()))',       'true',   9, FALSE),
('a0000000-0000-4000-a000-000000000003', '({[()]})',     'true',  10, FALSE),

-- ═══ Problem 4: Maximum Subarray ═════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000004', '-2 1 -3 4 -1 2 1 -5 4',  '6',   1, TRUE),
('a0000000-0000-4000-a000-000000000004', '1',                        '1',   2, FALSE),
('a0000000-0000-4000-a000-000000000004', '5 4 -1 7 8',               '23',  3, FALSE),
('a0000000-0000-4000-a000-000000000004', '-1',                       '-1',  4, FALSE),
('a0000000-0000-4000-a000-000000000004', '-2 -1',                    '-1',  5, FALSE),
('a0000000-0000-4000-a000-000000000004', '1 2 3 4 5',                '15',  6, FALSE),
('a0000000-0000-4000-a000-000000000004', '-1 -2 -3 -4 -5',           '-1',  7, FALSE),
('a0000000-0000-4000-a000-000000000004', '2 3 -2 4',                 '7',   8, FALSE),
('a0000000-0000-4000-a000-000000000004', '-3 1 3 -1 2 -4 2',         '5',   9, FALSE),
('a0000000-0000-4000-a000-000000000004', '8 -19 5 -4 20',            '21', 10, FALSE),

-- ═══ Problem 5: Balanced Binary Tree ═════════════════════════════════════════
('a0000000-0000-4000-a000-000000000005', '1',                         'true',   1, FALSE),
('a0000000-0000-4000-a000-000000000005', '1 2 3',                     'true',   2, FALSE),
('a0000000-0000-4000-a000-000000000005', '3 9 20 -1 -1 15 7',         'true',   3, TRUE),
('a0000000-0000-4000-a000-000000000005', '1 2 -1 3',                  'false',  4, FALSE),
('a0000000-0000-4000-a000-000000000005', '1 2 2 3 3 -1 -1 4 4',       'false',  5, FALSE),
('a0000000-0000-4000-a000-000000000005', '1 2 3 4 5 6 7',             'true',   6, FALSE),
('a0000000-0000-4000-a000-000000000005', '1 2 3 4 -1 -1 -1 5',        'false',  7, FALSE),
('a0000000-0000-4000-a000-000000000005', '5 3 8 1 4 7 9',             'true',   8, FALSE),
('a0000000-0000-4000-a000-000000000005', '1 -1 2 -1 3',               'false',  9, FALSE),
('a0000000-0000-4000-a000-000000000005', '10 5 15 3 7 -1 20 1 -1 6',  'true',  10, FALSE),

-- ═══ Problem 6: Longest Substring Without Repeating ══════════════════════════
('a0000000-0000-4000-a000-000000000006', 'abcabcbb',                     '3',   1, TRUE),
('a0000000-0000-4000-a000-000000000006', 'bbbbb',                         '1',   2, FALSE),
('a0000000-0000-4000-a000-000000000006', 'pwwkew',                        '3',   3, FALSE),
('a0000000-0000-4000-a000-000000000006', 'a',                             '1',   4, FALSE),
('a0000000-0000-4000-a000-000000000006', 'au',                            '2',   5, FALSE),
('a0000000-0000-4000-a000-000000000006', 'dvdf',                          '3',   6, FALSE),
('a0000000-0000-4000-a000-000000000006', 'anviaj',                        '5',   7, FALSE),
('a0000000-0000-4000-a000-000000000006', 'tmmzuxt',                       '5',   8, FALSE),
('a0000000-0000-4000-a000-000000000006', 'aab',                           '2',   9, FALSE),
('a0000000-0000-4000-a000-000000000006', 'abcdefghijklmnopqrstuvwxyz',   '26',  10, FALSE),

-- ═══ Problem 7: Group Anagrams ════════════════════════════════════════════════
-- Output: words in group sorted alphabetically; groups sorted by first word; one per line
('a0000000-0000-4000-a000-000000000007', 'eat tea tan ate nat bat',    E'ate eat tea\nbat\nnat tan',              1, TRUE),
('a0000000-0000-4000-a000-000000000007', 'a',                           'a',                                     2, FALSE),
('a0000000-0000-4000-a000-000000000007', 'abc bca cab',                 'abc bca cab',                           3, FALSE),
('a0000000-0000-4000-a000-000000000007', 'foo bar ofo baz',             E'bar\nbaz\nfoo ofo',                   4, FALSE),
('a0000000-0000-4000-a000-000000000007', 'ab ba a b',                   E'a\nab ba\nb',                         5, FALSE),
('a0000000-0000-4000-a000-000000000007', 'cat act tac dog god',         E'act cat tac\ndog god',                6, FALSE),
('a0000000-0000-4000-a000-000000000007', 'x y z a b c',                 E'a\nb\nc\nx\ny\nz',                   7, FALSE),
('a0000000-0000-4000-a000-000000000007', 'listen silent enlist inlets', 'enlist inlets listen silent',          8, FALSE),
('a0000000-0000-4000-a000-000000000007', 'aa aa aa',                    'aa aa aa',                              9, FALSE),
('a0000000-0000-4000-a000-000000000007', 'abcd dcba bcda cdab efgh hgfe fghe', E'abcd bcda cdab dcba\nefgh fghe hgfe', 10, FALSE),

-- ═══ Problem 8: Coin Change ═══════════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000008', E'1 2 5\n11',        '3',   1, TRUE),
('a0000000-0000-4000-a000-000000000008', E'2\n3',             '-1',  2, FALSE),
('a0000000-0000-4000-a000-000000000008', E'1\n0',             '0',   3, FALSE),
('a0000000-0000-4000-a000-000000000008', E'1\n1',             '1',   4, FALSE),
('a0000000-0000-4000-a000-000000000008', E'1 2\n4',           '2',   5, FALSE),
('a0000000-0000-4000-a000-000000000008', E'1 5 10 25\n30',    '2',   6, FALSE),
('a0000000-0000-4000-a000-000000000008', E'2 5 10 1\n27',     '4',   7, FALSE),
('a0000000-0000-4000-a000-000000000008', E'3 5\n11',          '3',   8, FALSE),
('a0000000-0000-4000-a000-000000000008', E'2 4\n3',           '-1',  9, FALSE),
('a0000000-0000-4000-a000-000000000008', E'1 2 5 10 25 50\n100', '2', 10, FALSE),

-- ═══ Problem 9: 0/1 Knapsack ═════════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000009', E'3 50\n10 60\n20 100\n30 120',                     '220',  1, TRUE),
('a0000000-0000-4000-a000-000000000009', E'1 10\n5 10',                                       '10',   2, FALSE),
('a0000000-0000-4000-a000-000000000009', E'2 3\n4 3\n3 4',                                    '4',    3, FALSE),
('a0000000-0000-4000-a000-000000000009', E'3 5\n2 3\n3 4\n4 5',                              '7',    4, FALSE),
('a0000000-0000-4000-a000-000000000009', E'1 1\n2 3',                                         '0',    5, FALSE),
('a0000000-0000-4000-a000-000000000009', E'4 10\n5 4\n4 5\n3 6\n2 3',                       '14',   6, FALSE),
('a0000000-0000-4000-a000-000000000009', E'3 10\n2 60\n5 100\n10 120',                       '160',  7, FALSE),
('a0000000-0000-4000-a000-000000000009', E'5 15\n12 4\n1 2\n4 10\n1 1\n2 2',               '15',   8, FALSE),
('a0000000-0000-4000-a000-000000000009', E'3 7\n3 4\n4 5\n5 6',                              '9',    9, FALSE),
('a0000000-0000-4000-a000-000000000009', E'4 10\n6 30\n3 14\n4 16\n2 9',                    '46',  10, FALSE),

-- ═══ Problem 10: Course Schedule ══════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000010', E'2 1\n1 0',                               'true',   1, TRUE),
('a0000000-0000-4000-a000-000000000010', E'2 2\n1 0\n0 1',                          'false',  2, FALSE),
('a0000000-0000-4000-a000-000000000010', '3 0',                                      'true',   3, FALSE),
('a0000000-0000-4000-a000-000000000010', E'4 4\n1 0\n2 0\n3 1\n3 2',              'true',   4, FALSE),
('a0000000-0000-4000-a000-000000000010', E'3 3\n0 1\n1 2\n2 0',                   'false',  5, FALSE),
('a0000000-0000-4000-a000-000000000010', E'5 4\n1 0\n2 0\n3 1\n4 3',             'true',   6, FALSE),
('a0000000-0000-4000-a000-000000000010', '2 0',                                      'true',   7, FALSE),
('a0000000-0000-4000-a000-000000000010', E'6 6\n1 0\n2 1\n3 2\n4 3\n5 4\n0 5', 'false',  8, FALSE),
('a0000000-0000-4000-a000-000000000010', E'7 6\n1 0\n2 0\n3 1\n4 1\n5 2\n6 5', 'true',   9, FALSE),
('a0000000-0000-4000-a000-000000000010', E'10 9\n1 0\n2 0\n3 1\n4 1\n5 2\n6 2\n7 3\n8 4\n9 5', 'true', 10, FALSE),

-- ═══ Problem 11: Merge K Sorted Lists ════════════════════════════════════════
('a0000000-0000-4000-a000-000000000011', E'3\n1 4 5\n1 3 4\n2 6',             '1 1 2 3 4 4 5 6',           1, TRUE),
('a0000000-0000-4000-a000-000000000011', E'1\n1 2 3',                           '1 2 3',                     2, FALSE),
('a0000000-0000-4000-a000-000000000011', E'2\n1\n2',                             '1 2',                       3, FALSE),
('a0000000-0000-4000-a000-000000000011', E'2\n1 3\n2 4',                         '1 2 3 4',                   4, FALSE),
('a0000000-0000-4000-a000-000000000011', E'3\n1 2\n3 4\n5 6',                   '1 2 3 4 5 6',               5, FALSE),
('a0000000-0000-4000-a000-000000000011', E'2\n1 5 9\n2 3 7',                    '1 2 3 5 7 9',               6, FALSE),
('a0000000-0000-4000-a000-000000000011', E'3\n1\n2\n3',                          '1 2 3',                     7, FALSE),
('a0000000-0000-4000-a000-000000000011', E'4\n1 2 3\n4 5 6\n7 8 9\n10 11 12', '1 2 3 4 5 6 7 8 9 10 11 12', 8, FALSE),
('a0000000-0000-4000-a000-000000000011', E'2\n-1 0 2\n-3 1 3',                  '-3 -1 0 1 2 3',             9, FALSE),
('a0000000-0000-4000-a000-000000000011', E'4\n1 4 7 10\n2 5 8 11\n3 6 9 12\n0 13 14 15', '0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15', 10, FALSE),

-- ═══ Problem 12: Trapping Rain Water ════════════════════════════════════════
('a0000000-0000-4000-a000-000000000012', '0 1 0 2 1 0 1 3 2 1 2 1', '6',   1, TRUE),
('a0000000-0000-4000-a000-000000000012', '4 2 0 3 2 5',              '9',   2, FALSE),
('a0000000-0000-4000-a000-000000000012', '1',                         '0',   3, FALSE),
('a0000000-0000-4000-a000-000000000012', '1 2',                       '0',   4, FALSE),
('a0000000-0000-4000-a000-000000000012', '3 0 0 2 0 4',              '10',  5, FALSE),
('a0000000-0000-4000-a000-000000000012', '2 1 3 1 2',                '2',   6, FALSE),
('a0000000-0000-4000-a000-000000000012', '1 0 1',                     '1',   7, FALSE),
('a0000000-0000-4000-a000-000000000012', '3 1 2 4 0 1 3 2',          '8',   8, FALSE),
('a0000000-0000-4000-a000-000000000012', '5 2 1 2 1 5',              '14',  9, FALSE),
('a0000000-0000-4000-a000-000000000012', '3 1 0 0 2 4 0 3 5 0 1 2', '17', 10, FALSE),

-- ═══ Problem 13: N-Queens ════════════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000013', '4',  '2',    1, TRUE),
('a0000000-0000-4000-a000-000000000013', '1',  '1',    2, FALSE),
('a0000000-0000-4000-a000-000000000013', '2',  '0',    3, FALSE),
('a0000000-0000-4000-a000-000000000013', '3',  '0',    4, FALSE),
('a0000000-0000-4000-a000-000000000013', '5',  '10',   5, FALSE),
('a0000000-0000-4000-a000-000000000013', '6',  '4',    6, FALSE),
('a0000000-0000-4000-a000-000000000013', '7',  '40',   7, FALSE),
('a0000000-0000-4000-a000-000000000013', '8',  '92',   8, FALSE),
('a0000000-0000-4000-a000-000000000013', '9',  '352',  9, FALSE),
('a0000000-0000-4000-a000-000000000013', '10', '724', 10, FALSE),

-- ═══ Problem 14: Alien Dictionary ════════════════════════════════════════════
('a0000000-0000-4000-a000-000000000014', E'wrt\nwrf\ner\nett\nrftt', 'wertf', 1, TRUE),
('a0000000-0000-4000-a000-000000000014', E'z\nx\ny',                  'zxy',   2, FALSE),
('a0000000-0000-4000-a000-000000000014', E'ba\nbc\nac',               'bac',   3, FALSE),
('a0000000-0000-4000-a000-000000000014', E'a\nb\nc\nd\ne',            'abcde', 4, FALSE),
('a0000000-0000-4000-a000-000000000014', E'bca\ncab\nabc',            'bca',   5, FALSE),
('a0000000-0000-4000-a000-000000000014', E'zy\nzx\nyx',               'zyx',   6, FALSE),
('a0000000-0000-4000-a000-000000000014', E'ab\nba\nca\ncb',           'abc',   7, FALSE),
('a0000000-0000-4000-a000-000000000014', E'az\nbz\ncz\nza\nzb\nzc',  'abcz',  8, FALSE),
('a0000000-0000-4000-a000-000000000014', E'dcba\ncba\nba\na',         'dcba',  9, FALSE),
('a0000000-0000-4000-a000-000000000014', E'bcd\nacd\nabd\nabc',       'dcba', 10, FALSE),

-- ═══ Problem 15: Adding all listed numbers ═══════════════════════════════════
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'5\n1 2 3 4 5',                                                               '15',          1, TRUE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', '0',                                                                           '0',           2, FALSE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'1\n-1',                                                                      '-1',          3, FALSE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'3\n5 10 15',                                                                 '30',          4, FALSE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'4\n1 1 1 1',                                                                 '4',           5, FALSE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'5\n10 -10 20 -20 30',                                                        '30',          6, FALSE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'6\n1000000 2000000 3000000 -1000000 -2000000 -1000000',                      '2000000',     7, FALSE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'7\n2147483647 2147483647 2147483647 2147483647 2147483647 2147483647 2147483647', '15032385529', 8, FALSE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'10\n1 1 1 1 1 1 1 1 1 1',                                                    '10',          9, FALSE),
('a8f9a993-79ee-4e3b-ac66-f34ca8e70b12', E'10\n100 200 300 400 500 600 700 800 900 1000',                              '5500',       10, FALSE)
ON CONFLICT DO NOTHING;
