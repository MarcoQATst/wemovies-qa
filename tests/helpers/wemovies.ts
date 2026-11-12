import { expect, type Page, type TestInfo } from '@playwright/test';

export function cardDoFilme(page: Page, titulo: string) {
  return page.getByRole('heading', { name: titulo, exact: true }).locator('..');
}

export function itemDoCarrinho(page: Page, titulo: string) {
  return page.getByRole('img', { name: titulo, exact: true }).locator('..');
}

export async function adicionarFilme(page: Page, titulo: string) {
  await cardDoFilme(page, titulo)
    .getByRole('button', { name: /adicionar ao carrinho/i })
    .click();
}

export async function conferirItem(
  page: Page,
  titulo: string,
  quantidade: number,
  precoUnitario: string,
  subtotal: string,
) {
  const item = itemDoCarrinho(page, titulo);
  await expect(item).toBeVisible();
  await expect(item.locator('.title p').first()).toHaveText(titulo);
  await expect(item.locator('.title p').last()).toHaveText(precoUnitario);
  await expect(item.getByRole('spinbutton')).toHaveValue(String(quantidade));
  // Confere a versão do subtotal realmente exibida no tamanho de tela atual.
  await expect(item.locator('.subtotal-column:visible, .subtotal p:last-child:visible')).toHaveText(subtotal);
}

export async function conferirLarguraDaPagina(page: Page) {
  await expect.poll(async () => page.evaluate(() =>
    Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
      - document.documentElement.clientWidth,
  ), { message: 'A página não deve exigir rolagem horizontal' }).toBeLessThanOrEqual(1);
}

export function totalDaCompra(page: Page) {
  return page.getByText('Total', { exact: true }).locator('..').getByText(/^R\$/);
}

export async function anexarEvidencia(page: Page, testInfo: TestInfo, nome: string) {
  await testInfo.attach(nome, {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
}
