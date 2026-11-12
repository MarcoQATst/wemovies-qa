import { test, expect } from '@playwright/test';
import {
  adicionarFilme,
  anexarEvidencia,
  cardDoFilme,
  conferirItem,
  conferirLarguraDaPagina,
  itemDoCarrinho,
  totalDaCompra,
} from './helpers/wemovies';

test.describe('WeMovies - Fluxo de compra', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /0 itens$/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Morbius', exact: true })).toBeVisible();
    await conferirLarguraDaPagina(page);
    if (isMobile) {
      const primeiro = await cardDoFilme(page, 'Viúva Negra').boundingBox();
      const segundo = await cardDoFilme(page, 'Shang-chi').boundingBox();
      expect(primeiro, 'O primeiro card deve ocupar espaço no layout').not.toBeNull();
      expect(segundo, 'O segundo card deve ocupar espaço no layout').not.toBeNull();
      expect(Math.abs(primeiro!.x - segundo!.x)).toBeLessThanOrEqual(1);
      expect(segundo!.y).toBeGreaterThanOrEqual(primeiro!.y + primeiro!.height);
    }
  });

  test('CT1 - Adicionar filmes diferentes e conferir o total', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'Cenário manual', description: 'CT03' });
    await test.step('Adicionar Morbius e Batman pela Home', async () => {
      await expect(cardDoFilme(page, 'Morbius').getByText('R$ 1,50')).toBeVisible();
      await expect(cardDoFilme(page, 'Batman').getByText('R$ 21,90')).toBeVisible();
      await adicionarFilme(page, 'Morbius');
      await adicionarFilme(page, 'Batman');
      await expect(cardDoFilme(page, 'Morbius').getByRole('button')).toContainText('1');
      await expect(cardDoFilme(page, 'Batman').getByRole('button')).toContainText('1');
    });

    await test.step('Conferir produtos, quantidades, subtotais e total no carrinho', async () => {
      await page.getByRole('button', { name: /2 itens$/ }).click();
      await expect(page).toHaveURL(/\/cart$/);
      await expect(page.getByRole('spinbutton')).toHaveCount(2);
      await conferirItem(page, 'Morbius', 1, 'R$ 1,50', 'R$ 1,50');
      await conferirItem(page, 'Batman', 1, 'R$ 21,90', 'R$ 21,90');
      await expect(page.getByRole('button', { name: /2 itens$/ })).toBeVisible();
      await expect(totalDaCompra(page)).toHaveText('R$ 23,40');
      await conferirLarguraDaPagina(page);
      await anexarEvidencia(page, testInfo, 'Carrinho com dois filmes - R$ 23,40');
    });
  });

  test('CT2 - Aumentar a quantidade e recalcular a compra', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'Cenário manual', description: 'CT04' });
    await test.step('Preparar o carrinho com duas Viúvas Negras e um Morbius', async () => {
      await adicionarFilme(page, 'Viúva Negra');
      await adicionarFilme(page, 'Viúva Negra');
      await adicionarFilme(page, 'Morbius');
      await page.getByRole('button', { name: /3 itens$/ }).click();
      await expect(page).toHaveURL(/\/cart$/);
      await expect(page.getByRole('spinbutton')).toHaveCount(2);
      await conferirItem(page, 'Viúva Negra', 2, 'R$ 9,99', 'R$ 19,98');
      await conferirItem(page, 'Morbius', 1, 'R$ 1,50', 'R$ 1,50');
      await expect(totalDaCompra(page)).toHaveText('R$ 21,48');
    });

    await test.step('Aumentar uma unidade e conferir os valores atualizados', async () => {
      // Os botões não têm nome acessível: dentro de .counter, a ordem é menos/mais.
      await itemDoCarrinho(page, 'Viúva Negra').locator('.counter button').nth(1).click();
      await conferirItem(page, 'Viúva Negra', 3, 'R$ 9,99', 'R$ 29,97');
      await conferirItem(page, 'Morbius', 1, 'R$ 1,50', 'R$ 1,50');
      await expect(page.getByRole('spinbutton')).toHaveCount(2);
      await expect(page.getByRole('button', { name: /4 itens$/ })).toBeVisible();
      await expect(totalDaCompra(page)).toHaveText('R$ 31,47');
      await conferirLarguraDaPagina(page);
      await anexarEvidencia(page, testInfo, 'Quantidade alterada - R$ 31,47');
    });
  });

  test('CT3 - Finalizar a compra e manter o carrinho vazio ao voltar', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'Cenário manual', description: 'CT10' });
    await test.step('Adicionar Homem Aranha e conferir o pedido', async () => {
      await expect(cardDoFilme(page, 'Homem Aranha').getByText('R$ 29,90')).toBeVisible();
      await adicionarFilme(page, 'Homem Aranha');
      await page.getByRole('button', { name: /1 item$/ }).click();
      await expect(page).toHaveURL(/\/cart$/);
      await expect(page.getByRole('spinbutton')).toHaveCount(1);
      await conferirItem(page, 'Homem Aranha', 1, 'R$ 29,90', 'R$ 29,90');
      await expect(totalDaCompra(page)).toHaveText('R$ 29,90');
    });

    await test.step('Finalizar e conferir a confirmação e o contador zerado', async () => {
      await page.getByRole('button', { name: 'Finalizar pedido', exact: true }).click();
      await expect(page).toHaveURL(/\/purchase-made$/);
      await expect(page.getByRole('heading', { name: 'Compra realizada com sucesso!' })).toBeVisible();
      await expect(page.getByRole('button', { name: /0 itens$/ })).toBeVisible();
      await conferirLarguraDaPagina(page);
      await anexarEvidencia(page, testInfo, 'Compra confirmada');
    });

    await test.step('Voltar pelo navegador e conferir que o pedido não foi restaurado', async () => {
      await page.goBack();
      await expect(page).toHaveURL(/\/cart$/);
      await expect(page.getByRole('heading', { name: 'Parece que não há nada por aqui :(' })).toBeVisible();
      await expect(page.getByRole('button', { name: /0 itens$/ })).toBeVisible();
      await expect(page.getByRole('spinbutton')).toHaveCount(0);
      await expect(page.getByRole('img', { name: 'Homem Aranha', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Finalizar pedido', exact: true })).toHaveCount(0);
      await expect(totalDaCompra(page)).toHaveCount(0);
      await conferirLarguraDaPagina(page);
      await anexarEvidencia(page, testInfo, 'Carrinho vazio após a compra');
    });
  });
});

