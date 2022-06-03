const puppeteer = require('puppeteer');
const config = require("./config.json");

const year = Number(process.argv[2]);
const month = Number(process.argv[3]);
const day = String(process.argv[4]);
const excludeDate = String(process.argv[5]).split(',');

const dayOfWeekArray = [ "日", "月", "火", "水", "木", "金", "土" ];
const endOfMonth = new Date(year, month, 0).getDate();
const targetDate =
  Array
    .from(Array(endOfMonth).keys(), x => x + 1)
    .filter(date => excludeDate.indexOf(String(date)) === -1)
    .filter(date => day.includes(dayOfWeekArray[new Date(year, month - 1, date).getDay()]))
    .map(date => `${year}/${month}/${date}`);

console.log(targetDate);

(async () => {
  const browser = await puppeteer.launch(
    { defaultViewport: null, headless: true, args: ["--no-sandbox", "--start-fullscreen"] }
    // 自動操作の様子を見たい場合は  headless: false, slowMo: 30
  );
  const page = await browser.newPage();

  // ログイン
  await page.goto(`https://rspop.rakurakuseisan.jp/${config.companyId}/`);
  await page.type('input[name="loginId"]', config.loginId);
  await page.type('input[name="password"]', config.password);
  await page.click('#submitBtn');
  await page.waitForTimeout(2000);

  // 交通費精算
  const kotsuhiSeisanUrl =
    `https://rspop.rakurakuseisan.jp/${config.companyId}/sapKotsuhiDenpyo/initializeView`
  const response = await page.goto(kotsuhiSeisanUrl);
  if (response._url !== kotsuhiSeisanUrl) {
    console.log('ログインに失敗しました');
    await browser.close();
    return;
  }
  console.log('ログインに成功しました');
  await page.evaluate(() => { window.scroll(0, 0); });

  for (let i = 0; i < targetDate.length; i++) {
    await page.click('button.meisai-insert-button--direct-add');
    await page.waitForTimeout(1500);

    // 日付
    await page.keyboard.type(targetDate[i]);
    // 出発地点
    await page.type('input[name="startPoint"]', config.kotsuhiInfo.startPoint);
    // 到着地点
    await page.type('input[name="arrivalPoint"]', config.kotsuhiInfo.arrivalPoint);
    // 金額
    await page.type('input[name="kingaku"]', config.kotsuhiInfo.kingaku);
    // 往復/片道
    await page.select('select[name="ohukuKbn"]', config.kotsuhiInfo.ohukuKbn);
    // 目的地
    await page.type('input[name="meisaiDestination"]', config.kotsuhiInfo.meisaiDestination);
    // 交通機関
    await page.select('select[name="kotsukikan"]', config.kotsuhiInfo.kotsukikan);
    // 目的（詳細）
    await page.type('input[name="meisaiFreeText1"]', config.kotsuhiInfo.meisaiFreeText1);

    await page.click('button.insertMeisai');
    await page.waitForTimeout(1000);

    const error = await page.$('.banner--is-error')
    if (error) {
      console.log(`エラー: ${targetDate[i]} の交通費明細作成に失敗しました`);
      const messages =
        await error.$$eval('.banner__message', nodes => nodes.map(node => node.textContent));
      console.log(messages);
      await page.click('.meisai-editor__footer > .controls > .cancel');
    } else {
      console.log(`${targetDate[i]} の交通費明細を作成しました`);
    }
  }

  // 一時保存
  await page.click('button.save');
  await page.waitForTimeout(1000);
  console.log('明細を作成し一時保存しました');

  await browser.close();
})();

