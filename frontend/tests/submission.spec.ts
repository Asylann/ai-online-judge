import { test, expect } from '@playwright/test';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper to guarantee our test student user is registered/seeded before running the test
async function ensureTestUserSeeded() {
  try {
    await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'yutaka_lab_student',
        email: 'student@u-aizu.ac.jp',
        password: 'password123',
      }),
    });
  } catch (err) {
    // Ignore if API gateway is warming up or user already exists
  }
}

test.describe('Submission-to-Verdict Lifecycle (E2E)', () => {
  test.beforeAll(async () => {
    await ensureTestUserSeeded();
  });

  test('Valid Python submission results in Accepted verdict without Virtual TA intervention', async ({ page }) => {
    // 1. Authentication
    await page.goto('/login');
    await page.getByPlaceholder('e.g. yutaka_lab_student').fill('yutaka_lab_student');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Sign In to Workspace' }).click();

    // Verify redirection to the / dashboard
    await expect(page).toHaveURL('/');

    // 2. Problem Selection
    // Navigate to a problem workspace (Problem 1: Two Sum)
    const solveLinks = page.getByRole('link', { name: /Solve Problem/i });
    if (await solveLinks.count() > 0) {
      await solveLinks.first().click();
    } else {
      await page.goto('/problems/a0000000-0000-4000-a000-000000000001');
    }

    // Verify we reached the workspace page
    await expect(page.getByRole('button', { name: /Submit to Sandbox/i })).toBeVisible({ timeout: 15000 });

    // 3. Workspace Interaction: Inject valid Python solution for Two Sum
    const validCode = `import sys

def solve():
    lines = sys.stdin.read().split()
    if len(lines) < 2:
        return
    nums = [int(x) for x in lines[:-1]]
    target = int(lines[-1])
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == "__main__":
    solve()
`;

    // Inject code into Monaco Editor
    const editorTextarea = page.locator('.monaco-editor textarea');
    await editorTextarea.waitFor({ state: 'attached' });
    await page.evaluate((newCode) => {
      const monaco = (window as any).monaco;
      if (monaco && monaco.editor && monaco.editor.getModels().length > 0) {
        monaco.editor.getModels()[0].setValue(newCode);
      }
    }, validCode);

    // 4. Submission & Verdict
    await page.getByRole('button', { name: /Submit to Sandbox/i }).click();

    // Assert that the WebSocket dynamically updates the UI to show an "Accepted" verdict
    await expect(page.getByText('Accepted').first()).toBeVisible({ timeout: 30000 });

    // Assert multi-test progress bar indicates complete success
    await expect(page.getByText('10 / 10 passed')).toBeVisible();

    // Verify the "Virtual TA" panel (Minimal Edit Guidance) does NOT appear since the code is correct
    await expect(page.getByText('Minimal Edit Guidance')).not.toBeVisible();
  });
});
