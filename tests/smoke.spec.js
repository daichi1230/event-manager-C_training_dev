import { test, expect } from '@playwright/test';

test('admin can login and see dashboard', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('ユーザー名').fill('admin');
  await page.getByLabel('パスワード').fill('admin123');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page.getByRole('heading', { name: '管理ダッシュボード' })).toBeVisible();
  await expect(page.getByText('カテゴリ別イベント数')).toBeVisible();
});
