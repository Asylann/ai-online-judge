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

test.describe('Socratic Intervention Flow (E2E)', () => {
  test.beforeAll(async () => {
    await ensureTestUserSeeded();
  });

  test('Deliberate logic error triggers WA verdict and Virtual TA Socratic guidance', async ({ page }) => {
    // 1. Authentication
    await page.goto('/login');
    await page.getByPlaceholder('e.g. yutaka_lab_student').fill('yutaka_lab_student');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Sign In to Workspace' }).click();

    // Verify redirection to the / dashboard
    await expect(page).toHaveURL('/');

    // 2. Problem Selection (Problem 1: Two Sum)
    const solveLinks = page.getByRole('link', { name: /Solve Problem/i });
    if (await solveLinks.count() > 0) {
      await solveLinks.first().click();
    } else {
      await page.goto('/problems/a0000000-0000-4000-a000-000000000001');
    }

    // Verify we reached the workspace page
    await expect(page.getByRole('button', { name: /Submit to Sandbox/i })).toBeVisible({ timeout: 15000 });

    // 3. Workspace Interaction: Inject Python solution with a deliberate logic error
    const incorrectCode = `import sys

def solve():
    # Deliberately returning incorrect indices to trigger a structural/logical WA
    print("0 0")

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
    }, incorrectCode);

    // 4. Submission & Verdict
    await page.getByRole('button', { name: /Submit to Sandbox/i }).click();

    // Assert that the WebSocket pushes the status WA (Wrong Answer)
    await expect(page.getByText('WA').first()).toBeVisible({ timeout: 30000 });

    // Assert that VirtualTAPanel slides into view and contains Socratic guidance text
    await expect(page.getByText('Virtual TA').first()).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByText('Minimal Edit Guidance')
        .or(page.getByText('Socratic Hint'))
        .or(page.getByText('Socratic pedagogy'))
        .first()
    ).toBeVisible({ timeout: 30000 });
  });
});
