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
  const browser = await puppeteer.launch({headless: true, args: ["--no-sandbox"]});
  // 自動操作の様子を見たい場合は  headless: false, slowMo: 30
  const page = await browser.newPage();

  // ログイン
  await page.goto(`https://rspop.rakurakuseisan.jp/${config.companyId}/`);
  await page.type('input[name="loginId"]', config.loginId);
  await page.type('input[name="password"]', config.password);
  page.click('#submitBtn');
  await page.waitForTimeout(2000);
  console.log('ログインが完了しました');

  // 交通費精算
  await page.goto(`https://rspop.rakurakuseisan.jp/${config.companyId}/sapKotsuhiDenpyo/initializeView`);
  for (let i = 0; i < targetDate.length; i++) {
    page.click('button.meisai-insert-button--direct-add');
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
    await page.select('select[name="ohukuKbn"]', config.kotsuhiInfo.ohukuKbn); // 0 = 片道, 1 = 往復
    // 目的地
    await page.type('input[name="meisaiDestination"]', config.kotsuhiInfo.meisaiDestination);
    // 交通機関
    await page.select('select[name="kotsukikan"]', config.kotsuhiInfo.kotsukikan); // 74 = 電車（国内）, 78 = バス（国内）
    // 目的（詳細）
    await page.type('input[name="meisaiFreeText1"]', config.kotsuhiInfo.meisaiFreeText1);

    page.click('button.insertMeisai');
    await page.waitForTimeout(1000);

    console.log(`${targetDate[i]} の交通費明細を作成しました`);
  }

  // 一時保存
  page.click('button.save');
  await page.waitForTimeout(1000);
  console.log('明細を作成し一時保存しました');

  await browser.close();
})();

